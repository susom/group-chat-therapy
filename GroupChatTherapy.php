<?php
namespace Stanford\GroupChatTherapy;

include_once "emLoggerTrait.php";

use \REDCap;
use \Exception;
use function mysql_xdevapi\getSession;

require_once "classes/Action.php";
require_once "classes/RecordEventObject.php";
require_once "classes/UserSession.php";
require_once("classes/AsemloTest.php");



class GroupChatTherapy extends \ExternalModules\AbstractExternalModule {

    use emLoggerTrait;

    private $UserSession;

    public function isAuthenticated() {
        if (is_null($this->UserSession)) {
            // Need to load and set the user session
            if (session_status() === PHP_SESSION_NONE) session_start();

            $session_id = session_id();
            // $this->emDebug("Session ID: $session_id");
            $_SESSION['count'] = $_SESSION['count'] ?? 0;
            $_SESSION['count']++;
            // Let's see if there is a valid session in the database
            if ($UserSession = UserSession::getSessionById($this, $session_id)) {
                // We have a user session
                $this->emDebug("Found a session #" . $UserSession->getId());
            } else {
                // No user session -- should we create one or wait for login?  Probably wait for login for now...
                $UserSession = new UserSession($this);
                $UserSession->setSessionId($session_id);
                $UserSession->save();
                $this->emDebug("$session_id did not exist - created #" . $UserSession->getId());
            };
            $this->UserSession = $UserSession;
        }
        return $this->UserSession->isAuthenticated();
    }


    public function injectJSMO($data = null, $init_method = null) {
        echo $this->initializeJavascriptModuleObject();
        $cmds = [
            "const module = " . $this->getJavascriptModuleObjectName()
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
                session_start();
                $count = $_SESSION['count'] ?? 0;

                \REDCap::logEvent("Test Action Received");
                $result = [
                    "success"=>true,
                    "user_id"=>$user_id,
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
                $q = $this->query($sql,[$this->getProjectId()]);
                $results = [];
                while ($row = db_fetch_row($q)) $results[] = $row;
                $result = [
                    "data" => $results
                ];
                break;

            case "getActions2":
                $actions = Action::getActionsAfter($this,$project_id,0);
                $data = [];
                foreach ($actions as $Action) {
                    /** @var $Action Action **/
                    $data[] = [
                        "log_id" => $Action->getId(),
                        "timestamp" => $Action->getValue('timestamp'),
                        "record" => $Action->getValue('record'),
                        "Message" => $Action->getValue('message')
                    ];
                }
                $result = [
                    "data" => $data
                ];
                break;

            case "addAction":
                $this->emDebug("Adding action", $payload);
                $action = new Action($this);
                $action->setValue('record', 'record123');
                $action->setValue('payload', $payload);
                $action->save();
                $result = [
                    "new_action_id" => $action->getId(),
                    "data" => $payload
                ];
                $this->emDebug("Added action " . $action->getId());
                break;


            case "loginStatus":
                $this->emDebug("Login Status");

                $action = new Action($this);
                $action->setValue('record', 'record123');
                $action->setValue('payload', $payload);
                $action->save();
                $result = [
                    "new_action_id" => $action->getId(),
                    "data" => $payload
                ];
                $this->emDebug("Added action " . $action->getId());
                break;


            case "loginAttempt":
                $this->emDebug("Login Attempt");

                $action = new Action($this);
                $action->setValue('record', 'record123');
                $action->setValue('payload', $payload);
                $action->save();
                $result = [
                    "new_action_id" => $action->getId(),
                    "data" => $payload
                ];
                $this->emDebug("Added action " . $action->getId());
                break;
            default:
                // Action not defined
                throw new Exception ("Action $action is not defined");
        }

        // Return is left as php object, is converted to json automatically
        return $result;
    }

}
