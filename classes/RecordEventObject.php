<?php
namespace Stanford\GroupChatTherapy;

use \REDCap;

class RecordEventObject
{
    public $project_id;
    public $event_id;
    public $record_id;

    private $module;
    /** @var $module GroupChatTherapy **/
    private $data;

    private $is_dirty = false;

    public function __construct($module, $project_id, $event_id, $record_id = null)
    {
        $this->module = $module;
        $this->project_id = $project_id;
        $this->event_id = $event_id;
        if (!is_null($record_id)) {
            $this->record_id = $record_id;
            return $this->load($record_id);
        }
    }


    /**
     * Load the record
     * @param $record_id
     * @return bool success
     */
    public function load($record_id) {
        $params = [
            "project_id" => $this->project_id,
            "return_format" => 'array',
            "events" => [$this->event_id],
            "records" => [$record_id]
        ];
        $result = REDCap::getData($params);

        if (isset($result[$record_id][$this->event_id])) {
            // Success
            $this->data = $result[$record_id][$this->event_id];
            return true;
        } else {
            $this->module->emError("Something failed with getData for $record_id", $result);
            return false;
        }
    }

    public function getValue($field) {
        if (isset($this->data[$field])) {
            return $this->data[$field];
        } else {
            return null;
        }
    }


    public function setValue($field, $value) {
        if ($field == REDCap::getRecordIdField()) {
            // rename
            $this->record_id = $value;
        } else {
            $this->data[$field] = $value;
        }
    }


    public function save() {
        $data = [$this->record_id => [$this->event_id => $this->data ]];
        $params = [
            "project_id" => $this->project_id,
            "dataFormat" => 'array',
            "data" => $data,
            // "overwriteBehavior" => 'overwrite'
        ];
        $result = REDCap::saveData($params);
        if (!empty($result['errors'])) {
            $this->module->emDebug("Errors saving $this->record_id", $data, $result);
            return false;
        } else {
            $id = $result['ids'][0];
            return $id;
        }
    }

}
