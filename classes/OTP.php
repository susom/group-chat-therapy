<?php

namespace Stanford\GroupChatTherapy;
require_once "SimpleEmLogObject.php";


/**
 * The Conversation State extends the Simple EM Log Object to provide a data store for all conversations
 *
 */
class OTP extends SimpleEmLogObject
{
    /** @var GroupChatTherapy $this->module */

    CONST OBJECT_NAME = 'OTP';   // This is the 'name' of the object and stored in the message column

    // CONST VALID_PARAM_KEYS = ['hash'];


    /**
     * Create a new OTP
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

    /** GETTERS */

    public function getParticipant() {
        return $this->getValue('record');
    }

    public function isExpired() {
        $timestamp = $this->getValue('timestamp');
        $this->module->emDebug("Timestamp for hash " . $this->getId() . " is $timestamp");
        // TODO: Check for age of timestamp...
    }

    public function getHash() {
        return $this->getValue('hash');
    }

    /** SETTERS */
    public function setHash() {
        $hash = generateRandomHash(16);
        $this->setValue('hash', $hash);
    }

    public function setParticipant($participant_id) {
        $this->setValue('record', $participant_id);
    }


    /** STATIC METHODS */

    /**
     * Find By Hash
     * @param GroupChatTherapy $module
     * @param int $project_id
     * @param string $hash
     * @return object|null OTP
     * @throws \Exception
     */
    public static function findByHash($module, $project_id, $hash) {
        $filter_clause = "project_id = ? and hash = ? order by log_id desc";
        $objs = self::queryObjects(
            $module, self::OBJECT_NAME, $filter_clause, [$project_id, $hash]
        );
        $count = count($objs);
        if ($count == 0) {
            // None found, return false;
            $result = null;
        } else {
            $result = array_shift($objs);
            // Handle multiple matching hashes if present -- shouldn't happen
            foreach ($objs as $obj) {
                $module->emError("Found more than one hash for project $project_id and hash $hash as log_id " . $obj->getId() . " - this shouldn't happen.");
                $obj->delete();
            }
        }

        // if ($result) {
        //     // verify that time hasn't elapsed
        //     $timestamp = $result->getValue('timestamp');
        //     $module->emDebug("Hash timestamp: " . $timestamp);
        //     // TODO: If Expired, return null
        // }

        return $result;
    }

}
