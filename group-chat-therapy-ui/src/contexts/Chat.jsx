import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { SessionContext } from "./Session.jsx";

export const ChatContext = createContext({
    data : {},
    setData : () => {}
});

export const ChatContextProvider = ({children}) => {
    const session_context                                   = useContext(SessionContext);

    //RAW DATA PAYLOADS GO HERE
    const [data, setData]                                   = useState(); //raw INITIAL data
    const [actions, setActions]                             = useState([]); //local session store of actions

    //ONE TIME IDs
    const [chatSessionID, setChatSessionID]                 = useState(null); //current chat id
    const [participantID, setParticipantID]                 = useState(null); //current participant id
    const [isAdmin,setIsAdmin]                              = useState(false);
    const [participants, setParticipants]                   = useState([]);

    //POLLING VARS
    const [intervalLength, setIntervalLength]               = useState(10000); //default 3 seconds? depending on ping back can increase or throttle
    const [getActionsIntervalID, setGetActionsIntervalID]   = useState(null); //polling interval id (to cancel it)
    const [isPollingPaused, setIsPollingPaused]             = useState(false); //if cancelling poll, set this flag to easily restart the poll
    const [isPollingActions, setIsPollingActions]           = useState(false); // to kick off polling one time
    const [sendActionQueue, setSendActionQueue]             = useState([]); // keep queue of actions to post during each poll

    const [newActions,setNewActions]                        = useState(null);

    //STATUS VARS
    const [maxID, setMaxID]                                 = useState(null); //latest action id
    const [whiteboardUpdate, setWhiteboardUpdate]           = useState(false); //whiteboard updating

    //PROCESSED DATA - FOR UI CONSUMPTION
    const [allChats, setAllChats]                           = useState({"groupChat" : []}); //same as group chat but direct
    const [mentionCounts, setMentionCounts]                 = useState({});


    // INIT CHAT SESSION
    useEffect(() => {
        if (!isPollingActions && session_context?.data?.selected_session) {
            console.log("inside CHAT CONTEXT initial useEffect", session_context?.data);

            setChatSessionID(session_context.data.selected_session["record_id"]);
            setParticipants(session_context.data.selected_session["ts_chat_room_participants"]);

            //LETS START THE POLLING
            setIsPollingActions(true);
        }
    }, [isPollingActions, session_context]);

    // START POLL FOR FETCH ACTIONS
    useEffect(() => {
        //SHOULD ONLY BE CALLED ONCE AFTER THE INITIAL USE EFFECT
        if (isPollingActions && !isPollingPaused) {
            console.log("kicking off the polling chatSessionID participants", chatSessionID, participants);

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

            // Only count mentions that relate to the current participant ID and haven't been seen
            const mentionCount = chatMessages.reduce((count, message) => {
                // Check if the message mentions the current participant ID
                const mentionsCurrentParticipant =
                    message.containsMention &&
                    message.body.includes(`@${participantsLookUp[participantID]}`) &&
                    (!message.wasSeen || message.wasSeen === false);

                return mentionsCurrentParticipant ? count + 1 : count;
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
            case "setWhiteBoardContent" :

                module.setWhiteboard(payload, setWhiteboardUpdate, setWhiteboardUpdate);
                break;

            default:
                module.handleActions(payload, setNewActions);
                break;
        }
    }


    // ACTIONS PROCESSING
    function isMentioned(message, participantsLookUp, participant_id, sanitize = false) {
        const pattern       = /@(\w+)/g;
        let containsMention = false;
        let newBody         = message.body;

        if (message && typeof message.body === 'string') {
            newBody = message.body.replace(pattern, (match) => {
                const cleanMention = match.substring(1).trim();
                const participantValues = Object.values(participantsLookUp);
                if (participantValues.includes(cleanMention)) {
                    containsMention = true;
                    return (cleanMention === participantsLookUp[participant_id] && !sanitize) ?  `<b>${match}</b>` : match; // If sanitizing, return the match with '@', else return it with '<b>'
                } else {
                    return sanitize ? cleanMention : match; // if sanitizing and it's not a valid participant, remove '@'
                }
            });
        }

        return { body: newBody, containsMention: containsMention };
    }

    const resetMentions = (chatKey) => {
        let modifiedMessages = [];  // To store the messages you've just modified

        // Modify the messages in the specified chat room to reset the isMentioned property
        const updatedChats = {
            ...allChats,
            [chatKey]: allChats[chatKey].map(message => {
                if (message.containsMention) {
                    modifiedMessages.push(message);  // Add the message to modifiedMessages array
                    return {
                        ...message,
                        wasSeen: true
                    };
                }
                return message;  // Return the original message if isMentioned is false
            })
        };

        // Log the messages you've modified
        console.log("Modified Messages", modifiedMessages);

        // Update the allChats state
        setAllChats(updatedChats);
    };

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
        let updatedActionsArray;
        let newAllChats     = JSON.parse(JSON.stringify(allChats));
        const allChatsKey   = action.recipients?.length > 0 ? action.recipients.sort().join("|") : "groupChat";

        switch(action.type) {
            case 'delete':
                Object.keys(newAllChats).forEach(chatKey => {
                    newAllChats[chatKey] = newAllChats[chatKey].filter(
                        message => message.id !== action.target
                    );
                    if (newAllChats.hasOwnProperty(chatKey) && newAllChats[chatKey].length === 0) {
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
                const { body, containsMention } = isMentioned(action, session_context.participantsLookUp, participantID);

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

            case 'whiteboard':
                if (session_context?.data) {
                    // Create a shallow copy of data
                    const copyof = { ...session_context.data };

                    // Create a copy of selected_session
                    copyof.selected_session = {
                        ...copyof.selected_session,
                        ts_whiteboard: action.body
                    };

                    session_context.setData(copyof);
                }

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
        console.log("newActions useeffect", newActions);
        if (!newActions) return;

        const cur_actionsArr    = actionsRef.current;
        const cur_allChats      = allChatsRef.current;

        const new_actions       = newActions.data;
        const keys              = Object.keys(new_actions);
        const lastActionKey     = keys[keys.length - 1];
        const new_max_id        = new_actions && new_actions[lastActionKey]?.id;
        const server_time       = newActions.serverTime;

        //actionQueue sent, now Empty it
        clearActionQueue();

        // If there are no new actions, skip processing
        if (!new_actions || new_actions.length === 0) {
            return;
        }

        // MAKE COPY OF EACH GROUP OF ACTIONS/CHATS/PRIVATE CHATS
        let updatedActions      = [...cur_actionsArr];
        let updatedAllChats     = {...cur_allChats};

        console.log("new_actions coming through!", new_actions);
        // PROCESS EACH NEW ACTION
        Object.values(new_actions).forEach(action => {
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
        console.log("callAjax", {sessionID : chatSessionID, maxID : previous_max_id, actionQueue : cur_actionQueue});
        callAjax({sessionID : chatSessionID, maxID : previous_max_id, actionQueue : cur_actionQueue},"handleActions");
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
        <ChatContext.Provider value={{
            setData,
            data,
            getActionsIntervalID,
            setIsPollingPaused,
            chatSessionID,
            participantID,
            isAdmin,
            allChats,
            sendAction,
            removeMessage,
            isMentioned,
            mentionCounts,
            callAjax,
            resetMentions
        }}>
            {children}
        </ChatContext.Provider>
    );
}
