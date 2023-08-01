<?php

namespace Stanford\GroupChatTherapy;

include_once "emLoggerTrait.php";
require_once "classes/UserSession.php";
require_once "classes/Action.php";
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
        return ($decoded['code'] === $code);
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
                // session_start();
                // $count = $_SESSION['count'] ?? 0;

                $sql = "select reml.log_id,
                           reml.timestamp,
                           reml.record,
                           remlp1.value as 'payload'
                    from
                        redcap_external_modules_log reml
                    left join redcap_external_modules_log_parameters remlp1 on reml.log_id = remlp1.log_id and remlp1.name='payload'
                    where
                         reml.message = 'Action'
                    and  reml.project_id = ?";
                $q = $this->query($sql, [$this->getProjectId()]);
                $results = [];
                while ($row = db_fetch_row($q)) $results[] = $row;
                $result = [
                    "data" => $results
                ];
                break;
            case "addAction":
                $this->emDebug("Adding action", $payload);
                $action = new Action($this);
                $action->setValue('payload', $payload);
                $action->save();
                $result = [
                    "new_action_id" => $action->getId(),
                    "data" => $payload
                ];
                $this->emDebug("Added action " . $action->getId());
                break;
            case "validateUserPhone":
                return $this->validateUserPhone($payload);
            case "validateCode":
                return $this->validateCode($payload);
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
