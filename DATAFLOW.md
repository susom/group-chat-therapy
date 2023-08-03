# Purpose of this is to go over proposed data flow


We have a fixed



## Authentication

1. User enters phone and field (e.g. last name)


```json


```


2. Presented with input for code
   3. did not receive message?
   4. todo: prevent abuse
      5. 1 minute timeout before resending
      6. 3 tries maximum within a 1 hour period
2. They are sent a SMS with a OTP code (6 digits)
3. User enters digits
   3. ajax call - if valid, we save on the server-side the session with:
      4. User record id,
      5. Time of authentication
      6. Time of last activity
   3. If invalid, start over

On server, we have a logged in user.

## Determining Therapy Session(s) - User Home Page
- TODO: need function to search for therapy sessions where participant is included
  - Also, we need to determine if they have action-items TODO for any of the previous survey sessions.
```json
[
    "therapy_sessions": [
    {
        "name": ..,
        "date": ...,
        "assessments": [
            {
                "name": "location",
                "status": "complete",
            },
            {
                "name": "post-session_survey",
                "status":"incomplete",
                "url":"url to survey"
            }
        ]

    }
]
```

## PHP Session Object
- Every ajax call that requires authentication, will verify that session object is tied to user id.
- if user enters a ts, we will store current therapy session in session objecet as well.


## Enter a specific therapy session
Client posts to server that they wish to enter therapy session (this could also be set by url parameter?)

- TODO: Make sure user is authorized to enter session
    - If yes, add current therapy session to session object on the server.
        - Add user / session_id to therapy session object (for tracking visibility)
    - If no, return message that they are not allowed in session.


### Ajax Methods
- getTherapySessionDetail(ts_id)
  - metadata
  - participants
- getTherapySessionAssessments(ts_id, p_id)
  - assessments
    - name, status, url if not complete
- getActions(last_action_id)
```json lines
{
    "result": "description of result",
    "server_time": 100us,
    "max_id": 12399,
    "actions": [
      {
        "type": "message",
          "id": 12345,
        "user": "P123",
        "body": "Foo",
        "recipients": [], // Empty to all, otherwise
        "target" : 12333,
        "callout" : ["123xyz", "P456"],
        "timestamp": "server_timestamp",
      },
      {
        "id": 12346,
        "type": "delete",
        "target": 12340,
        "timestamp": "server_timestamp",
      },
      {
        "id": 12347,
        "type": "notice",
        "body": "Foo has left the session",
        "sender": "system | Therapist",
        "recipients" : [],
        "timestamp": "server_timestamp"
      },
      {
        "id": 12348,
        "target" : 12345
        "type": "message_read",
        "user": "P456",
        "timestamp" : "2023-08-02T21:47:56.697Z"
      },
      {
         "id": 12349,
         "type": "reaction",
         "target": "12345",
          "icon": "heart",
         "user" : "P456",
         "timestamp" : "2023-08-02T21:47:56.697Z"
      },
      {
         "id": 123400,
         "type": "whiteboard",
         "timestamp": "server_timestamp"
      },
      {
         "id": 123400,
         "type": "update_assessments",
         "timestamp": "server_timestamp"
      },
      {
         "id": 123400,
         "type": "update_chat_details",
         "timestamp": "server_timestamp"
      }
    ]
}
```
- saveActions(payloads)
```json lines
[
    {
        "client_ts": "2023-08-02T22:02:53.375Z",
        "type": "reaction",
        "target" 123333
        "user": "P456",
        "icon" : "heart" //heart, smile, sad, angry
    },
    {
        "client_ts": "2023-08-02T22:02:53.375Z",
        "type": "delete",
        "target" 123333
    },
    {
        "client_ts": "2023-08-02T22:02:53.375Z",
        "type": "message",
        "user" : "P456",
        "recipients" : [],
        "body" : "abcd",
        "character_history" : ['a', 'b', 'c', 'd']
        "time_to_complete" : "671ms",
        "target" : 12333
    },
    {
        "client_ts": "2023-08-02T22:02:53.375Z",
        "type": "message",
        "user" : "123XYZ",
        "recipients" : ["P456"], //private message
        "body" : "abcd",
        "character_history" : ['a', 'b', 'c', 'd']
        "time_to_complete" : "671ms",
        "target" : null
    }
]
```


### LOGIC ON AJAX:
1. If login, do not have to be authenticated to handle the request

### CHAT AJAX/INTERVAL LOOP:
Currently the Default timing of the Interval is 5000ms (5 Seconds),  we can adjust it but , 5 seconds feels reasonable and not too laggy

1. User may Enter Messages, Delete Messages, React to Messages, and Reply to Messages
2. Any of these actions will be saved to an "Action Queue" locally until ...
3. the 5 seconds pass and its time for the ajax call in fetchActions()
