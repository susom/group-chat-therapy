import { createContext, useState, useEffect, useRef } from 'react';

export const SessionContext = createContext({
    data : {},
    setData : () => {}
});

export const SessionContextProvider = ({children}) => {
    //RAW DATA PAYLOADS GO HERE
    const [data, setData]                                   = useState(); //raw INITIAL data
    const [actions, setActions]                             = useState([]); //local session store of actions
    const [chatSessionDetails, setChatSessionDetails]       = useState(null); //chat details
    const [assessments, setAssessments]                     = useState([]); //participant assessments

    //ONE TIME IDs
    const [chatSessionID, setChatSessionID]                 = useState(null); //current chat id
    const [participantID, setParticipantID]                 = useState(null); //current participant id
    const [isAdmin,setIsAdmin]                              = useState(false);

    //POLLING VARS
    const [intervalLength, setIntervalLength]               = useState(5000); //default 3 seconds? depending on ping back can increase or throttle
    const [getActionsIntervalID, setGetActionsIntervalID]   = useState(null); //polling interval id (to cancel it)
    const [isPollingPaused, setIsPollingPaused]             = useState(false); //if cancelling poll, set this flag to easily restart the poll
    const [isPollingActions, setIsPollingActions]           = useState(false); // to kick off polling one time
    const [sendActionQueue, setSendActionQueue]             = useState([]); // keep queue of actions to post during each poll

    //STATUS VARS
    const [assessmentsStatus, setAssessmentStatus]          = useState(false); //participant required assessments status
    const [maxID, setMaxID]                                 = useState(null); //latest action id

    //PROCESSED DATA - FOR UI CONSUMPTION
    const [participants, setParticipants]                   = useState([]);
    const [participantsLookUp, setParticipantsLookUp]       = useState({}); //map participant_id to display name
    const [allChats, setAllChats]                           = useState({"groupChat" : []}); //same as group chat but direct


    //BEGIN FAKE DATA, DELETE LATER
    const icons             = ["heart", "smile", "sad", "angry"];
    const users             = ["123xyz", "abc456", "def789"];
    const notice_arr        = ["Foo has left the session", "Bar has joined the session"]; // Add your notices here
    const messageBodies     = [
        // Short messages
        "Hi there!",
        "Sounds great!",
        "Absolutely!",
        "Good point!",
        "Interesting.",
        "I agree.",
        "Definitely!",
        "Let's do that.",
        "Sure thing.",
        "Hmm, let's see.",

        // Medium length messages
        "How's your day been so far?",
        "That's a really insightful observation.",
        "I've been looking at different strategies recently.",
        "Can we explore your last point in more detail?",
        "How about we try a different approach?",
        "Could you elaborate on that point?",
        "What are your thoughts on this matter?",
        "How have you been feeling about your progress?",

        // Longer messages
        "I just read an interesting article about cognitive behavior therapy. I think it has some points that could apply to our discussion.",
        "I'm really pleased with the progress we've made so far. You're showing a lot of resilience and perseverance.",
        "Let's discuss some coping mechanisms for when you're feeling stressed or overwhelmed. It might be helpful to have some strategies in place.",
        "Your thoughts and feelings are important. Don't hesitate to share anything that comes to mind, even if it seems unrelated.",
        "Remember, there's no rush in this process. It's about making sustainable changes, not instant fixes.",
        "It seems like you're dealing with a lot right now. I want to remind you that it's okay to take a step back when you need to."
    ];
    const server_timestamp  = new Date().toISOString();
    const server_time       = "100ms";
    let actionIdCounter     = 12400; // Make sure this is set to the last ID + 1
    function getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }
    function generateRandomPayload() {
        // 50% chance of returning an empty actions array
        if (Math.random() < 0.2) {
            return {
                result: "description of result",
                server_time: server_time,
                max_id: actionIdCounter - 1, // Last ID used
                actions: []
            };
        }

        const actions = [];
        let lastMessageId = null; // Add this line to track the last message id

        for (let i = 0; i < 5; i++) {
            const actionType = ["message", "message_read", "reaction"];
            if (Math.random() < 0.01) actionType.push("delete");
            if (Math.random() < 0.1) actionType.push("notice");
            if (Math.random() < 0.05) actionType.push("whiteboard");
            if (Math.random() < 0.05) actionType.push("update_assessments");
            if (Math.random() < 0.05) actionType.push("update_chat_details");

            const selectedActionType    = actionType[getRandomInt(actionType.length)];
            const recipients            = Math.random() < 0.5 ? ["123xyz"] : [];

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
                        timestamp: server_timestamp
                    };
                    lastMessageId = messageId;
                    break;
                case "delete":
                    action = {
                        id: actionIdCounter++,
                        type: "delete",
                        target: lastMessageId, // target the last message id
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
                        target: lastMessageId, // target the last message id
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
                        target: lastMessageId, // target the last message id
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
            result: "description of result",
            server_time: server_time,
            max_id: actionIdCounter - 1,
            actions: actions
        };
    }
    //END FAKE DATA, DELETE LATER


    // INIT SESSION START WITH LOGIN PAYLOAD
    // useEffect(() => {
    //     if (data && !isPollingActions) {
    //         console.log("GOT INITIAL DATA PAYLOAD in Session useEffect()", data);
    //
    //         const chat = data;
    //
    //         //SET CHAT SESSION ID
    //         setChatSessionID(data.chat_session_details.chat_id);
    //
    //         //SET INITIAL CHAT SESSION DETAILS
    //         setChatSessionDetails(data.chat_session_details);
    //
    //         //SET CURRENT USER BY "participant_id" (aka PHP Session ID?)
    //         setParticipantID(data.participantID);
    //
    //         //SET LOOKUP FOR MAPPING participant_ids to DISPLAY NAMES
    //         const participantsLookup = data.chat_session_details.participants.reduce((obj, participant) => {
    //             obj[participant.participant_id] = participant.display_name;
    //             return obj;
    //         }, {});
    //         setParticipantsLookUp(participantsLookup);
    //
    //         //IF THIS IS A PARTICIPANT , THEN NEED TO CHECK THEIR ASSESSMENTS STATUS
    //         if(isAdmin) {
    //             //DO A ROLL UP OF ALL THE ASSESSMENTS , BUT DOES NOT NEED TO BLOCK ENTRY INTO CHAT SESSION
    //
    //
    //         }else{
    //             const {assessments} = chat;
    //             setAssessments(assessments);
    //
    //             const participantAssessments    = assessments.find(a => a.participant_id === data.participant_id);
    //             const areAllAssessmentsComplete = participantAssessments?.required.every(a => a.status);
    //             if (areAllAssessmentsComplete) {
    //                 // Stop polling assessments and start polling group chats
    //                 setAssessmentStatus(true);
    //             }
    //         }
    //
    //         //LETS START THE POLLING
    //         setIsPollingActions(true);
    //     }
    // }, [data]);


    // POLL FOR ACTIONS
    // useEffect(() => {
    //     //SHOULD ONLY BE CALLED ONCE AFTER THE INITIAL USE EFFECT
    //     if (isPollingActions && !isPollingPaused) {
    //         const interval = setInterval(fetchActions, intervalLength);
    //
    //         //Use with isPollingPaused(true) to pause
    //         setGetActionsIntervalID(interval);
    //
    //         return () => clearInterval(interval);
    //     }
    // }, [isPollingActions, isPollingPaused]);


    // USE this to call JSMO for AJAX
    const callAjax = (payload, actionType) => {
        // const module = ExternalModules.Stanford.GroupChatTherapy;
        let ajax_return;
        switch(actionType){
            case "getAssessments" :
                 ajax_return = [
                    { participant_id : "abc456",
                        required : [
                            { assessment : "opt-in" , link : "https://redcap.stanford.edu/1", status : true },
                            { assessment : "e-consent" , link : "https://redcap.stanford.edu/2", status : true },
                            { assessment : "baseline survey" , link : "https://redcap.stanford.edu/3", status : true }
                        ]
                    }
                ];

                // ajax_return = module.getAssessments(payload);
            break;

            case "getChatSessionDetails" :
                const motivationalMessages = [
                    "Believe you can and you're halfway there.",
                    "Don't wait for the perfect moment, take the moment and make it perfect.",
                    "It does not matter how slowly you go, as long as you do not stop.",
                    "Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.",
                    "The only way to do great work is to love what you do."
                ];

                ajax_return = {
                    chat_id : "123456abcxyz",
                    title : "Alcohol Intervention",
                    description : "Group Session Chat for Dudes",
                    date : "2023-07-21",
                    time_start : 1100,
                    time_end : 1300,
                    therapist : "123xyz",
                    whiteboard : motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)],

                    participants :  [
                        {participant_id: "123xyz" , display_name : "Mr. Therapist", status : "online/offline"},
                        {participant_id: "abc456" , display_name : "Gilligan", status : "online/offline"},
                        {participant_id: "def789" , display_name : "Wally", status : "online/offline"}
                    ]
                };

                // ajax_return = module.getChatSessionDetails(payload);
            break;

            default:
                // ajax_return = module.getActions(payload);
                ajax_return = generateRandomPayload();
            break;
        }

        return ajax_return;
    }


    // ACTIONS PROCESSING
    const sendAction = async (new_action) => {
        // Create a copy of the new action
        // then delete these added fake properties for temporary display
        let actionCopy = { ...new_action };
        delete actionCopy.id;
        delete actionCopy.isFake;

        // Add the new action to the queue
        const newQueue = [...sendActionQueue, actionCopy];
        setSendActionQueue(newQueue);

        console.log("New Action in Action QUEUE posts every fetchActions", newQueue);

        // Save the new queue to local storage
        localStorage.setItem('sendActionQueue', JSON.stringify(newQueue));
    }

    const clearActionQueue = () => {
        setSendActionQueue([]);
        localStorage.removeItem('sendActionQueue');
    }

    const processAction = (action, actionsArray, allChats) => {
        // MAKE "DEEP" COPIES
        let newAllChats = JSON.parse(JSON.stringify(allChats));
        let updatedActionsArray;

        const allChatsKey   = action.recipients?.length > 0 ? action.recipients.sort().join("|") : "groupChat";

        switch(action.type) {
            case 'delete':
                Object.keys(newAllChats).forEach(chatKey => {
                    newAllChats[chatKey] = newAllChats[chatKey].filter(
                        message => message.id !== action.target
                    );
                    if (newAllChats[chatKey].length === 0) {
                        delete newAllChats[chatKey];
                    }
                });

                updatedActionsArray = actionsArray.filter(prevAction => prevAction.id !== action.id && prevAction.id !== action.target);
                break;

            case 'notice':
                const new_notice = {
                    user: action.sender,
                    body: action.body,
                    timestamp: action.timestamp,
                    type: 'notice'
                };

                if (!newAllChats[allChatsKey]) {
                    newAllChats[allChatsKey] = [];
                }
                newAllChats[allChatsKey].push(new_notice);

                updatedActionsArray = [...actionsArray, action];
                break;

            case 'message':
                if (!newAllChats[allChatsKey]) {
                    newAllChats[allChatsKey] = [];
                }
                newAllChats[allChatsKey].push({
                    id: action.id,
                    user: action.user,
                    body: action.body,
                    timestamp: action.timestamp,
                    read_by: [],
                    reactions: [],
                    type: 'message'
                });

                updatedActionsArray = [...actionsArray, action];
                break;


            case 'message_read':
                for (const chatKey in newAllChats) {
                    newAllChats[chatKey].forEach(message => {
                        if (message.id === action.target) {
                            if (!message.read_by) {
                                message.read_by = [];
                            }
                            message.read_by.push(action);
                        }
                    });
                }

                updatedActionsArray = [...actionsArray, action];
                break;

            case 'reaction':
                for (const chatKey in newAllChats) {
                    newAllChats[chatKey].forEach(message => {
                        if (message.id === action.target) {
                            if (!message.reactions) {
                                message.reactions = [];
                            }
                            message.reactions.push(action);
                        }
                    });
                }

                updatedActionsArray = [...actionsArray, action];
                break;

            case 'update_assessments':
                // Remove the 'assessments' action from the actionsArray
                fetchAssessments();
                updatedActionsArray = actionsArray.filter(prevAction => prevAction.type !== 'assessments');
                break;

            case 'update_chat_details':
            case 'whiteboard':
                // Remove the 'whiteboard' action from the actionsArray
                fetchChatSessionDetails();
                updatedActionsArray = actionsArray.filter(prevAction => prevAction.type !== 'whiteboard');
                break;

            default:
                // ADD THIS ACTION TO THE ARRAY
                updatedActionsArray = [...actionsArray, action];
                break;
        }

        return {
            actionsArray : updatedActionsArray,
            allChats : newAllChats
        }
    };


    //FETCHES
    //SET UP REFS SO THAT INTERVAL HAS ACCESS TO LATEST VALUES AS THE CLOSURE WILL LOCK THOSE VAUES INTO INITIAL STATE
    const maxIDRef              = useRef(maxID);
    const sendActionQueueRef    = useRef(sendActionQueue);
    const actionsRef            = useRef(actions);
    const allChatsRef           = useRef(allChats);

    useEffect(() => {
        maxIDRef.current            = maxID;
        sendActionQueueRef.current  = sendActionQueue;
        actionsRef.current          = actions;
        allChatsRef.current         = allChats;
    }, [maxID, sendActionQueue, actions, allChats]);

    const fetchActions = async ()=> {
        // INSIDE THE CLOSURE OF AN INTERVAL, LOCAL SCOPE DOESNT SEE STATE CHANGES, SO USE REF
        const previous_max_id   = maxIDRef.current;
        const cur_actionQueue   = sendActionQueueRef.current;
        const cur_actionsArr    = actionsRef.current;
        const cur_allChats      = allChatsRef.current;

        //EVERY fetchActions SHOULD POST participant_id, maxID and current sendActionQueue
        const payload       = callAjax({participant_id : participantID, maxID : previous_max_id, send_actions : cur_actionQueue},"getActions");
        const new_actions   = payload.actions;
        const new_max_id    = payload.max_id;
        const server_time   = payload.server_time;

        //actionQueue sent, now Empty it
        clearActionQueue();

        // If there are no new actions, skip processing
        if (new_actions.length === 0) {
            return;
        }

        // MAKE COPY OF EACH GROUP OF ACTIONS/CHATS/PRIVATE CHATS
        let updatedActions      = [...cur_actionsArr];
        let updatedAllChats     = {...cur_allChats};

        // PROCESS EACH NEW ACTION
        new_actions.forEach(action => {
            let result = processAction(action, updatedActions, updatedAllChats);
            updatedActions      = result.actionsArray;
            updatedAllChats     = result.allChats;
        });

        // console.log("new all Chats", updatedAllChats);
        // SET THE STATE WITH UPDATED VALUES
        setActions(updatedActions);
        setAllChats(updatedAllChats);
        setMaxID(new_max_id);
    }

    const fetchAssessments = async () => {
        const fresh_assessments         = callAjax({participant_id : participantID},"getAssessments");
        const participantAssessments    = fresh_assessments.find(a => a.participant_id === data.participant_id);
        const areAllAssessmentsComplete = participantAssessments?.required.every(a => a.status);
        setAssessments(fresh_assessments);

        if (areAllAssessmentsComplete) {
            setAssessmentStatus(true);
        }
    };

    const fetchChatSessionDetails = async () => {
        const fresh_chat_details = callAjax({participant_id : participantID},"getChatSessionDetails");
        setChatSessionDetails(fresh_chat_details);
    }

    const removeMessage = (messageId) => {
        // Make a deep copy of allChats
        let updatedAllChats = JSON.parse(JSON.stringify(allChats));

        // Iterate over all chats
        for (let chatKey in updatedAllChats) {
            // Find the index of the message in the chat
            let messageIndex = updatedAllChats[chatKey].findIndex(message => message.id === messageId);

            // Check if the message exists in this chat
            if (messageIndex !== -1) {
                // Remove the message from the chat
                updatedAllChats[chatKey].splice(messageIndex, 1);

                // If this is a private chat and there are no more messages, remove the chat
                if (chatKey !== 'groupChat' && updatedAllChats[chatKey].length === 0) {
                    delete updatedAllChats[chatKey];
                }

                // Update the state and stop iterating
                setAllChats(updatedAllChats);
                break;
            }
        }
    }


    return (
        <SessionContext.Provider value={{
                                        setData,
                                        data,
                                        getActionsIntervalID,
                                        setIsPollingPaused,
                                        chatSessionID,
                                        participantID: participantID ?? data?.participantID,
                                        isAdmin,
                                        chatSessionDetails,
                                        assessments,
                                        assessmentsStatus,
                                        participantsLookUp,
                                        participants,
                                        allChats,
                                        sendAction, //function
                                        removeMessage
        }}>
            {children}
        </SessionContext.Provider>
    );
}
