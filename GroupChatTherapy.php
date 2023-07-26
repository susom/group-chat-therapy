<?php

namespace Stanford\GroupChatTherapy;

include_once "emLoggerTrait.php";
require_once "classes/UserSession.php";
require_once "classes/Action.php";


use App\User;
use Exception;
use REDCap;

// use \Logging;


class GroupChatTherapy extends \ExternalModules\AbstractExternalModule
{
    use emLoggerTrait;

    const BUILD_FILE_DIR = 'group-chat-therapy-ui/dist/assets';

    private $UserSession;

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
     * Verifies phone number and last name fields are part of cohort
     * @param $payload
     * @return bool
     */
    public function validateUserPhone($payload)
    {
        try {

            //Sanitize inputs
            $last_name = filter_var($payload[0], FILTER_SANITIZE_STRING);
            $phone_number = filter_var($payload[1], FILTER_SANITIZE_STRING);
            $phone_number = ltrim($phone_number, '1');

            $params = array(
                "return_format" => "json",
                "fields" => array("phone", "last_name")
            );

            $json       = REDCap::getData($params);
            $decoded = current(json_decode($json, true));

            return strtolower($decoded['last_name']) === strtolower($last_name) && $decoded['phone'] === $phone_number;
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
     * @param $code
     * @return bool
     */
    public function validateCode($code): bool
    {
        //Sanitize input
        $code = filter_var($code, FILTER_SANITIZE_STRING);

        $params = array(
            "return_format" => "json",
            "fields" => array("code")
        );
        $json       = REDCap::getData($params);
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
        // Load the user session
        if (empty($this->UserSession)) $this->UserSession = UserSession::getInstance();
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


    public function isAuthenticated() {
        if (empty($this->UserSession)) $this->UserSession = UserSession::getInstance();
        return ($this->UserSession->isAuthenticated());
    }



}
