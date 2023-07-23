<?php
namespace Stanford\GroupChatTherapy;
require_once "SimpleEmLogObject.php";

class UserSession extends SimpleEmLogObject
{
    /** @var GroupChatTherapy $this->module */


    /* DEFINE CONSTANTS TO MAKE THINGS EASIER TO CHANGE */
    CONST LOGIN_EXPIRES_MIN  = 5;                   // numnber of minutes a login is valid for before they get logged out


    CONST KEY_PARTICIPANT_ID = 'participant_id';    // Record ID for participant
    CONST KEY_SESSION_ID     = 'php_session_id';    // The session id (also stored in this object)
    // CONST KEY_LAST_ACTIVITY  = 'last_activity_ts';  // The timestamp of last activity - moved to session object..
    CONST KEY_LAST_LOGIN     = 'last_login_ts';     // When the session was authenticated



    /* IDEAS:
    php_session_id
    participant_id
    therapy_session_id
    assessments [
        assessment_id,
        name,
        url,
        status (not started, partial, complete)
    ]
    */

    /** CONSTRUCTOR - only required if you want to override the object_name or do something else funny
     * @param $module
     * @param $log_id
     * @param $limit_params //used if you want to obtain a specific log_id and then only pull certain parameters
     * @throws \Exception
     */
    public function __construct($module, $log_id = null, $limit_params = [])
    {
        // By default, the object name (i.e. message column) is the name of this class.
        // You can override this by setting the type object_name to something other than null
        $override_object_name = null;
        parent::__construct($module, $log_id, $limit_params, $override_object_name);
    }


    /**
     * Is the current session authenticated?
     * @return bool
     */
    public function isAuthenticated() {
        if ($participant_id = $this->getValue(self::KEY_PARTICIPANT_ID)) {
            // We have a participant id which means they were logged in. Let's check if login has expired
            $last_login_ts = $this->getValue(self::KEY_LAST_LOGIN);

            $min_since_login = rounddown((time() - $last_login_ts) / 60);
            $this->module->emDebug("It has been $min_since_login since last login");

            if ($min_since_login < self::LOGIN_EXPIRES_MIN) {
                // Session still valid
                return true;
            }
        }
        return false;
    }

    public function setAuthentication($valid = true) {
        // If someone successfully authenticates,
    }




    /** GETTERS */

    // public function getActionType() {
    //     // What kind of action was it?
    // }


    /** SETTERS */
    public function setSessionId($php_session_id) {
        $this->setValue('php_session_id', $php_session_id);
    }


    /** STATIC METHODS */

    /**
     * Load the active conversation after action_id
     * @param GroupChatTherapy $module
     * @param int $php_session_id
     * @param int $project_id   (optional, taken from module if not specified)
     * @return UserSession|null
     * @throws \Exception
     */
    public static function getSessionById($module, $php_session_id, $project_id = null) {

        if (is_null($project_id)) $project_id = $module->getProjectId();
        if (is_null($project_id)) throw new \Exception("Must be in a project context to use this method!");

        $filter_clause = "project_id = ? and php_session_id = ? order by log_id desc";

        $objs = self::queryObjects(
            $module, $filter_clause, [$project_id, $php_session_id]
        );
        $count = count($objs);
        if ($count > 0) {
            $result = array_shift($objs);
            // We expect only one, so any extras should be deleted
            foreach ($objs as $obj) {
                $module->emError("Extra objects found with session $php_session_id - deleting log_id " . $obj->getId());
                $obj->delete();
            }
        } else {
            // None found;
            $result = [];
        }
        return $result;
    }

    // TODO: Make a static method that can be called from a cron to remove all old sessions (e.g. older than 1 day?)

}
