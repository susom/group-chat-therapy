// This file extends the default JSMO object with methods for this EM
;{
    // Define the jsmo in IIFE so we can reference object in our new function methods
    const module = ExternalModules.Stanford.GroupChatTherapy;

    //TODO DELETE generateFakeData(maxID) WHEN BACKEND SET
    function generateFakeData(maxID) {
        const icons = ["heart", "smile", "sad", "angry"];
        const users = [2,3,4];
        const notice_arr = ["Foo has left the session", "Bar has joined the session"];
        const messageBodies = [
            "@Irvin @Schultz Hi there!",
            "@Schultz Sounds great!",
            "Absolutely!",
            "@Irvin @Schultz Good point!",
            "Interesting.",
            "@Andy I agree.",
            "Definitely!",
            "@Schultz Let's do that.",
            "Sure thing.",
            "@Irvin Hmm, let's see.",
            "How's your day been so far?",
            "That's a really insightful observation.",
            "@Andy @Schultz I've been looking at different strategies recently.",
            "Can we explore your last point in more detail?",
            "@Schultz How about we try a different approach?",
            "@Irvin Could you elaborate on that point?",
            "What are your thoughts on this matter?",
            "How have you been feeling about your progress?",
            "@Andy @Schultz I just read an interesting article about cognitive behavior therapy. I think it has some points that could apply to our discussion.",
            "@Schultz I'm really pleased with the progress we've made so far. You're showing a lot of resilience and perseverance.",
            "Let's discuss some coping mechanisms for when you're feeling stressed or overwhelmed. It might be helpful to have some strategies in place.",
            "@Irvin Your thoughts and feelings are important. Don't hesitate to share anything that comes to mind, even if it seems unrelated.",
            "@Schultz Remember, there's no rush in this process. It's about making sustainable changes, not instant fixes.",
            "It seems like you're dealing with a lot right now. I want to remind you that it's okay to take a step back when you need to."
        ];
        const server_timestamp = new Date().toISOString();
        const server_time = 5.0;
        let actionIdCounter = Math.max(maxID + 1, 12400);  // Use the given maxID or 12400, whichever is larger

        function getRandomInt(max) {
            return Math.floor(Math.random() * max);
        }

        function generateRandomPayload() {
            if (Math.random() < 0.2) {
                return {
                    serverTime: server_time,
                    actions: []
                };
            }

            const actions = [];
            let lastMessageId = null;

            for (let i = 0; i < 5; i++) {
                const actionType = ["message", "message_read", "reaction"];
                if (Math.random() < 0.01) actionType.push("delete");
                if (Math.random() < 0.1) actionType.push("notice");
                if (Math.random() < 0.05) actionType.push("whiteboard");
                if (Math.random() < 0.05) actionType.push("update_assessments");
                if (Math.random() < 0.05) actionType.push("update_chat_details");

                const selectedActionType    = actionType[getRandomInt(actionType.length)];
                const isForNonTherapist     = Math.random() < 0.5;
                const recipients            = isForNonTherapist ? [users[getRandomInt(users.length - 1) + 1]] : [];

                let action;
                switch(selectedActionType) {
                    case "message":
                        const messageId = actionIdCounter++;
                        action = {
                            type: "message",
                            id: messageId,
                            user: users[getRandomInt(users.length)],
                            body: messageBodies[getRandomInt(messageBodies.length)],
                            recipients: recipients,
                            timestamp: server_timestamp,
                            target: lastMessageId
                        };
                        lastMessageId = messageId;
                        break;
                    case "delete":
                        action = {
                            id: actionIdCounter++,
                            type: "delete",
                            target: lastMessageId,
                        };
                        break;
                    case "notice":
                        action = {
                            id: actionIdCounter++,
                            type: "notice",
                            body: notice_arr[getRandomInt(notice_arr.length)],
                            recipients: recipients,
                            sender: "system | Therapist",
                            timestamp: server_timestamp
                        };
                        break;
                    case "message_read":
                        if (lastMessageId === null) {
                            continue;
                        }
                        action = {
                            id: actionIdCounter++,
                            type: "message_read",
                            target: lastMessageId,
                            user: users[getRandomInt(users.length)],
                            timestamp: server_timestamp
                        };
                        break;
                    case "reaction":
                        if (lastMessageId === null) {
                            continue;
                        }
                        action = {
                            id: actionIdCounter++,
                            type: "reaction",
                            target: lastMessageId,
                            icon: icons[getRandomInt(icons.length)],
                            user: users[getRandomInt(users.length)],
                            timestamp: server_timestamp
                        };
                        break;
                    case "whiteboard":
                        action = {
                            id: actionIdCounter++,
                            type: "whiteboard",
                            body: "New whiteboard content"
                        };
                        break;
                    case "update_assessments":
                        action = {
                            id: actionIdCounter++,
                            type: "update_assessments",
                            timestamp: server_timestamp
                        };
                        break;
                    case "update_chat_details":
                        action = {
                            id: actionIdCounter++,
                            type: "update_chat_details",
                            timestamp: server_timestamp
                        };
                        break;
                    default:
                        break;
                }

                actions.push(action);
            }

            return {
                actions: actions,
                serverTime : 2.5,
            };
        }

        return generateRandomPayload();
    }

    // Extend the official JSMO with new methods
    Object.assign(module, {

        // Ajax function calling 'TestAction'
        InitFunction: function () {
            console.log("Example Init Function");

            // Note use of jsmo to call methods
            module.ajax('TestAction', module.data).then(function (response) {
                // Process response
                console.log("Ajax Result: ", response);
            }).catch(function (err) {
                // Handle error
                console.log(err);
            });
        },

        /**
         * POSTS payload (QueuedActions, MaxID, ReactStateVarSetter) and retrieves object of Latest Actions Since MaxID
         * @param payload
         * @param setStateVarCallBack
         */
        handleActions: function (payload, setStateVarCallBack) {
            module.ajax('handleActions', payload).then(function (res) {
                if(res) {
                    setStateVarCallBack(res)
                }
            }).catch(function (err) {
                console.log("Error", err);
            })
        },

        getParticipants: (payload, callback, errorCallback) => {
            module.ajax('getParticipants', payload)
                .then((res) => {
                    if(res?.result)
                        callback(JSON.parse(res?.result))
                }).catch(err => errorCallback(err))
        },

        /**
         * POSTS payload (participant_id maybe not necessary) and retrieves object of Latest Participant Assessments Status
         * @param payload
         * @param setStateVarCallBack
         */
        getAssessments: function(payload, setStateVarCallBack) {
            let response = [
                { participant_id : "abc456",
                    required : [
                        { assessment : "opt-in" , link : "https://redcap.stanford.edu/1", status : true },
                        { assessment : "e-consent" , link : "https://redcap.stanford.edu/2", status : true },
                        { assessment : "baseline survey" , link : "https://redcap.stanford.edu/3", status : true }
                    ]
                }
            ];

            // module.ajax('getAssessments', payload).then(function (response) {
            //     console.log("RESPONSE", response);
            //     setStateVarCallBack(response);
            // }).catch(function (err) {
            //     console.log("Error", err);
            // })

            setStateVarCallBack(response);
            return response;
        },


        // Get a list of all the actions from the log tables
        getActions: function () {
            console.log("getActions");

            module.ajax('getActions').then(function (response) {
                console.log("RESPONSE", response);

                // $('#example').DataTable({
                //     data: response.data
                //     // "ajax": function(data, callback, settings) {
                //     //     callback(
                //     //         ExternalModules.Stanford.EnhancedSMSConversation.getConversations()
                //     //     )
                //     // }
                // });
                return response;
            }).catch(function (err) {
                console.log("Error", err);
            })
        },

        deleteActions: function() {
            module.ajax('deleteActions').then(function (response) {
                console.log("RESPONSE", response);
            }).catch(function (err) {
                console.log("Error", err);
            })
        },

        addAction: function(payload) {
            module.ajax('addAction', payload).then(function (response) {
                console.log("RESPONSE", response);
            }).catch(function (err) {
                console.log("Error", err);
            })
        },


        getAssessments: function(payload) {
            module.ajax('getAssessments', payload).then(function (response) {
                console.log("RESPONSE", response);
            }).catch(function (err) {
                console.log("Error", err);
            })
        },
        getUserSessions: function(payload, callback, errorCallback) {
            module.ajax('getUserSessions', payload)
                .then((res) => {
                    if(res?.result)
                        callback(JSON.parse(res?.result))
                }).catch(err => errorCallback(err))
        },
        getWhiteboard : (payload, callback, errorCallback) => {
            module.ajax('getWhiteboard', payload)
                .then((res) => {
                    if(res?.result)
                        callback(JSON.parse(res?.result))
                }).catch(err => errorCallback(err))
        },

        setWhiteboard: (payload, callback, errorCallback) => {
            module.ajax('setWhiteboard', payload)
                .then((res) => {
                    if(res?.result)
                        callback(JSON.parse(res?.result))
                }).catch(err => errorCallback(err))
        },

        getParticipants: (payload, callback, errorCallback) => {
            module.ajax('getParticipants', payload)
                .then((res) => {
                    if(res?.result)
                        callback(JSON.parse(res?.result))
                }).catch(err => errorCallback(err))
        },

        updateParticipants: (payload, callback, errorCallback) => {
            module.ajax('updateParticipants', payload)
                .then(res => {
                    if(res?.result)
                        callback(JSON.parse(res?.result))
                }).catch(err => errorCallback(err))
        },

        getChatSessionDetails: function(payload) {
            module.ajax('getChatSessionDetails', payload).then(function (response) {
                console.log("RESPONSE", response);
            }).catch(function (err) {
                console.log("Error", err);
            })
        },
        getUserSurveys: (payload, callback, errorCallback) => {
            module.ajax('getUserSurveys', payload)
                .then(res => {
                    if(res?.result){
                        let response = JSON.parse(res?.result)
                        if('error' in response)
                            errorCallback(response)
                        else
                            callback(response)
                    }
                })
        },
        checkUserCompletion: (payload, callback, errorCallback) => {
            module.ajax('checkUserCompletion', payload)
                .then(res => {
                    if(res?.result){
                        let response = JSON.parse(res?.result)
                        if('error' in response)
                            errorCallback(response.error?.msg)
                        else
                            callback(response)
                    }
                })
        },
        /**
         * Validates Last name, phone to determine user participation in study & send OTP
         * @param lastName
         * @param phone
         * @param callback
         * @param errorCallback
         */
        validateUserPhone: (lastName, phone, callback, errorCallback) => {
            let payload = [lastName, phone]
             module
                .ajax('validateUserPhone', payload)
                .then(res=> {
                    callback('validateUserPhone', res)
                })
                .catch(err => errorCallback('validateUserPhone', err))
        },

        /**
         * Validates code to login user
         * @param code
         * @param callback
         * @param errorCallback
         */
        validateCode: (code, callback, errorCallback) => {
            module
                .ajax('validateCode', code)
                .then(res=> {
                    if(res?.result)
                        callback('validateCode', JSON.parse(res?.result))
                })
                .catch(err => errorCallback('validateCode', err))
        }

    });
}
