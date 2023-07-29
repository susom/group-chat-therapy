<?php
namespace Stanford\GroupChatTherapy;

/**
 * Based off of https://www.php.net/manual/en/function.session-start.php#102460
 */
class UserSession
{
    const SESSION_PREFIX = "GroupChatTherapy";
    const SESSION_STARTED = TRUE;
    const SESSION_NOT_STARTED = FALSE;

    const INACTIVITY_TIMEOUT = 600;     // 10 minutes
    const MAXIMUM_SESSION_LIFE = 4230;  // 3 hours

    // The state of the session
    private $sessionState = self::SESSION_NOT_STARTED;

    // THE only instance of the class
    private static $instance;


    private function __construct()
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        $this->setKey('hit_count', ($this->getValue('hit_count') ?? 0) + 1);
    }

    public function isAuthenticated() {
        //TODO: Check timestamps for expiration...
        if ($this->isSessionInactive()) return false;
        if ($this->isSessionExpired()) return false;
        return !empty($this->getParticipantId());
    }


    private function isSessionInactive() {
        $last_activity = $this->getValue('last_activity_ts');
        if ($last_activity) {
            $age = strtotime("NOW") - $last_activity;
            return $age > self::INACTIVITY_TIMEOUT;
        }
        return false;
    }

    private function isSessionExpired() {
        $signon_ts = $this->getValue('signon_ts');
        if ($signon_ts) {
            $age = strtotime("NOW") - $signon_ts;
            return $age > self::MAXIMUM_SESSION_LIFE;
        }
        return true;    // no sign-on - must be expired
    }


    public function setParticipantId($participant_id) {
        if (empty($participant_id)) {
            $this->unsetKey('participant_id');
            $this->unsetKey('signon_ts');
        } elseif ($this->getValue('participant_id') !== $participant_id) {
            $this->setKey("participant_id", $participant_id);
            $this->setKey("signon_ts", strtotime("NOW"));
        } else {
            // no change
        }
    }

    public function getParticipantId() {
        return $this->getValue('participant_id');
    }

    public function getSessionId() {
        return session_id();
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
        }
        $this->setKey("last_activity_ts", strtotime("NOW"));
        return $this->sessionState;
    }



    public function setKey($key, $value) {
        $_SESSION[self::SESSION_PREFIX][$key] = $value;
    }

    public function getValue($key) {
        return $_SESSION[self::SESSION_PREFIX][$key] ?? null;
    }

    public function unsetKey($key)
    {
        unset($_SESSION[self::SESSION_PREFIX][$key]);
    }

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
