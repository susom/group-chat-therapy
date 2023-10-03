import React, {useContext, useState} from "react";
import {Link, Navigate, useNavigate, useLocation} from "react-router-dom";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";

import {NavHeader} from "../../components/NavHeader/navheader.jsx";
import SurveyList from '../../components/SurveyList/surveylist.jsx';

import {SessionContext} from "../../contexts/Session.jsx";
import './completed.css';
import Container from "react-bootstrap/Container";


export default function Completed() {
    const session_context   = useContext(SessionContext);
    const navigate = useNavigate()

    let jsmoModule;
    if (import.meta?.env?.MODE !== 'development')
        jsmoModule = ExternalModules.Stanford.GroupChatTherapy


    return (
        <>
            <NavHeader/>
            <Container fluid className='session-detail mt-3'>
                <Card>
                    <Card.Header>Post Chat  Surveys</Card.Header>

                    <Card.Body className="d-flex flex-column">
                        {/*<Card.Title as="h6">Thank you for completing the chat session!</Card.Title>*/}
                        <Alert variant="success">
                            Thank you for completing the chat session!
                        </Alert>
                        <SurveyList
                            completed={true}
                        />
                    </Card.Body>
                </Card>
            </Container>
        </>
    )
}
