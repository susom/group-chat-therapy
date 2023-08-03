<?php

namespace Stanford\GroupChatTherapy;

include_once "emLoggerTrait.php";
require_once "classes/UserSession.php";
require_once "classes/Action.php";
require_once "classes/Sanitizer.php";
require_once "vendor/autoload.php";

use App\User;
use Exception;
use REDCap;
use Twilio\Exceptions\TwilioException;
use Twilio\Rest\Client;

// use \Logging;


class GroupChatTherapy extends \ExternalModules\AbstractExternalModule
{
    use emLoggerTrait;

    const BUILD_FILE_DIR = 'group-chat-therapy-ui/dist/assets';

    public $UserSession;    // make private

    public function __construct()
    {
        parent::__construct();
        // Other code to run when object is instantiated

        // Load the user session
        $this->UserSession = UserSession::getInstance();
    }

    /**
     * Helper method for inserting the JSMO JS into a page along with any preload data
     * @param $data
     * @param $init_method
     * @return void
     */
    public function injectJSMO($data = null, $init_method = null)
    {

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
        $dir_files = scandir($cwd . self::BUILD_FILE_DIR);

        if (!$dir_files)
            return [];

        // Remove extraneous dir values
        foreach ($dir_files as $key => $file) {
            if ($file === '.' || $file === '..') {
                unset($dir_files[$key]);
            } else { //Generate url and script html
                $url = $this->getUrl(self::BUILD_FILE_DIR . '/' . $file);
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
        $code = bin2hex(random_bytes(4));
        $saveData = array(
            array(
                "record_id" => $record,
                "code" => $code
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
            $last_name = filter_var($payload[0], FILTER_SANITIZE_STRING);
            $phone_number = filter_var($payload[1], FILTER_SANITIZE_STRING);
            $phone_number_truncated = ltrim($phone_number, '1');

            $params = array(
                "return_format" => "json",
                "fields" => array("phone", "last_name", "record_id")
            );

            $json = REDCap::getData($params);
            $decoded = current(json_decode($json, true));

            if (strtolower($decoded['last_name']) === strtolower($last_name) && $decoded['phone'] === $phone_number_truncated) {
                $this->generateOneTimePassword($decoded['record_id'], $decoded['phone']);
                return true;
            } else {
                throw new Exception ("Invalid credentials");
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
     * Validates code sent via SMS
     * @param $code
     * @return bool
     */
    public function validateCode($code): bool
    {
        //Sanitize input
        $code = filter_var($code, FILTER_SANITIZE_STRING);
        $code = strtolower($code);

        $params = array(
            "return_format" => "json",
            "fields" => array("code")
        );
        $json = REDCap::getData($params);
        $decoded = current(json_decode($json, true));
        //TODO Send session data here for initial caching
        return ($decoded['code'] === $code);
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
     * Polling function will call this endpoint.
     * @param array $payload
     * @return array
     */
    public function handleActions(array $payload): array
    {
        try {
            $max = intval($this->sanitizeInput($payload['maxID'])) ?? 0;
            $actionQueue = $this->sanitizeInput($payload['actionQueue']) ?? [];
            $start = hrtime(true);

            if (count($actionQueue)) { //User has actions to process
//                $this->addAction($actionQueue);
            }

            //If no event queue has been passed, simply return actions
            $ret = $this->getActions($max);

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
    public function addAction(array $actions): void
    {
        try {
            $this->emDebug("Adding actions", $actions);
            foreach ($actions as $k => $v) {
                $action = new Action($this);
                $action->setValue('Foo', 'Bar');
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
    public function getActions(int $max = 0): array
    {
        $results = [];
        $project_id = $this->getProjectId();
        $actions = Action::getActionsAfter($this, $project_id, $max);

        foreach($actions as $v){
            $action = $v->getAction();
            if($action['type'] === 'delete') {
                $target = $action['target'];
                if(isset($results[$target])){
                    unset($results[$target]);
                    continue;
                }
            }
            $results[$v->getId()] = $v->getAction();
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
        $foo = func_get_args();
        switch ($action) {
            case "TestAction":
                session_start();
                $count = $_SESSION['count'] ?? 0;

                \REDCap::logEvent("Test Action Received");
                $result = [
                    "success" => true,
                    "user_id" => $user_id,
                    "session_id" => session_id(),
                    "session" => session_encode(),
                    "count" => $count
                ];
                $_SESSION['count']++;
                break;
            case "getActions":
                $this->handleActions($payload);
                break;
            case "addAction":
                $this->addAction($payload);
                break;
            case "validateUserPhone": //TODO: Add server timeout
                return $this->validateUserPhone($payload);
            case "validateCode":
                return $this->validateCode($payload);
            case "handleActions":
                return $this->handleActions($payload);
            default:
                // Action not defined
                throw new Exception ("Action $action is not defined");
        }

        // Return is left as php object, is converted to json automatically
        return $result;
    }


    public function isAuthenticated()
    {
        return ($this->UserSession->isAuthenticated());
    }


}
