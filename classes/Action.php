<?php

namespace Stanford\GroupChatTherapy;
require_once "SimpleEmLogObject.php";


/**
 * The Conversation State extends the Simple EM Log Object to provide a data store for all conversations
 *
 */
class Action extends SimpleEmLogObject
{
    /** @var GroupChatTherapy $this->module */

    CONST OBJECT_NAME = 'Action';   // This is the 'name' of the object and stored in the message column

    // private $payload;   // A json object with a bunch of stuff



    /**
     * @param $module
     * @param $type
     * @param $log_id
     * @param $limit_params //used if you want to obtain a specific log_id and then only pull certain parameters
     * @throws \Exception
     */
    public function __construct($module, $type = self::OBJECT_NAME, $log_id = null, $limit_params = [])
    {
        parent::__construct($module, $type, $log_id, $limit_params);
    }

    // public function payloadCheck() {
    //     if (! isset($this->payload)) {
    //         $this->payload = $this->getPayload();
    //     }
    // }

    /** GETTERS */
    public function getPayload() {
        // The payload is in the settings table and has the json object
        // TODO:? Should we json_decode here?
        return $this->getValue('payload');

    }

    public function getActionType() {
        // What kind of action was it?
    }


    /** SETTERS */

    /**
     * Add a note
     * @param $note
     * @return void
     */
    public function addNote($note) {
        $note = $this->getValue('note') ?? '';
        $prefix = empty($note) ? "" : "\n----\n";
        $this->setValue('note',
            $prefix. "[" . date("Y-m-d H:i:s") . "] " .
            $note
        );
    }


    /** STATIC METHODS */

    /**
     * Load the active conversation after action_id
     * @param GroupChatTherapy $module
     * @param int $project_id
     * @param int $action_id
     * @return array Action
     * @throws \Exception
     */
    public static function getActionsAfter($module, $project_id, $action_id = null) {

        if (empty($action_id)) $action_id = 0;
        $type = self::OBJECT_NAME;
        $filter_clause = "project_id = ? and log_id > ? order by log_id asc";
        $objs = self::queryObjects(
            $module, $type, $filter_clause, [$project_id, $action_id]
        );
        $count = count($objs);
        if ($count > 0) {
            $module->emDebug("Loaded $count CS in need of action");
        }
        if ($count == 0) {
            // None found, return false;
            $result = [];
        } else {
            $result = $objs;
        }
        return $result;
    }

}
