<?php
namespace Stanford\GroupChatTherapy;

/**
 * Based off of https://www.php.net/manual/en/function.session-start.php#102460
 */
class UserSession
{
    const SESSION_STARTED = TRUE;
    const SESSION_NOT_STARTED = FALSE;

    const INACTIVITY_TIMEOUT = 600;     // 10 minutes
    const MAXIMUM_SESSION_LIFE = 4230;  // 3 hours

    // The state of the session
    private $sessionState = self::SESSION_NOT_STARTED;

    // THE only instance of the class
    private static $instance;

    private $participant_id;    // ID of participant
    private $last_activity_ts;  // Time of last activity
    private $signon_ts;         // Time of sign-on

    private function __construct()
    {
    }

    public function isAuthenticated() {
        $participant_id = $this->participant_id;

        //TODO: Check timestamps for expiration...
        $is_inactive = (strtotime("NOW") - $this->last_activity_ts) > self::INACTIVITY_TIMEOUT;
        $is_expired = (strtotime("NOW") - $this->signon_ts) > self::MAXIMUM_SESSION_LIFE;

        return !empty($participant_id);
    }


    /**
     *    Returns THE instance of 'Session'.
     *    The session is automatically initialized if it wasn't.
     *
     * @return    UserSession
     **/

    public static function getInstance()
    {
        if (!isset(self::$instance)) {
            self::$instance = new self;
        }
        self::$instance->startSession();
        return self::$instance;
    }


    /**
     *    (Re)starts the session.
     *
     * @return    bool    TRUE if the session has been initialized, else FALSE.
     **/

    public function startSession()
    {
        if ($this->sessionState == self::SESSION_NOT_STARTED) {
            $this->sessionState = session_start();
            $this->signon_ts = strtotime("NOW");
        }
        $this->last_activity_ts = strtotime("NOW");
        return $this->sessionState;
    }


    /**
     *    Stores datas in the session.
     *    Example: $instance->foo = 'bar';
     *
     * @param name    Name of the datas.
     * @param value    Your datas.
     * @return    void
     **/

    public function __set($name, $value)
    {
        $_SESSION[$name] = $value;
    }


    /**
     *    Gets datas from the session.
     *    Example: echo $instance->foo;
     *
     * @param name    Name of the datas to get.
     * @return    mixed    Datas stored in session.
     **/

    public function __get($name)
    {
        if (isset($_SESSION[$name])) {
            return $_SESSION[$name];
        }
    }


    public function __isset($name)
    {
        return isset($_SESSION[$name]);
    }


    public function __unset($name)
    {
        unset($_SESSION[$name]);
    }


    /**
     *    Destroys the current session.
     *
     * @return    bool    TRUE is session has been deleted, else FALSE.
     **/

    public function destroy()
    {
        if ($this->sessionState == self::SESSION_STARTED) {
            $this->sessionState = !session_destroy();
            unset($_SESSION);

            return !$this->sessionState;
        }

        return FALSE;
    }
}
