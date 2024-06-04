<?php

namespace Stanford\GroupChatTherapy;

include_once "emLoggerTrait.php";
require_once "classes/UserSession.php";
require_once "classes/Action.php";
require_once "classes/Sanitizer.php";
require_once "classes/RepeatingForms.php";
require_once "vendor/autoload.php";

use App\User;
use Exception;
use REDCap;
use Twilio\Exceptions\TwilioException;
use Twilio\Rest\Client;
use function PHPUnit\Framework\isEmpty;

class GroupChatTherapy extends \ExternalModules\AbstractExternalModule
{
    use emLoggerTrait;

    const BUILD_FILE_DIR = 'group-chat-therapy-ui/dist/assets/';

    public function __construct()
    {
        parent::__construct();
    }

    function redcap_module_link_check_display($project_id, $link)
    {
        if (isset($link) && array_key_exists('url', $link) && str_contains($link['url'], 'root')) {
            $link['url'] = $link['url'] . '&NOAUTH';
        }
        return $link;
    }

    /**
     * Helper method for inserting the JSMO JS into a page along with any preload data
     * @param $data
     * @param $init_method
     * @return void
     */
    public function injectJSMO($data = null, $init_method = null): void
    {
        // Temporary Workaround for 14.3 bug not including External Module functions in window
        require APP_PATH_DOCROOT . "ExternalModules/manager/templates/hooks/every_page_top.php";
        echo $this->initializeJavascriptModuleObject();
        $cmds = [
            "const module = " . $this->getJavascriptModuleObjectName()
        ];
        if (!empty($data)) $cmds[] = "module.data = " . json_encode($data);
        if (!empty($init_method)) $cmds[] = "module.afterRender(module." . $init_method . ")";
        ?>
        <script src="<?= $this->getUrl("assets/jsmo.js", true) ?>"></script>
        <script>
            $(function () { <?php echo implode(";\n", $cmds) ?> })
        </script>
        <?php
    }

    /**
     * @return array
     * Scans dist directory for frontend build files for dynamic injection
     */
    public function generateAssetFiles(): array
    {
        $cwd = $this->getModulePath();
        $full_path = $cwd . self::BUILD_FILE_DIR;
        $dir_files = scandir($full_path);

        if (!$dir_files) {
            $this->emError("No directory files found in $full_path");
            return [];
        }

        foreach ($dir_files as $key => $file) {
            if ($file === '.' || $file === '..') {
                unset($dir_files[$key]);
            } else { //Generate url and script html
                $url = $this->getUrl(self::BUILD_FILE_DIR . $file);
                $this->emLog($file, $url);

                $html = '';
                if (str_contains($url, 'js?'))
                    $html = "<script type='module' crossorigin src='{$url}'></script>";
                elseif (str_contains($url, '.css?'))
                    $html = "<link rel='stylesheet' href='{$url}'>";
                $dir_files[$key] = $html;
            }
        }
        return $dir_files;
    }

    /**
     * Returns survey URLs for a given therapy session
     * @param string $therapy_session_id
     * @param bool $complete
     * @return array
     */
    public function fetchSurveyUrls(string $therapy_session_id, bool|null $complete = false): array
    {
        $index = $complete ? "ts_post_survey_list" : "ts_pre_survey_list";
        $params = array(
            "return_format" => "json",
            "fields" => array($index),
            "redcap_event_name" => "therapy_session_arm_1",
            "records" => array($therapy_session_id)
        );

        $json = json_decode(REDCap::getData($params), true);
        if (count($json)) {
            $trimmed = preg_replace('/\s+/', '', trim(current($json)[$index]));
            return explode(',', $trimmed);
        } else {
            return [];
        }

    }


    /**
     * @param string $participant_id
     * @param string $therapy_session_id
     * @param string $event_id
     * @return int
     * @throws Exception
     */
    public function findSurveyInstance(string $participant_id, string $therapy_session_id, string $event_id): int
    {
        $rForm = new RepeatingForms('assessment_details', $event_id, $this->getProjectId());
        $rForm->loadData($participant_id);
        $instances = $rForm->getAllInstances($participant_id);

        $selected_instance = -1;
        foreach ($instances as $k => $instance) //Find index of instance corresponding to current therapy session
            if ($instance['assessment_ts_id'] === $therapy_session_id) {
                $selected_instance = intval($k);
                break;
            }

        /**
         * User does not have event with given therapy session
         * This may occur when user ID is added to TS textbox without creating a new event
         */
        if ($selected_instance === -1)
            throw new Exception("User id $participant_id has been added to a Therapy session without a repeating event " . $therapy_session_id . ", please contact your administrator");

        return $selected_instance;
    }

    /**
     * @param $payload
     * @return array
     */
    public function getUserSurveys($payload): array
    {
        try {
            if (empty($payload['participant_id']) || empty($payload['therapy_session_id']))
                throw new Exception('Incorrect payload passed');

            // Grab all survey urls for a given therapy session
            $expl = $this->fetchSurveyUrls($payload['therapy_session_id'], $payload['completed']);
            $event_id = REDCap::getEventIdFromUniqueEvent('assessments_arm_2');

            $required_survey_urls = [];
            $fields = [];

            // Get survey instance (index) of corresponding therapy session
            $ts_survey_instance = $this->findSurveyInstance($payload['participant_id'], $payload['therapy_session_id'], $event_id);

            // Iterate through surveys, gathering URL and complete key
            foreach ($expl as $instrument) {
                $url = REDCap::getSurveyLink($payload['participant_id'], strtolower($instrument), $event_id, $ts_survey_instance);
                if (isset($url)) { //If the survey actually exists
                    $required_survey_urls[strtolower($instrument)] = ['url' => $url];
                    $fields[] = strtolower($instrument) . "_complete";
                }
            }

            // Get subsequent data
            if (count($fields)) {
                $params = [
                    "project_id" => $this->getProjectId(),
                    "records" => $payload['participant_id'],
                    "events" => $event_id,
                    "fields" => $fields
                ];
                $record_data = REDCap::getData($params);
                $rei_parent = $record_data[$payload['participant_id']]["repeat_instances"][$event_id][''][$ts_survey_instance];

                // Format data
                foreach ($rei_parent as $k => $v) {
                    $survey = str_replace('_complete', '', $k);
                    $required_survey_urls[$survey]['complete'] = $v;
                }

                $return_o["result"] = json_encode($required_survey_urls); //Necessary result key for returning via JSMO
                return $return_o;
            }
            return ["result" => json_encode(['no_surveys_required' => 1])];

        } catch (\Exception $e) {
            $msg = $e->getMessage();
            \REDCap::logEvent("Error: $msg");
            $this->emError("Error: $msg");
            $ret = json_encode(array(
                'error' => array(
                    'msg' => $msg,
                ),
            ));

            return ["result" => $ret];
        }
    }

    /**
     * @param $payload
     * @return array
     */
    public function checkUserCompletion($payload): array
    {
        try {
            if (empty($payload['participant_ids']) || empty($payload['therapy_session_id']))
                throw new Exception('Incorrect payload passed');
            $complete_ids = [];
            foreach ($payload['participant_ids'] as $participant) {
                $surveyCompletionList = $this->getUserSurveys(array('participant_id' => $participant, 'therapy_session_id' => $payload['therapy_session_id']));
//                if($surveyCompletionList)
                if (count($surveyCompletionList)) {
                    $surveyCompletionList = json_decode($surveyCompletionList["result"], true);
                    if (array_key_exists('no_surveys_required', $surveyCompletionList)) { //Ignore sessions that return no survey required
                        $complete_ids[$participant] = true;
                    } else {
                        if (array_key_exists('error', $surveyCompletionList))
                            throw new Exception($surveyCompletionList['error']['msg']);

                        foreach ($surveyCompletionList as $survey)
                            if ($survey['complete'] === '2') { //complete
                                $complete_ids[$participant] = true;
                            } else {
                                $complete_ids[$participant] = false;
                                break;
                            }
                    }
                }
            }
            return ["result" => json_encode($complete_ids)];

        } catch (\Exception $e) {
            $msg = $e->getMessage();
            \REDCap::logEvent("Error: $msg");
            $this->emError("Error: $msg");
            $ret = json_encode(array(
                'error' => array(
                    'msg' => $msg,
                ),
            ));

            return ["result" => $ret];
        }
    }

    /**
     * @param $phone
     * @return string
     */
    public function parsePhoneField($phone)
    {
        if ($phone) {
            $replace = array("(", ")", " ", "-");
            return str_replace($replace, "", $phone);
        }
    }

    /**
     * Sanitizes user input in the action queue nested array
     * @param $payload
     * @return array|null
     */
    public function sanitizeInput($payload): array|string
    {
        $sanitizer = new Sanitizer();
        return $sanitizer->sanitize($payload);
    }

    /**
     * Send SMS with body payload
     * @param $body
     * @param $phone_number
     * @return void
     * @throws TwilioException
     */
    public function sendSMS($body, $phone_number): void
    {
        $sid = $this->getSystemSetting('twilio-sid');
        $auth = $this->getSystemSetting('twilio-auth-token');
        $fromNumber = $this->getSystemSetting('twilio-from-number');

        $twilio = new Client($sid, $auth);

        $twilio->messages
            ->create(
                "$phone_number",
                array(
                    'body' => $body,
                    'from' => $fromNumber
                )
            );
    }

    /**
     * Generates OTP and saves to record
     * @param $record
     * @param $phone_number
     * @return void
     * @throws Exception
     */
    public function generateOneTimePassword($record, $phone_number): void
    {
        $code = bin2hex(random_bytes(3));
        $saveData = array(
            array(
                "record_id" => $record,
                "participant_otp_code" => $code,
                "participant_otp_code_ts" => date("Y-m-d H:i:s"),
                "redcap_event_name" => "participant_arm_2"
            )
        );

        $response = REDCap::saveData('json', json_encode($saveData), 'overwrite');

        if (empty($response['errors'])) {
            $body = "Your Group Therapy verification code is: $code";
            $this->sendSMS($body, $phone_number);
        } else {
            throw new Exception('Save data failure');
        }
    }

    /**
     * Verifies phone number and last name fields are part of cohort
     * @param $payload
     * @return bool
     */
    public function validateUserPhone($payload): bool
    {
        try {

            //Sanitize inputs
            $display_name = $this->sanitizeInput($payload[0]);
            $phone_number = $this->sanitizeInput($payload[1]);
            $phone_number_truncated = ltrim($phone_number, '1');

            $params = array(
                "return_format" => "json",
                "fields" => array("participant_phone_number", "participant_display_name", "record_id"),
                "events" => array("participant_arm_2"),
            );

            $json = REDCap::getData($params);
            $json = json_decode($json);
            foreach ($json as $entry) {
                $phoneParsed = $this->parsePhoneField($entry->participant_phone_number);
                if (strtolower($entry->participant_display_name) === strtolower($display_name) && $phoneParsed === $phone_number_truncated) {
                    $this->generateOneTimePassword($entry->record_id, $phoneParsed);
                    return true;
                }
            }

//            TODO: RATE LIMITING
            throw new Exception ("Invalid credentials");

        } catch (\Exception $e) {
            $msg = $e->getMessage();
            \REDCap::logEvent("Error: $msg");
            $this->emError("Error: $msg");

            echo json_encode(array(
                'error' => array(
                    'msg' => $e->getMessage(),
                ),
            ));
            die;
        }
    }

    /**
     * Validates code sent via SMS
     * @param $code
     * @return array
     */
    public function validateCode($code): array
    {
        //Sanitize input
        try {
            $code = strtolower($this->sanitizeInput($code));

            $params = array(
                "return_format" => "json",
                "fields" => array(
                    "participant_otp_code",
                    "participant_otp_code_ts",
                    "participant_first_name",
                    "participant_last_name",
                    "record_id",
                    "admin"
                ),
                "events" => array("participant_arm_2"),
            );

            $json = json_decode(REDCap::getData($params), true);

            foreach ($json as $record) {
                if ($record['participant_otp_code'] === $code) {
                    if (!empty($record['participant_otp_code_ts'])) { //Check if OTP code has been generated recently
                        $timeDifference = strtotime("now") - strtotime($record['participant_otp_code_ts']);
                        if ($timeDifference < 3600) { //60 minute interval to login before having to retry
                            //Deleting code from return payload
                            unset($record['participant_otp_code']);
                            unset($record['participant_otp_code_ts']);
                            $returnPayload['current_user'] = $record;

                            $return_o["result"] = json_encode($returnPayload); //Necessary result key for returning via JSMO
                            return $return_o;

                        } else {
                            throw new Exception ("Code has expired, please refresh and try logging in again");
                        }
                    }
                }

            }
            throw new Exception ('Invalid code');
//            return false;

        } catch (\Exception $e) {
            $msg = $e->getMessage();
            \REDCap::logEvent("Error: $msg");
            $this->emError("Error: $msg");

            echo json_encode(array(
                'error' => array(
                    'msg' => $e->getMessage(),
                ),
            ));
            die;
        }

    }

    /**
     * Grab session details for a given user ID
     * @param $record
     * @return array
     */
    public function getUserSessions($record): array
    {
        $params = array(
            "return_format" => "json",
            "fields" => array(
                "record_id",
                "ts_status",
                "ts_start",
                "ts_start_2",
                "ts_authorized_participants",
                "ts_chat_room_participants",
                "ts_title",
                "ts_therapist",
                "ts_topic",
                "ts_whiteboard"
            ),
            "events" => array("therapy_session_arm_1"),
        );

        $full_sessions = json_decode(REDCap::getData($params), true); //Grab all therapy sessions
        $user_sessions = [];

        foreach ($full_sessions as $session) {
            $participants_arr = !empty($session['ts_authorized_participants']) ? explode(",", $session['ts_authorized_participants']) : [];
            $in_chat_arr = !empty($session['ts_chat_room_participants']) ? explode(",", $session['ts_chat_room_participants']) : [];
            if ($record['admin']) {
                $session['ts_authorized_participants'] = $participants_arr; //Save as array
                $session['ts_chat_room_participants'] = $in_chat_arr;
                $user_sessions[] = $session;
            } else if (in_array($record['record_id'], $participants_arr) || in_array($record['record_id'], $in_chat_arr)) { // If user is a part of either participant field or in chat field
                $session['ts_authorized_participants'] = $participants_arr; //Save as array
                $session['ts_chat_room_participants'] = $in_chat_arr;
                $user_sessions[] = $session;
            }
        }

        return ["result" => json_encode($user_sessions)]; //Necessary result key for returning via JSMO

    }

    /**
     * Given an array of record IDs, find the affiliated participant records
     * @param $payload
     * @return array
     */
    public function getParticipants($payload): array
    {
        try {
            if (!isset($payload['participants']) || sizeof($payload['participants']) === 0) {
                throw new Exception('No record_id passed');
            }
            $params = array(
                "return_format" => "json",
                "records" => $payload['participants'],
                "fields" => array(
                    "record_id",
                    "participant_first_name",
                    "admin",
                    "participant_status"
                ),
                "events" => array("participant_arm_2"),
            );

            $json = json_decode(REDCap::getData($params, true));
            $returnPayload["data"] = $json;
            return ["result" => json_encode($returnPayload)];
        } catch (\Exception $e) {
            $msg = $e->getMessage();
            \REDCap::logEvent("Error: $msg");
            $this->emError("Error: $msg");
            return ["result" => json_encode($msg)];
        }

    }

    /**
     * @param $payload
     * @return array
     */
    public function updateParticipants($payload): array
    {
        try {
            if (empty($payload['record_id']) || empty($payload['action']) || empty($payload['participant_id']))
                throw new Exception('Incorrect payload passed to updateParticipants');

            $params = array(
                "return_format" => "json",
                "records" => array($payload['record_id']),
                "fields" => array(
                    "record_id",
                    "ts_status",
                    "ts_start",
                    "ts_start_2",
                    "ts_therapist",
                    "ts_authorized_participants",
                    "ts_chat_room_participants",
                    "ts_title",
                    "ts_topic"
                ),
                "events" => array("therapy_session_arm_1"),
            );

            $json = json_decode(REDCap::getData($params), true);


            if (sizeof($json)) {
                $data = current($json);
                $participants_arr = !empty($data['ts_authorized_participants']) ? explode(",", $data['ts_authorized_participants']) : [];
                $in_chat_arr = !empty($data['ts_chat_room_participants']) ? explode(",", $data['ts_chat_room_participants']) : [];

                if ($payload['action'] === 'admit') {
                    $index = array_search($payload['participant_id'], $participants_arr);

                    if ($index !== false) {
                        $in_chat_arr[] = $participants_arr[$index]; //Append participant to in_chat and remove from participants array
                        unset($participants_arr[$index]);
                    }
                } else if ($payload['action'] === 'revoke') {
                    $index = array_search($payload['participant_id'], $in_chat_arr);
                    if ($index !== false) {

                        $participants_arr[] = $in_chat_arr[$index];
                        unset($in_chat_arr[$index]);
                    }
                } else {
                    throw new Exception('Action specified in payload is incorrect');
                }

                $data['ts_chat_room_participants'] = array_values($in_chat_arr);
                $data['ts_authorized_participants'] = array_values($participants_arr);

                $saveData = array(
                    array(
                        "record_id" => $payload['record_id'],
                        "ts_authorized_participants" => implode(',', $participants_arr),
                        "ts_chat_room_participants" => implode(',', $in_chat_arr),
                        "redcap_event_name" => "therapy_session_arm_1"
                    )
                );

                $response = REDCap::saveData('json', json_encode($saveData), 'overwrite');
                if (!empty($response['errors'])) {
                    $this->emError("Could not update record with " . json_encode($response['errors']));
                    throw new Exception("Could not update record with " . json_encode($response['errors']));
                }
                $returnPayload["data"] = $data;
                return ["result" => json_encode($returnPayload)];
            } else {
                $rec = $payload['record_id'];
                throw new Exception("Get data call returned no results given record_id $rec");
            }
        } catch (\Exception $e) {
            $msg = $e->getMessage();
            \REDCap::logEvent("Error: $msg");
            $this->emError("Error: $msg");
            return ["result" => json_encode($msg)];
        }
    }

    /**
     * Grab Whiteboard for a given session
     * @param $payload
     * @return array
     */
    public function getWhiteboard($payload): array
    {
        try {

            if (empty($payload['record_id']))

                throw new Exception('No Record ID passed');

            $params = array(
                "return_format" => "json",
                "records" => array($payload['record_id']),
                "fields" => array(
                    "ts_whiteboard",
                ),
                "events" => array("therapy_session_arm_1"),
            );

            $json = json_decode(REDCap::getData($params), true);

            $returnPayload["data"] = $json;
            return ["result" => json_encode($returnPayload)];

        } catch (\Exception $e) {
            $msg = $e->getMessage();
            \REDCap::logEvent("Error: $msg");
            $this->emError("Error: $msg");
            return ["result" => json_encode($msg)];
        }

    }

    /**
     * Set whiteboard content given a session
     * @param $payload
     * @return array
     */

    public function setWhiteboard($payload): array
    {
        try {
            if (empty($payload['ts_whiteboard']) || empty($payload['record_id']))

                throw new Exception('Incorrect parameters passed to setWhiteboard');

            $saveData = array(
                array(
                    "record_id" => $payload['record_id'],
                    "ts_whiteboard" => $payload['ts_whiteboard'],
                )
            );

            $response = REDCap::saveData('json', json_encode($saveData), 'overwrite');
            if (!empty($response['errors'])) {
                $this->emError("Could not update record with " . json_encode($response['errors']));
                throw new Exception("Could not update record with " . json_encode($response['errors']));
            }

            $returnPayload["data"] = "Success";
            return ["result" => json_encode($returnPayload)];

        } catch (\Exception $e) {
            $msg = $e->getMessage();
            \REDCap::logEvent("Error: $msg");
            $this->emError("Error: $msg");
            return ["result" => json_encode($msg)];
        }
    }

    /**
     * Shifts participants from in_chat_session to finished
     * @param string $session_id
     * @return void
     */
    public function endChatSession(string $session_id, string $user_id, string $isAdmin): void
    {
        $params = array(
            "return_format" => "json",
            "records" => array($session_id),
            "fields" => array(
                "ts_status",
                "ts_start",
                "ts_start_2",
                "ts_authorized_participants",
                "ts_chat_room_participants",
                "ts_finished_participants",
            ),
            "events" => array("therapy_session_arm_1")
        );

        $json = json_decode(REDCap::getData($params), true);
        $chat_room_participants = current($json)['ts_chat_room_participants'];

        $actions = $this->getActions($session_id, $user_id, $isAdmin); //Grab log table with all actions
        $stringify = json_encode($actions['data']);
        $fields = array(
            "record_id" => $session_id,
            "ts_status" => "2",
            "ts_json" => $stringify,
            "redcap_event_name" => "therapy_session_arm_1"
        );

        if ($chat_room_participants) {
            $fields["ts_finished_participants"] = $chat_room_participants;
            $fields["ts_chat_room_participants"] = "";
        }

        REDCap::saveData('json', json_encode(array($fields)), 'overwrite');
    }

    /**
     * Polling function will call this endpoint.
     * @param array $payload
     * @return array
     */
    public function handleActions(array $payload): array
    {
        try {

            $max = intval(($payload['maxID'])) ?? 0;
            $session_id = $payload['sessionID'];
            $user_id = $payload['userID'];
            $actionQueue = $payload['actionQueue'] ?? [];
            $endChatSession = $payload['endChatSession'];
            $isAdmin = $payload['isAdmin']; //Accepted from client to prevent more getData calls

            if (empty($session_id) || empty($user_id))
                throw new Exception('Either session ID or User ID is null');

            $start = hrtime(true);
            if ($endChatSession) { //If attempting to end the session, process participants
                $this->endChatSession($session_id, $user_id, $isAdmin);
            }

            if (count($actionQueue)) { //User has actions to process
                $this->addAction($actionQueue, $session_id);
            }

            //If no event queue has been passed, simply return actions
            $ret = $this->getActions($session_id, $user_id, $isAdmin, $max);

            $stop = hrtime(true);
            $ret['serverTime'] = ($stop - $start) / 1000000;

            return $ret;

        } catch (\Exception $e) {
            $msg = $e->getMessage();
            \REDCap::logEvent("Error: $msg");
            $this->emError("Error: $msg");

            echo json_encode(array(
                'error' => array(
                    'msg' => $e->getMessage(),
                ),
            ));
            die;
        }
    }

    /**
     * Creates an action in the log table
     * @param array $actions
     * @return void
     * @throws Exception
     */
    public function addAction(array $actions, string $session_id): void
    {
        try {
            if (!isset($session_id))
                throw new Exception('No session id passed to action');

            $this->emDebug("Adding actions", $actions);
            foreach ($actions as $k => $v) {
                $action = new Action($this);

                $action->setValue('session_id', $session_id);
                $action->setValue('message', json_encode($v));
                $action->save();
                $this->emDebug("Added action " . $action->getId());
            }
        } catch (\Exception $e) {
            $msg = $e->getMessage();
            \REDCap::logEvent("Error: $msg");
            $this->emError("Error: $msg");

            echo json_encode(array(
                'error' => array(
                    'msg' => $e->getMessage(),
                ),
            ));
            die;
        }

    }

    /**
     * Grab actions from log table
     * @param int $max
     * @return array[]
     * @throws Exception
     */
    public function getActions(string $session_id, string $user_id, bool $isAdmin, int $max = 0): array
    {
        $results = [];
        $project_id = $this->getProjectId();
        $actions = Action::getActionsAfter($this, $project_id, $max, $session_id);

        foreach ($actions as $v) {
            $action = $v->getAction();
            if ($action['type'] === 'delete') {
                $target = $action['target'];
                if (isset($results[$target])) {
                    unset($results[$target]);
                    continue;
                }
            }
            //There are direct messages in the payload that must be filtered
            if (!empty($action['recipients']) && $action['recipients'] !== 'groupChat' && !$isAdmin) {
                if ($action['user'] !== $user_id && $action['recipients'][0] !== $user_id) //Filter out messages not written by or intended for
                    continue;
            }

            $results[$v->getId()] = $action;
        }

        return [
            "data" => $results
        ];
    }


    /**
     * This is the primary ajax handler for JSMO calls
     * @param $action
     * @param $payload
     * @param $project_id
     * @param $record
     * @param $instrument
     * @param $event_id
     * @param $repeat_instance
     * @param $survey_hash
     * @param $response_id
     * @param $survey_queue_hash
     * @param $page
     * @param $page_full
     * @param $user_id
     * @param $group_id
     * @return array|array[]|bool
     * @throws Exception
     */
    public function redcap_module_ajax($action, $payload, $project_id, $record, $instrument, $event_id, $repeat_instance,
                                       $survey_hash, $response_id, $survey_queue_hash, $page, $page_full, $user_id, $group_id)
    {
//        $foo = func_get_args();
        $sanitized = $this->sanitizeInput($payload);

        switch ($action) {
//            case "TestAction":
//                session_start();
//                $count = $_SESSION['count'] ?? 0;
//
//                \REDCap::logEvent("Test Action Received");
//                $result = [
//                    "success" => true,
//                    "user_id" => $user_id,
//                    "session_id" => session_id(),
//                    "session" => session_encode(),
//                    "count" => $count
//                ];
//                $_SESSION['count']++;
//                break;
            case "getWhiteboard":
                return $this->getWhiteboard($sanitized);
            case "setWhiteboard":
                return $this->setWhiteboard($sanitized);
//            case "getActions":
//                $this->handleActions($payload);
//                break;
            case "getParticipants":
                $sanitized = $this->sanitizeInput($payload);
                return $this->getParticipants($sanitized);
            case "updateParticipants":
                $sanitized = $this->sanitizeInput($payload);
                return $this->updateParticipants($sanitized);
            case "getUserSessions":
                return $this->getUserSessions($payload);
            case "checkUserCompletion":
                return $this->checkUserCompletion($payload);
//            case "addAction":
//                $this->addAction($payload);
//                break;
            case "validateUserPhone": //TODO: Add server timeout
                return $this->validateUserPhone($payload);
            case "validateCode":
                return $this->validateCode($payload);
            case "handleActions":
                return $this->handleActions($sanitized);
            case 'getUserSurveys':
                return $this->getUserSurveys($sanitized);
            default:
                // Action not defined
                throw new Exception ("Action $action is not defined");
        }

        // Return is left as php object, is converted to json automatically
//        return $result;
    }


//    public function isAuthenticated()
//    {
//        return ($this->UserSession->isAuthenticated());
//    }


}
