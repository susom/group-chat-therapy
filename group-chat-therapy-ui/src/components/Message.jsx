import React, { useState, useContext, useEffect, useRef } from "react";
import Reaction from './Reaction.jsx';
import ReactionPopup from './ReactionPopup.jsx';

import { XSquare, Plus, Trash, ReplyFill } from 'react-bootstrap-icons';

import { SessionContext } from "./../contexts/Session.jsx";
import { ChatContext } from "./../contexts/Chat.jsx";
import ReplyMessage from "./ReplyMessage.jsx";
import { decodeHTMLEntities } from './utils';

export default function Message({ message, onReply, showReactions = true, showReply = true, isReply = false, onCloseReply, replyMessage, className = "" }) {
    const session_context = useContext(SessionContext);
    const chat_context = useContext(ChatContext);

    const isSessionActive = chat_context?.isSessionActive || false;

    const participantsLookUp = session_context.participantsLookUp;
    const participant_id = session_context?.sessionCache?.current_user?.record_id;
    const chat_session_id = session_context?.sessionCache?.selected_session?.record_id;
    const therapistID = session_context?.sessionCache?.selected_session?.ts_therapist || null;

    const [reactions, setReactions] = useState(message.reactions || []);
    const [showReactionPopup, setShowReactionPopup] = useState(false);
    const timeoutRef = useRef(null);

    useEffect(() => {
        setReactions(message.reactions || []);
    }, [message.reactions]);

    function formatTime(timestamp) {
        const date = new Date(timestamp);

        if (isNaN(date.getTime())) {
            return '';
        }

        let hours = date.getHours();
        let minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';

        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;

        return hours + ':' + minutes + ' ' + ampm;
    }

    // Handler for delete functionality
    const handleDelete = () => {
        const timestamp = new Date().toISOString();
        const deleteAction = {
            "type": "delete",
            "sessionID": chat_session_id,
            "target": message.id,
            "client_ts": timestamp
        };

        // DELETE FROM LOCAL VIEW FOR NOW, RESOLVE ON PAYLOAD REFRESH OF NEW ACTIONS
        chat_context.removeMessage(message.id);

        // SEND THE ACTION TO THE actionQueue
        chat_context.sendAction(deleteAction);

        console.log(`Message ${message.id} deleted.`);
    }

    const onReact = (reaction) => {
        const timestamp = new Date().toISOString();
        const newReaction = {
            type: "reaction",
            sessionID: chat_session_id,
            icon: reaction,
            user: participant_id,
            target: message.id,
            client_ts: timestamp
        };

        // ADD IT TO THE LOCAL VIEW FOR NOW, RESOLVE ON PAYLOAD REFRESH OF NEW ACTIONS
        const updatedLocalReactions = [...reactions, newReaction];
        setReactions(updatedLocalReactions); // update the local reactions state

        // SEND THE ACTION TO THE actionQueue
        chat_context.sendAction(newReaction);
    }

    const handleReply = (id) => {
        console.log(`replying to message id ${id}`);
        onReply(id);

        // Set up the Fake UI
    }

    const handleReactionClick = () => {
        setShowReactionPopup(true);
        timeoutRef.current = setTimeout(() => {
            setShowReactionPopup(false);
        }, 3000);
    };

    const handleReactionMouseEnter = () => {
        clearTimeout(timeoutRef.current);
    };

    const handleReactionMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setShowReactionPopup(false);
        }, 3000);
    };

    const filteredReactions = reactions && reactions.filter(reaction => String(reaction.target) === String(message.id));
    const participantColor = chat_context.participantColorsMap[message.user];

    return (
        <dl className={`${message.type} ${String(participant_id) === String(message.user) ? 'self' : ''} ${message.isFake ? 'fake' : ''} ${className} ${message.containsMention ? "callout" : ""} ${message.wasSeen ? "seen" : ""} ${filteredReactions && filteredReactions.length > 0 ? 'has_reactions' : ''}`}>
            <dt className={'participant'} style={{ color: participantColor }}>
                <span className={`display_name`}>{isReply ? `Replying to ${participantsLookUp[message.user]}` : participantsLookUp[message.user]}</span>

                {(String(participant_id) === String(message.user) || String(participant_id) === String(therapistID)) && isSessionActive && (
                    <span className={'delete'} onClick={handleDelete}>
                        <Trash title={`Delete Message`} />
                    </span>
                )}

                {showReply && String(participant_id) !== String(message.user) && isSessionActive && (
                    <span className={`reply_quote`} onClick={() => handleReply(message.id)}>
                        <ReplyFill title={`Reply to Message`} />
                    </span>
                )}
            </dt>

            {isReply && (
                <dd className={'close'} onClick={onCloseReply}>
                    <XSquare size='25' title={"Cancel Reply to Message"} />
                </dd>
            )}

            <dd className={`message_body`}>
                {replyMessage && (
                    <ReplyMessage
                        message={replyMessage}
                        onCloseReply={onCloseReply}
                    />
                )}
                {message.containsMention ? (
                    <div dangerouslySetInnerHTML={{ __html: message.body }} />
                ) : (
                    <div>{decodeHTMLEntities(message.body)}</div>
                )}

                <span className={'timestamp'}>{message.isFake ? 'Sending...' : formatTime(message.timestamp)}</span>
            </dd>
            <dd className={'reactions'}>
                {filteredReactions && filteredReactions.map(reaction => (
                    <Reaction reaction={reaction} key={reaction.id} displayOnly={true} />
                ))}
            </dd>

            {showReactions && String(participant_id) !== String(message.user) && isSessionActive && (
                <dd className={'add_reactions'} onClick={handleReactionClick} onMouseOver={handleReactionMouseEnter} onMouseOut={handleReactionMouseLeave}>
                    <Plus title={`React to Message`} />
                    {showReactionPopup && <ReactionPopup onReact={onReact} />}
                </dd>
            )}

        </dl>
    );
}
