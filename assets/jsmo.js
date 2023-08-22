// This file extends the default JSMO object with methods for this EM
;{
    // Define the jsmo in IIFE so we can reference object in our new function methods
    const module = ExternalModules.Stanford.GroupChatTherapy;

    // Extend the official JSMO with new methods
    Object.assign(module, {

        ExampleFunction: function() {
            console.log("Example Function showing module's data:", module.data);
        },

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

        handleActions: (payload) => {
            module
                .ajax('handleActions', payload)
                .then(res=> {
                    // callback('handleActions', res)
                    console.log(res)
                })
                .catch(err => console.log(err))
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
