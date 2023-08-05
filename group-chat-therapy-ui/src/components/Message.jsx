import React, {useState, useContext, useEffect, useRef} from "react";
import Reaction from './Reaction.jsx';
import ReactionPopup from './ReactionPopup.jsx';

import { XSquare, Plus, Trash, ReplyFill } from 'react-bootstrap-icons';

import {SessionContext} from "./../contexts/Session.jsx";
import ReplyMessage from "./ReplyMessage.jsx";

export default function Message({ message, onReply, showReactions = true, showReply = true, isReply = false, onCloseReply, replyMessage, className = ""}) {
    const session_context           = useContext(SessionContext);
    const participantsLookUp        = session_context.participantsLookUp;
    const participant_id            = session_context.participantID;

    const [reactions, setReactions]                 = useState(message.reactions || []);
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
        minutes = minutes < 10 ? '0'+ minutes : minutes;

        return hours + ':' + minutes + ' ' + ampm;
    }

    // Handler for delete functionality
    const handleDelete = () => {
        const timestamp     = new Date().toISOString();
        const deleteAction  = {
            "client_ts": timestamp,
            "type": "delete",
            "target": message.id
        };

        // DELETE FROM LOCAL VIEW FOR NOW, RESOLVE ON PAYLOAD REFRESH OF NEW ACTIONS
        session_context.removeMessage(message.id);

        //SEND THE ACTION TO THE actionQUEUE
        session_context.sendAction(deleteAction);

        console.log(`Message ${message.id} deleted.`);
    }

    const onReact = (reaction) => {
        const timestamp     = new Date().toISOString();
        const newReaction   = {
            client_ts : timestamp,
            type : "reaction",
            target : message.id,
            user : participant_id,
            icon : reaction,
        };

        //ADD IT TO THE LOCAL VIEW FOR NOW, RESOLVE ON PAYLOAD REFRESH OF NEW ACTIONS
        const updatedLocalReactions = [...reactions, newReaction];
        setReactions(updatedLocalReactions); // update the local reactions state

        //SEND THE ACTION TO THE actionQUEUE
        session_context.sendAction(newReaction);
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

    return (
        <dl className={`${message.type} ${participant_id === message.user ? 'self' : ''} ${message.isFake ? 'fake' : ''} ${className} ${message.containsMention ? "callout" : ""}`}>
            <dt className={'participant'}>
                {isReply ? `Replying to ${participantsLookUp[message.user]}` : participantsLookUp[message.user]}
            </dt>

            <dd className={`message_body`}>
                {replyMessage && (
                    <ReplyMessage
                        message={replyMessage}
                        onCloseReply={onCloseReply}
                    />
                )}
                {message.containsMention ? (
                    <div dangerouslySetInnerHTML={{ __html: message.body }}/>
                ) : (
                    <div>{message.body}</div>
                )}
            </dd>
            <dd className={'timestamp'}>{ message.isFake ? 'Sending...' : formatTime(message.timestamp) }</dd>
            <dd className={'reactions'}>{reactions && reactions.filter(reaction => reaction.target === message.id).map(reaction => (
                <Reaction reaction={reaction} key={reaction.id} displayOnly={true} />
            ))}</dd>

            {showReactions && participant_id !== message.user && (
                <dd className={'add_reactions'} onClick={handleReactionClick} onMouseOver={handleReactionMouseEnter} onMouseOut={handleReactionMouseLeave}>
                    <Plus title={`React to Message`}/>
                    {showReactionPopup && <ReactionPopup onReact={onReact} />}
                </dd>
            )}

            {showReply && participant_id !== message.user && (
                <dd className={`reply_quote`} onClick={() => handleReply(message.id)}>
                    <ReplyFill title={`Reply to Message`}/>
                </dd>
            )}

            {participant_id === message.user && ( // If the message is from the current participant, show the delete icon
                <dd className={'delete'} onClick={handleDelete}>
                    <Trash title={`Delete Message`}/>
                </dd>
            )}

            {isReply && (
                <dd className={'close'} onClick={onCloseReply}>
                    <XSquare size='25' title={"Cancel Reply to Message"} />
                </dd>
            )}
        </dl>
    );
}
