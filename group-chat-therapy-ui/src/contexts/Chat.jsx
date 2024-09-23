import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { SessionContext } from "./Session.jsx";
import { useNavigate } from 'react-router-dom';

export const ChatContext = createContext({
    data : {},
    setData : () => {}
});

export const ChatContextProvider = ({children}) => {
    const session_context                                   = useContext(SessionContext);
    const navigate = useNavigate();
    const isAdmin = session_context.isAdmin;

    //RAW DATA PAYLOADS GO HERE
    const [data, setData]                                   = useState(); //raw INITIAL data
    const [actions, setActions]                             = useState([]); //local session store of actions

    //ONE TIME IDs
    const [chatSessionID, setChatSessionID]                 = useState(null); //current chat id
    const [participantID, setParticipantID]                 = useState(null); //current participant id
    const [participants, setParticipants]                   = useState([]);
    const [isUserAdmitted, setIsUserAdmitted] = useState(false);

    //POLLING VARS
    const [intervalLength, setIntervalLength]               = useState(2000); //default 3 seconds? depending on ping back can increase or throttle

    const [isPollingPaused, setIsPollingPaused]             = useState(false); //if cancelling poll, set this flag to easily restart the poll
    const [isPollingActions, setIsPollingActions]           = useState(false); // to kick off polling one time
    const [sendActionQueue, setSendActionQueue]             = useState([]); // keep queue of actions to post during each poll
    const [isSessionActive, setIsSessionActive]             = useState(true);

    const [newActions,setNewActions]                        = useState(null);

    //STATUS VARS
    const [maxID, setMaxID]                                 = useState(null); //latest action id
    const [whiteboardUpdate, setWhiteboardUpdate]           = useState(false); //whiteboard updating

    //PROCESSED DATA - FOR UI CONSUMPTION
    const [allChats, setAllChats]                           = useState({"groupChat" : []}); //same as group chat but direct
    const [pendingMessages, setPendingMessages]             = useState({});

    const [mentionCounts, setMentionCounts]                 = useState({});
    const [newMessageCounts, setNewMessageCounts]           = useState({});

    const [selectedChat, setSelectedChat]                   = useState('groupChat');
    let timeoutRef = useRef();

    const participantColors = [
        "#D04D2E", // Darkened Red
        "#2EB849", // Darkened Green
        "#2E49B8", // Darkened Blue
        "#D02D8E", // Darkened Pink
        "#D0742E", // Darkened Orange
        "#742ED0", // Darkened Purple
        "#2ED0D0", // Darkened Teal
        "#D02E2E", // Darkened Bright Red
        "#2ED02E", // Darkened Bright Green
        "#2E2ED0"  // Darkened Bright Blue
    ];


    const [participantColorsMap, setParticipantColorsMap] = useState({});

    useEffect(() => {
        if (session_context?.sessionCache?.selected_session) {
            const participants = session_context?.sessionCache?.selected_session["ts_chat_room_participants"];
            console.log("setColors useeffect participants?", participants);

            const colorsMap = {};
            participants.forEach((participant, index) => {
                colorsMap[participant] = participantColors[index % participantColors.length];
            });

            console.log("user effect colorsMap", colorsMap);
            setParticipantColorsMap(colorsMap);
        }
    }, [session_context]);

    // INIT CHAT SESSION
    useEffect(() => {
        if (!isPollingActions && session_context?.sessionCache?.selected_session) {
            setChatSessionID(session_context?.sessionCache?.selected_session["record_id"]);
            setParticipants(session_context?.sessionCache?.selected_session["ts_chat_room_participants"]);
            setParticipantID(session_context.sessionCache.current_user.record_id);

            let cur_user_admin = `${session_context.sessionCache.current_user.admin}` === "1";
            // setIsAdmin(cur_user_admin);

            const initialChats = {"groupChat": []};

            if (cur_user_admin) {
                session_context?.sessionCache?.selected_session.ts_chat_room_participants.forEach(userid => {
                    initialChats[parseInt(userid)] = [];
                });
            } else {
                initialChats[parseInt(session_context?.sessionCache?.selected_session.ts_therapist)] = []; // Assuming therapist has an id.
            }

            setAllChats(initialChats);

            //LETS START THE POLLING
            setIsPollingActions(true);
        }
    }, [isPollingActions, session_context]);

    // START POLL FOR FETCH ACTIONS
    useEffect(() => {
        //SHOULD ONLY BE CALLED ONCE AFTER THE INITIAL USE EFFECT
        if (isPollingActions && !isPollingPaused) {
            fetchActions();
        }
        return () => {
            clearTimeout(timeoutRef)
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
                    message.body.includes(`@${session_context.participantsLookUp[participantID]}`) &&
                    (!message.wasSeen || message.wasSeen === false);

                return mentionsCurrentParticipant ? count + 1 : count;
            }, 0);

            accumulator[chatId] = mentionCount;
            return accumulator;
        }, {});

        setMentionCounts(newMentionCounts);
    }, [allChats]);

    //TRACK TO SEE IF USER IS STILL ADMITTED INTO THE CHAT
    useEffect(() => {
        const checkUserAdmittance = () => {
            const cache = session_context?.sessionCache;
            const userId = cache?.current_user?.record_id;
            const participants = cache?.selected_session?.ts_chat_room_participants;
            const admitted = participants?.includes(userId);

            console.log("Participants Is User Admitted:isAdmin:", participants, admitted, isAdmin);
            setIsUserAdmitted(admitted);

            // If the user is not admitted, navigate to landing
            if (!isAdmin && !admitted) {
                navigate('/landing'); // Add this line
            }
        };

        const intervalId = setInterval(checkUserAdmittance, 5000); // Check every 5 seconds

        return () => clearInterval(intervalId); // Clear interval on component unmount
    }, [session_context]);



    // USE this to call JSMO for AJAX
    const callAjax = (payload, actionType) => {
        const module = ExternalModules.Stanford.GroupChatTherapy;
        switch(actionType){
            case "setWhiteboard" :
                module.setWhiteboard(payload, setWhiteboardUpdate, setWhiteboardUpdate);
                break;

            case "getParticipants" :
                module.getParticipants(payload, (res) => {
                    if (res) {
                        const participant_lookup = res?.data?.reduce((acc, item) => {
                            acc[item.record_id] = item.participant_display_name;
                            return acc;
                        }, {});

                        // Only update the state if participant_lookup is different from the previous value
                        if (JSON.stringify(session_context.participantsLookUp) !== JSON.stringify(participant_lookup)) {
                            session_context.setParticipantsLookUp(participant_lookup);
                        }
                    }
                }, (err) => {
                    console.log("getParticipants error");
                });
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
                const cleanMention      = match.substring(1).trim();
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
        // console.log("Modified Messages", modifiedMessages);

        // Update the allChats state
        setAllChats(updatedChats);
    };

    const sendAction = async (new_actions) => {
        // If new_actions is not an array, make it an array
        if (!Array.isArray(new_actions)) {
            new_actions = [new_actions];
        }

        // Process actions to remove temporary properties
        const processedActions = new_actions.map(action => {
            let actionCopy = { ...action };
            delete actionCopy.id;
            delete actionCopy.isFake;
            return actionCopy;
        });

        // Add the new actions to the queue
        const newQueue = [...sendActionQueue, ...processedActions];
        setSendActionQueue(newQueue);

        // Save the new queue to local storage
        localStorage.setItem('sendActionQueue', JSON.stringify(newQueue));
    };

    const clearActionQueue = () => {
        setSendActionQueue([]);
        localStorage.removeItem('sendActionQueue');
    }

    const processAction = (action, actionsArray, allChats) => {
        // Check if the action has already been processed
        if (action.id && actionsArray.some(existingAction => String(existingAction.id) === String(action.id))) {
            // Skip processing this action
            return {
                actionsArray,
                allChats,
                newMessageCount: 0,
                chatKey: null,
            };
        }

        // MAKE "DEEP" COPIES
        let updatedActionsArray;
        let foundMatch = false;

        // Deep copy of allChats to avoid mutating state directly
        let newAllChats = JSON.parse(JSON.stringify(allChats));
        let allChatsKey = "groupChat";

        if (action.recipients?.length > 0) {
            allChatsKey = participantID === action.user ? action.recipients.pop() : action.user;
        }

        let isNewMessage = 0;

        switch (action.type) {
            case 'delete':
                // Remove the message from all chats
                Object.keys(newAllChats).forEach(chatKey => {
                    newAllChats[chatKey] = newAllChats[chatKey].filter(
                        message => String(message.id) !== String(action.target)
                    );
                    if (newAllChats[chatKey].length === 0) {
                        delete newAllChats[chatKey];
                    }
                });

                // Remove the action from the actions array
                updatedActionsArray = actionsArray.filter(
                    prevAction => String(prevAction.id) !== String(action.id) && String(prevAction.id) !== String(action.target)
                );
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

                // Check for duplicate notice before adding
                if (!newAllChats[allChatsKey].some(
                    msg => msg.type === 'notice' && msg.timestamp === action.timestamp && msg.body === action.body
                )) {
                    newAllChats[allChatsKey].push(new_notice);
                }

                updatedActionsArray = [...actionsArray, action];
                break;

            case 'message':
                const { body, containsMention } = isMentioned(
                    action,
                    session_context.participantsLookUp,
                    participantID
                );

                if (!newAllChats[allChatsKey]) {
                    newAllChats[allChatsKey] = [];
                }

                // Remove corresponding pending message based on 'client_ts'
                if (action.client_ts) {
                    // Remove from pendingMessages
                    setPendingMessages(prevPending => {
                        const updatedPending = { ...prevPending };
                        if (updatedPending[allChatsKey]) {
                            updatedPending[allChatsKey] = updatedPending[allChatsKey].filter(
                                pendingMsg => pendingMsg.client_ts !== action.client_ts
                            );
                        }
                        return updatedPending;
                    });

                    // Remove from newAllChats
                    newAllChats[allChatsKey] = newAllChats[allChatsKey].filter(
                        msg => msg.client_ts !== action.client_ts
                    );
                }

                // Check for duplicate message before adding
                if (!newAllChats[allChatsKey].some(msg => String(msg.id) === String(action.id))) {
                    newAllChats[allChatsKey].push({
                        id: action.id,
                        user: action.user,
                        body: body,
                        timestamp: action.timestamp,
                        read_by: [],
                        reactions: [],
                        target: action.target,
                        type: 'message',
                        containsMention: containsMention,
                        client_ts: action.client_ts // Include client_ts in message
                    });

                    // Increment the newMessageCounts if:
                    // 1. Not currently viewing this chat, and
                    // 2. Message was not sent by the current user
                    if (allChatsKey !== selectedChat && action.user !== participantID) {
                        isNewMessage = 1;
                    }
                }

                updatedActionsArray = [...actionsArray, action];
                break;

            case 'message_read':
                for (const chatKey in newAllChats) {
                    if (foundMatch) break;

                    newAllChats[chatKey].some(message => {
                        if (String(message.id) === String(action.target)) {
                            if (!message.read_by) {
                                message.read_by = [];
                            }
                            // Check for duplicate read action before adding
                            if (!message.read_by.some(readAction => String(readAction.id) === String(action.id))) {
                                message.read_by.push(action);
                            }
                            foundMatch = true;
                            return true;
                        }
                        return false;
                    });
                }

                updatedActionsArray = [...actionsArray, action];
                break;

            case 'reaction':
                for (const chatKey in newAllChats) {
                    if (foundMatch) break;

                    newAllChats[chatKey].some(message => {
                        if (String(message.id) === String(action.target)) {
                            if (!message.reactions) {
                                message.reactions = [];
                            }
                            // Check for duplicate reaction before adding
                            if (!message.reactions.some(reaction => String(reaction.id) === String(action.id))) {
                                message.reactions.push(action);
                            }
                            foundMatch = true;
                            return true;
                        }
                        return false;
                    });
                }

                updatedActionsArray = [...actionsArray, action];
                break;

            case 'whiteboard':
                if (session_context?.sessionCache) {
                    // Create a shallow copy of sessionCache
                    const copyof = { ...session_context.sessionCache };

                    // Update the selected_session with new whiteboard content
                    copyof.selected_session = {
                        ...copyof.selected_session,
                        ts_whiteboard: action.body
                    };

                    session_context.setSessionCache(copyof);
                }

                // Remove previous whiteboard actions
                updatedActionsArray = actionsArray.filter(
                    prevAction => prevAction.type !== 'whiteboard'
                );
                break;

            case 'endChatSession':
                setIsPollingPaused(true);
                setIsSessionActive(false);
                break;

            default:
                // Add the action to the array
                updatedActionsArray = [...actionsArray, action];
                break;
        }

        return {
            actionsArray: updatedActionsArray,
            allChats: newAllChats,
            newMessageCount: isNewMessage,
            chatKey: allChatsKey
        };
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
        if (!newActions || newActions?.data.length === 0) return;


        const cur_actionsArr    = actionsRef.current;
        const cur_allChats      = allChatsRef.current;

        const new_actions       = newActions.data;
        const keys              = Object.keys(new_actions);
        const lastActionKey     = keys[keys.length - 1];
        const new_max_id        = new_actions && new_actions[lastActionKey]?.id;
        const server_time       = newActions.serverTime;

        //actionQueue sent, now Empty it
        // if()
        if(new_actions)
            clearActionQueue();
            setPendingMessages({});


        // If there are no new actions, skip processing
        if (!new_actions || new_actions.length === 0) {
            return;
        }

        // MAKE COPY OF EACH GROUP OF ACTIONS/CHATS/PRIVATE CHATS
        let updatedActions      = [...cur_actionsArr];
        let updatedAllChats     = {...cur_allChats};

        // PROCESS EACH NEW ACTION
        let totalNewMessages    = {};
        Object.values(new_actions).forEach(action => {
            let result          = processAction(action, updatedActions, updatedAllChats);

            if (result.newMessageCount) {
                totalNewMessages[result.chatKey] = (totalNewMessages[result.chatKey] || 0) + result.newMessageCount;
            }

            updatedActions      = result.actionsArray;
            updatedAllChats     = result.allChats;
        });

        //SET THe NEW MESSAGE COUNT
        const updatedMessageCounts = {
            ...newMessageCounts,
            ...totalNewMessages
        };
        setNewMessageCounts(updatedMessageCounts);

        // SET THE STATE WITH UPDATED VALUES
        setActions(updatedActions);
        setAllChats(updatedAllChats);
        setMaxID(new_max_id);
    }, [newActions]);  // Run this effect when newActions changes

    const isPollingPausedRef = useRef(isPollingPaused);

    useEffect(() => {
        isPollingPausedRef.current = isPollingPaused;
    }, [isPollingPaused]);


    const fetchActions = async () => {
        // INSIDE THE CLOSURE OF AN INTERVAL, LOCAL SCOPE DOESNT SEE STATE CHANGES, SO USE REF
        const previous_max_id   = maxIDRef.current;
        const cur_actionQueue   = sendActionQueueRef.current;
        const endChatFlag       = cur_actionQueue.some(obj => obj.type === "endChatSession");

        //EVERY fetchActions SHOULD POST participant_id, maxID and current sendActionQueue
        callAjax({sessionID : chatSessionID, userID: participantID, isAdmin: isAdmin,  maxID : previous_max_id, actionQueue : cur_actionQueue, endChatSession: endChatFlag}, "handleActions");

        if (!isPollingPausedRef.current) {
            // console.log("im still polling", isPollingPausedRef.current);
            timeoutRef = setTimeout(fetchActions, intervalLength);
        }
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

    const addPendingMessage = (newAction, selectedChat) => {
        setPendingMessages(prevPending => {
            const currentPending = prevPending[selectedChat] ? [...prevPending[selectedChat]] : [];
            return {
                ...prevPending,
                [selectedChat]: [...currentPending, newAction]
            };
        });
    };

    return (
        <ChatContext.Provider value={{
            setData,
            data,
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
            resetMentions,
            isSessionActive,
            setNewMessageCounts,
            newMessageCounts,
            selectedChat,
            setSelectedChat,
            pendingMessages,
            addPendingMessage,
            participantColorsMap,
            isUserAdmitted
        }}>
            {children}
        </ChatContext.Provider>

    );
}
