import React, {useContext} from "react";
import {SessionContext} from "./../contexts/Session.jsx";

export default function MessagesDisplay({messages}) {
    const session_context   = useContext(SessionContext);
    const your_assessments  = session_context.assessments.find(a => a.participant_id === session_context.participantID);
    return (
        <ul>
            {your_assessments?.required.map((item, index) => (
                <li key={index}>
                    <a href={item.link}>{item.assessment}</a>
                    {item.status ? ' (Complete)' : ' (Incomplete)'}
                </li>
            ))}
        </ul>
    );
}
