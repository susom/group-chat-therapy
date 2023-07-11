<?php
namespace Stanford\GroupChatTherapy;

include_once "emLoggerTrait.php";

use \REDCap;
use \Exception;
// use \Logging;


class GroupChatTherapy extends \ExternalModules\AbstractExternalModule {
    use emLoggerTrait;


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



    public function injectJSMO($data = null, $init_method = null) {
        echo $this->initializeJavascriptModuleObject();
        $cmds = [
            "const module = " . $this-getJavascriptModuleObjectName()
        ];
        if (!empty($data)) $cmds[] = "module.data = " . json_encode($data);
        if (!empty($init_method)) $cmds[] = "module.afterRender(module." . $init_method . ")";
        ?>
        <script src="<?=$this->getUrl("assets/jsmo.js",true)?>"></script>
        <script>
            $(function() { <?php echo implode(";\n", $cmds) ?> })
        </script>
        <?php
    }

    public function redcap_module_ajax($action, $payload, $project_id, $record, $instrument, $event_id, $repeat_instance,
                                       $survey_hash, $response_id, $survey_queue_hash, $page, $page_full, $user_id, $group_id)
    {
        switch($action) {
            case "TestAction":
                \REDCap::logEvent("Test Action Received");
                $result = [
                    "success"=>true,
                    "user_id"=>$user_id
                ];
                break;
            default:
                // Action not defined
                throw new Exception ("Action $action is not defined");
        }

        // Return is left as php object, is converted to json automatically
        return $result;
    }

}
