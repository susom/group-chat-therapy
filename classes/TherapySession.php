<?php
namespace Stanford\GroupChatTherapy;


/*

const res_fake = {
    chat_session_details : {
        chat_id : "123456abcxyz",
        title : "Alcohol Intervention",
        description : "Group Session Chat for Dudes",
        date : "2023-07-21",
        time_start : 1100,
        time_end : 1300,
        therapist : "123xyz",
        whiteboard : "",

        participants :  [
            {participant_id: "123xyz" , display_name : "Mr. Therapist", status : "online"},
            {participant_id: "abc456" , display_name : "Gilligan", status : "chat"},
            {participant_id: "def789" , display_name : "Wally", status : "online"},
            {participant_id: "abcdfd" , display_name : "Jeff Green", status : "online"},
            {participant_id: "234d3e" , display_name : "Jonathan Gee", status : "online"},
            {participant_id: "4gdfa3" , display_name : "Kent Miles", status : "online"},

        ]
    },
    assessments : [
        { participant_id : "abc456",
            required : [
                { assessment : "opt-in" , link : "https://redcap.stanford.edu/1", status : true },
                { assessment : "e-consent" , link : "https://redcap.stanford.edu/2", status : true },
                { assessment : "baseline survey" , link : "https://redcap.stanford.edu/3", status : false }
            ]
        }
    ],
    participantID : "abc456"
}

 */

class TherapySessionCache
{
    /** @var GroupChatTherapy $this->module */

    private $module;



    /**
     * @param $module
     * @param $type
     * @param $log_id
     * @param $limit_params //used if you want to obtain a specific log_id and then only pull certain parameters
     * @throws \Exception
     */
    public function __construct($module)
    {
        $this->module = $module;
    }


    public function loadSessionFromRedcap() {
        $event_id = $this->module->getProjectSettings('therapy-session-event-id');

        $params = [

        ];


        // $module->getData()
    }


}
