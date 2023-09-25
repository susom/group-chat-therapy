import React, {useContext, useState} from "react";
import {Link, Navigate, useNavigate, useLocation} from "react-router-dom";


import {NavHeader} from "../../components/NavHeader/navheader.jsx";
import SurveyList from '../../components/SurveyList/surveylist.jsx';

import {SessionContext} from "../../contexts/Session.jsx";
import './completed.css';

export default function Completed() {
    const session_context   = useContext(SessionContext);
    const navigate = useNavigate()

    let jsmoModule;
    if (import.meta?.env?.MODE !== 'development')
        jsmoModule = ExternalModules.Stanford.GroupChatTherapy


    return (
        <>
            <NavHeader/>
            <div>
                Thank you for completing the chat session!
            </div>
            <SurveyList
                completed={true}
            />
        </>
    )
}
