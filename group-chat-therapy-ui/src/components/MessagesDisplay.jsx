import React, { useEffect, useRef } from "react";
import Message from "./Message.jsx";

export default function MessagesDisplay({messages}) {
    const messagesEndRef    = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(scrollToBottom, [messages]);

    return (
        <div className={'chat_window'}>
            <div className={`chat_window_inner`}>
                {messages.map((message, index) => (
                    <Message key={index} message={message} />
                ))}

                <div className="clearfix"  ref={messagesEndRef} />
            </div>
        </div>
    );
}
