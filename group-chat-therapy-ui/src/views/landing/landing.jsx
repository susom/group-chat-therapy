import React, {useContext, useEffect, useRef, useState} from "react";
import {Link, Navigate, useNavigate, useLocation} from "react-router-dom";
import Container from 'react-bootstrap/Container';
import Alert from 'react-bootstrap/Alert';
import ListGroup from "react-bootstrap/ListGroup";
import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";

import {NavHeader} from "../../components/NavHeader/navheader.jsx";
import {WaitingRoom} from "../../components/WaitingRoom/waitingRoom.jsx";
import SurveyList from '../../components/SurveyList/surveylist.jsx';

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowsRotate} from "@fortawesome/free-solid-svg-icons";

import {SessionContext} from "../../contexts/Session.jsx";
import './landing.css';

export default function Landing() {
    const session_context = useContext(SessionContext);
    const navigate = useNavigate()
    const [participantCompletion, setParticipantCompletion] = useState([])
    const [error, setError] = useState('')
    const [showError, setShowError] = useState(false)
    const [surveysComplete, setSurveysComplete] = useState(false)
    const [userAdmitted, setUserAdmitted] = useState(false)
    const timerIdRef = useRef(null);
    const [isPollingEnabled, setIsPollingEnabled] = useState(true);
    const isAdmin = session_context?.sessionCache?.current_user?.admin === "1"

    let jsmoModule;
    if (import.meta?.env?.MODE !== 'development')
        jsmoModule = ExternalModules.Stanford.GroupChatTherapy

    const enterChat = () => {
        navigate("/chat")
    }

    useEffect(() => {
        if(isPollingEnabled){
            isAdmin ?  startPolling(checkSurveyStatus) : startPolling(checkEntry)
        } else {
            stopPolling()
        }

        return () => { //Cancel on unmount
            stopPolling()
        }
    }, [isPollingEnabled]);

    const startPolling = (fx) => {
        timerIdRef.current = setInterval(fx, 5000);
    };

    const stopPolling = () => {
        clearInterval(timerIdRef.current);
    };

    /**
     * Admin: poll to refresh all user survey statuses
     */
    const checkSurveyStatus = () => {
        const sel = session_context?.sessionCache?.selected_session
        if(sel?.ts_authorized_participants.length){
            jsmoModule.checkUserCompletion(
                {
                    'participant_ids': sel?.ts_authorized_participants,
                    'therapy_session_id': sel?.record_id
                },
                (res) => setParticipantCompletion(res),
                (err) => {
                    setError(err)
                    setShowError(true)
                }
            )
        }
    }

    /**
     * User: poll to check whether an Admin has let individual into chat room
     */
    const checkEntry = () => {
        let clone = session_context.sessionCache
        jsmoModule.getUserSessions(
            session_context?.sessionCache?.current_user,
            (res) => {
                if (res) {
                    let selectedSession = res.filter(e=>e?.record_id === session_context?.sessionCache?.selected_session?.record_id)
                    if(selectedSession)
                        clone['selected_session'] = selectedSession[0]
                    session_context?.setSessionCache(clone)
                }
            },
            (err) => {
                setIsPollingEnabled(false)
                console.log(err)
            }
        )
    }

    const renderError = () => {
        const click = () => setShowError(false)
        if (showError) {
            return (
                <Alert dismissible className='landing-error' variant="danger" onClose={click}>
                    <Alert.Heading as="h6">Error:</Alert.Heading>{error}
                </Alert>
            )
        }
    }

    const renderAdmin = () => {
        const sel = session_context?.sessionCache?.selected_session
        return (
            <Container className='session-detail mt-3'>
                <Card>
                    <Card.Header><strong>{sel?.ts_title}</strong> - #{sel?.record_id}
                        <Button
                            variant="outline-secondary"
                            className="float-end"
                            size="sm"
                            onClick={checkSurveyStatus}
                        >
                            <FontAwesomeIcon icon={faArrowsRotate}/>
                        </Button>
                    </Card.Header>
                    <Card.Body>
                        {renderError()}
                        <WaitingRoom
                            participantCompletion={participantCompletion}
                        />
                    </Card.Body>
                    <Card.Footer>
                        <Button className="float-end" onClick={enterChat}>Enter Chat</Button>
                    </Card.Footer>
                </Card>
            </Container>
        )
    }

    const renderAlert = () => {
        return (
            <Alert className="mt-auto" variant="info">
                <div className="d-flex align-items-center">
                    <span>Waiting for Admin to enter chat    </span>
                    <Spinner className="info-spinner ms-auto" animation="border" variant="info"/>
                </div>
            </Alert>
        )
    }

    const renderParticipant = () => {
        const cache = session_context?.sessionCache
        let userId = cache?.current_user?.record_id
        let admitted = cache.selected_session?.ts_chat_room_participants?.includes(userId)
        return (
            <Container fluid className='session-detail mt-3'>
                <Card>
                    <Card.Header>Surveys</Card.Header>
                    <Card.Body className="d-flex flex-column">
                        <SurveyList
                            setSurveysComplete={setSurveysComplete}
                        />
                        {
                            !surveysComplete || !admitted ? renderAlert() : ''
                        }

                    </Card.Body>
                    <Card.Footer>
                        <Button
                            className="float-end"
                            onClick={enterChat}
                            disabled={!surveysComplete || !admitted}
                        >Enter Chat</Button>
                    </Card.Footer>
                </Card>
            </Container>
        )
    }


    // if (!session_context?.data?.participantID) {
    //     return <Navigate to="/"/>
    // } else {

    return (
        <>
            <NavHeader/>
            {isAdmin ? renderAdmin() : renderParticipant()}
        </>
    )
    // }
}
