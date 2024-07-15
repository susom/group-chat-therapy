// ReplyMessage.jsx
import React from 'react';
import Message from './Message.jsx';

export default function ReplyMessage({ message, onCloseReply }) {
    return (
        <div className="reply_message">
            <Message
                message={message}
                showReactions={false}
                showReply={false}
                isReply={true}
                onCloseReply={onCloseReply}
                className="quoted_message"
            />
        </div>
    );
}
