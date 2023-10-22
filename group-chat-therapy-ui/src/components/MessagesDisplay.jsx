import React, { useEffect, useState, useRef } from "react";
import Message from "./Message.jsx";
import ReplyMessage from './ReplyMessage.jsx';

export default function MessagesDisplay({messages, replyTo, setReplyTo, pendingMessages}) {
    const messagesEndRef    = useRef(null);
    const [replyMessageId, setReplyMessageId] = useState(null);
    const allMessages       = [...(messages || []), ...(pendingMessages || [])];  // <-- Combine regular and pending messages

    useEffect(() => {
        if (replyTo === null) {
            setReplyMessageId(null);
        }
    }, [replyTo]);

    const handleReply = (id) => {
        setReplyMessageId(id);
        setReplyTo(id);
    }

    const closeReplyMessage = () => {
        setReplyMessageId(null);
    }

    const scrollToBottom = () => {
        const messageContainer = messagesEndRef.current?.parentNode; // This should be .chat_window_inner
        const scrollableContainer = messageContainer?.parentNode; // This should be .chat_window

        if (scrollableContainer) {
             scrollableContainer.scrollTop = scrollableContainer.scrollHeight;
        }
    }

    useEffect(scrollToBottom, [messages]);

    return (
        <>
            <div className={'chat_window'}>
                <div className={`chat_window_inner`}>

                    {allMessages.map((message, index) => {
                        let replyMessage = null;
                        if (message.type === 'message') {
                            replyMessage = messages.find(m => m.id === parseInt(message.target));
                        }
                        return (
                            <div key={index} ref={index === messages.length - 1 ? messagesEndRef : null}>
                                <Message
                                    message={message}
                                    replyMessage={replyMessage}
                                    onReply={handleReply}
                                />
                            </div>
                        )
                    })}
                    <div className="clearfix"/>
                </div>
            </div>
            {replyMessageId && (
                <ReplyMessage
                    message={messages.find(m => m.id === replyMessageId)}
                    onCloseReply={closeReplyMessage}
                />
            )}
        </>
    );
}
