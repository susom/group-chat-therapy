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

                $('#example').DataTable({
                    data: response.data
                    // "ajax": function(data, callback, settings) {
                    //     callback(
                    //         ExternalModules.Stanford.EnhancedSMSConversation.getConversations()
                    //     )
                    // }
                });
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

        /**
         * Validates last
         * @param lastName
         * @param phone
         * @param callback
         */
        validateUserPhone: (lastName, phone, callback) => {
            let payload = [lastName, phone]
             module
                .ajax('validateUserPhone', payload)
                .then(res=> {
                    callback(res)
                })
                .catch(err => console.log("Validate error, ", err))
        }

    });
}
