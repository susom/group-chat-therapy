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
    const [newActions,setNewActions]                        = useState(null);
    const [newAssessments,setNewAssessments]                = useState(null);
    const [newSessionDetails,setNewSessionDetails]          = useState(null);

    //STATUS VARS
    const [assessmentsStatus, setAssessmentStatus]          = useState(false); //participant required assessments status
    const [maxID, setMaxID]                                 = useState(null); //latest action id

    //PROCESSED DATA - FOR UI CONSUMPTION
    const [participants, setParticipants]                   = useState([]);
    const [participantsLookUp, setParticipantsLookUp]       = useState({}); //map participant_id to display name
    const [allChats, setAllChats]                           = useState({"groupChat" : []}); //same as group chat but direct
    const [mentionCounts, setMentionCounts]                 = useState({});

    // INIT SESSION START WITH LOGIN PAYLOAD
    useEffect(() => {
        if (data && !isPollingActions) {
            console.log("GOT INITIAL DATA PAYLOAD in Session useEffect()", data);

            const chat = data;

            //SET CHAT SESSION ID
            setChatSessionID(data.chat_session_details.chat_id);

            //SET INITIAL CHAT SESSION DETAILS
            setChatSessionDetails(data.chat_session_details);

            //SET CURRENT USER BY "participant_id" (aka PHP Session ID?)
            setParticipantID(data.participantID);

            //SET LOOKUP FOR MAPPING participant_ids to DISPLAY NAMES
            const participantsLookup = data.chat_session_details.participants.reduce((obj, participant) => {
                obj[participant.participant_id] = participant.display_name;
                return obj;
            }, {});
            setParticipantsLookUp(participantsLookup);

            // INITIALIZE PRIVATE CHATS FOR EACH PARTICIPANT
            if (data.participant_id === data.chat_session_details.therapist) {
                const initialChats = { "groupChat": [] };
                for (const participant of data.chat_session_details.participants) {
                    if (participant.participant_id !== data.chat_session_details.therapist) {
                        initialChats[participant.participant_id] = [];
                    }
                }
                setAllChats(initialChats);
            }


            //IF THIS IS A PARTICIPANT , THEN NEED TO CHECK THEIR ASSESSMENTS STATUS
            if(isAdmin) {
                //DO A ROLL UP OF ALL THE ASSESSMENTS , BUT DOES NOT NEED TO BLOCK ENTRY INTO CHAT SESSION


            }else{
                const {assessments} = chat;
                setAssessments(assessments);

                const participantAssessments    = assessments.find(a => a.participant_id === data.participant_id);
                const areAllAssessmentsComplete = participantAssessments?.required.every(a => a.status);
                if (areAllAssessmentsComplete) {
                    // Stop polling assessments and start polling group chats
                    setAssessmentStatus(true);
                }
            }

            //LETS START THE POLLING
            setIsPollingActions(true);
        }
    }, [data]);

    // START POLL FOR FETCH ACTIONS
    useEffect(() => {
        //SHOULD ONLY BE CALLED ONCE AFTER THE INITIAL USE EFFECT
        if (isPollingActions && !isPollingPaused) {
            const interval = setInterval(fetchActions, intervalLength);

            //Use with isPollingPaused(true) to pause
            setGetActionsIntervalID(interval);

            return () => clearInterval(interval);
        }
    }, [isPollingActions, isPollingPaused]);

    // KEEP TRACK OF MENTIONS COUNTS FOR CURRENT PARTICIPANT
    useEffect(() => {
        const newMentionCounts = Object.keys(allChats).reduce((accumulator, chatId) => {
            const chatMessages = allChats[chatId];
            const mentionCount = chatMessages.reduce((count, message) => {
                return message.containsMention ? count + 1 : count;
            }, 0);
            accumulator[chatId] = mentionCount;
            return accumulator;
        }, {});

        setMentionCounts(newMentionCounts);
    }, [allChats]);

    // USE this to call JSMO for AJAX
    const callAjax = (payload, actionType) => {
        const module = ExternalModules.Stanford.GroupChatTherapy;
        switch(actionType){
            case "getAssessments" :
                module.getAssessments(payload, setNewAssessments);
            break;

            case "getChatSessionDetails" :
                module.getChatSessionDetails(payload, setNewSessionDetails);
            break;

            case "setWhiteBoardContent" :
                module.setWhiteBoardContent(payload);
            break;

            default:
                module.handleActions(payload, setNewActions);
            break;
        }
    }


    // ACTIONS PROCESSING
    function isMentioned(message, participantsLookUp, sanitize = false) {
        const pattern       = /@(\w+)/g;
        let containsMention = false;
        let newBody         = message.body;

        if (message && typeof message.body === 'string') {
            newBody = message.body.replace(pattern, (match) => {
                const cleanMention = match.substring(1).trim();
                const participantValues = Object.values(participantsLookUp);
                if (participantValues.includes(cleanMention)) {
                    containsMention = true;
                    return sanitize ? match : `<b>${match}</b>`; // If sanitizing, return the match with '@', else return it with '<b>'
                } else {
                    return sanitize ? cleanMention : match; // if sanitizing and it's not a valid participant, remove '@'
                }
            });
        }

        return { body: newBody, containsMention: containsMention };
    }

    const sendAction = async (new_action) => {
        // Create a copy of the new action
        // then delete these added fake properties for temporary display
        let actionCopy = { ...new_action };
        delete actionCopy.id;
        delete actionCopy.isFake;

        // Add the new action to the queue
        const newQueue = [...sendActionQueue, actionCopy];
        setSendActionQueue(newQueue);

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
                const { body, containsMention } = isMentioned(action, participantsLookUp);

                if (!newAllChats[allChatsKey]) {
                    newAllChats[allChatsKey] = [];
                }

                newAllChats[allChatsKey].push({
                    id: action.id,
                    user: action.user,
                    body: body,
                    timestamp: action.timestamp,
                    read_by: [],
                    reactions: [],
                    target: action.target,
                    type: 'message',
                    containsMention: containsMention
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

    // POST ACTIONS QUEUE AND FETCH LATEST ACTIONS
    useEffect(() => {
        if (!newActions) return;

        const cur_actionsArr    = actionsRef.current;
        const cur_allChats      = allChatsRef.current;

        const new_actions       = newActions.actions;
        const new_max_id        = new_actions && new_actions[new_actions.length-1]?.id;
        const server_time       = newActions.serverTime;

        // console.log("newActions", newActions);

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

        // SET THE STATE WITH UPDATED VALUES
        setActions(updatedActions);
        setAllChats(updatedAllChats);
        setMaxID(new_max_id);
    }, [newActions]);  // Run this effect when newActions changes

    const fetchActions = async ()=> {
        // INSIDE THE CLOSURE OF AN INTERVAL, LOCAL SCOPE DOESNT SEE STATE CHANGES, SO USE REF
        const previous_max_id   = maxIDRef.current;
        const cur_actionQueue   = sendActionQueueRef.current;

        //EVERY fetchActions SHOULD POST participant_id, maxID and current sendActionQueue
        callAjax({maxID : previous_max_id, actionQueue : cur_actionQueue},"getActions");
    }


    //REFRESH ASSESSMENTS/STATUS
    useEffect(() => {
        if (!newAssessments) return;
        const participantAssessments    = newAssessments.find(a => a.participant_id === data.participant_id);
        const areAllAssessmentsComplete = participantAssessments?.required.every(a => a.status);
        setAssessments(newAssessments);

        if (areAllAssessmentsComplete) {
            setAssessmentStatus(true);
        }
    }, [newAssessments]);  // Run this effect when newActions changes

    const fetchAssessments = async () => {
        callAjax({participant_id : participantID},"getAssessments");
    };


    //REFRESH CHAT SESSION DETAILS
    useEffect(() => {
        if (!newSessionDetails) return;
        setChatSessionDetails(newSessionDetails);
    }, [newSessionDetails]);  // Run this effect when newActions changes

    const fetchChatSessionDetails = async () => {
        callAjax({participant_id : participantID},"getChatSessionDetails");
    }


    //REMOVE MESSAGE FROM UI (AND LOCAL CACHE OF MESSAGE ITEMS)
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
                                        full:data,
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
                                        sendAction,
                                        removeMessage,
                                        isMentioned,
                                        mentionCounts,
                                        callAjax
        }}>
            {children}
        </SessionContext.Provider>
    );
}
