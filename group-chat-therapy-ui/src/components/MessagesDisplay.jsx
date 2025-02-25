import React, { useEffect, useState, useRef } from "react";
import Message from "./Message.jsx";
import ReplyMessage from './ReplyMessage.jsx';

export default function MessagesDisplay({ messages, replyTo, setReplyTo, pendingMessages }) {
    const messagesEndRef = useRef(null);
    const [replyMessageId, setReplyMessageId] = useState(null);
    const allMessages = [...(messages || []), ...(pendingMessages || [])]; // Combine regular and pending messages

    useEffect(() => {
        if (replyTo === null) {
            setReplyMessageId(null);
        }
    }, [replyTo]);

    const handleReply = (id) => {
        setReplyMessageId(id);
        setReplyTo(id);
    };

    const closeReplyMessage = () => {
        setReplyMessageId(null);
    };

    const scrollToBottom = (forceScroll = false) => {
        const messageContainer = messagesEndRef.current?.parentNode; // .chat_window_inner
        const scrollableContainer = messageContainer?.parentNode;    // .chat_window
    
        if (scrollableContainer) {
            const isAtBottom = scrollableContainer.scrollHeight - scrollableContainer.scrollTop <= scrollableContainer.clientHeight + 5;
    
            if (forceScroll || isAtBottom) {
                scrollableContainer.scrollTop = scrollableContainer.scrollHeight;
            }
        }
    };
    
    // Run once when the component mounts
    useEffect(() => {
        scrollToBottom(true);  // Force scroll to bottom only when the user first joins
    }, []);
    
    // Only scroll when a new message arrives, but respect user's manual scrolling
    useEffect(() => {
        scrollToBottom(false);  // Scroll only if they are already at the bottom
    }, [allMessages]);
    

    return (
        <>
            <div className="chat_window">
                <div className="chat_window_inner">
                    {allMessages.map((message, index) => {
                        let replyMessage = null;
                        if (message.type === 'message') {
                            replyMessage = messages.find(m => String(m.id) === String(message.target));
                        }
                        return (
                            <div
                                key={message.id}
                                ref={index === allMessages.length - 1 ? messagesEndRef : null}
                            >
                                <Message
                                    message={message}
                                    replyMessage={replyMessage}
                                    onReply={handleReply}
                                />
                            </div>
                        );
                    })}
                    <div className="clearfix" />
                </div>
            </div>
            {replyMessageId && (
                <ReplyMessage
                    message={messages.find(m => String(m.id) === String(replyMessageId))}
                    onCloseReply={closeReplyMessage}
                />
            )}
        </>
    );
}
