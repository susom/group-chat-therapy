<?php

namespace Stanford\GroupChatTherapy;

include_once "emLoggerTrait.php";

use \REDCap;
use \Exception;

// use \Logging;

require_once "classes/Action.php";

class GroupChatTherapy extends \ExternalModules\AbstractExternalModule
{
    use emLoggerTrait;

    const BUILD_FILE_DIR = 'group-chat-therapy-ui/dist/assets';

//     public function injectJavascript($page)
//     {
//         try {
//
//             $jsFilePath = $this->getUrl("scripts/$page.js");
// //            $csrfToken = json_encode($this->getCSRFToken());
//             print "<script type='module' src=$jsFilePath></script>";
// //            print "<script type='text/javascript'>var ajaxUrl = $ajaxFilePath; var csrfToken = $csrfToken</script>";
//
//
//         } catch (\Exception $e) {
//             \REDCap::logEvent("Error injecting js: $e");
//             $this->emError($e);
//         }
//     }

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

    public function validateUserPhone($payload): string
    {
        return true;
    }


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

                break;
            default:
                // Action not defined
                throw new Exception ("Action $action is not defined");
        }

        // Return is left as php object, is converted to json automatically
        return $result;
    }

}
