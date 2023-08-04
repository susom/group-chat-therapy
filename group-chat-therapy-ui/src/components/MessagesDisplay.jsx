import React, { useEffect, useState, useRef } from "react";
import Message from "./Message.jsx";
import ReplyMessage from './ReplyMessage.jsx';

export default function MessagesDisplay({messages, replyTo, setReplyTo}) {
    const messagesEndRef = useRef(null);
    const [replyMessageId, setReplyMessageId] = useState(null);

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
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(scrollToBottom, [messages]);

    return (
        <>
            <div className={'chat_window'}>
                <div className={`chat_window_inner`}>

                    {messages.map((message, index) => {
                        let replyMessage = null;
                        if (message.type === 'message') {
                            replyMessage = messages.find(m => m.id === message.target);
                        }
                        return (
                            <Message key={index}
                                     message={message}
                                     replyMessage={replyMessage}
                                     onReply={handleReply}
                            />
                        )
                    })}
                    <div className="clearfix"  ref={messagesEndRef} />
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
