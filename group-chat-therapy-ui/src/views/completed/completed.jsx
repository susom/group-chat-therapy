import React, {useContext, useState} from "react";
import {Link, Navigate, useNavigate, useLocation} from "react-router-dom";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
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

    const admin = session_context?.sessionCache?.current_user?.admin === '1'

    const navigateSelect = () => {
        navigate("/select")
    }

    if (!session_context?.sessionCache?.current_user?.record_id) {
        return <Navigate to="/"/>
    }

    return (
        <>
            <NavHeader/>
            <Container fluid className='session-detail mt-3'>
                <Card>
                    <Card.Header>Post Chat  Surveys</Card.Header>

                    <Card.Body className="d-flex flex-column">
                        {/*<Card.Title as="h6">Thank you for completing the chat session!</Card.Title>*/}
                        <Alert variant="success">
                            Thank you for completing the chat session! <br/>
                            Please complete any assigned surveys and turn your video on to notify the admin when finished.
                        </Alert>
                        {!admin &&
                            <SurveyList
                                completed={true}
                            />
                        }
                        <Button variant="primary" onClick={navigateSelect}>Home</Button>
                    </Card.Body>
                </Card>
            </Container>
        </>
    )
}
