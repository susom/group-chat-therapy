import React, {useContext, useState} from "react";
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
    const session_context   = useContext(SessionContext);
    const navigate = useNavigate()
    const [participantCompletion, setParticipantCompletion] = useState([])
    const [error, setError] = useState('')

    let jsmoModule;
    if (import.meta?.env?.MODE !== 'development')
        jsmoModule = ExternalModules.Stanford.GroupChatTherapy
    console.log(session_context)

    const renderList = () => {
        return (
            <ListGroup as="ol" className="my-2 survey-list">
                <ListGroup.Item
                    action
                    as="li"
                    className="my-2"
                >
                    <div>
                        <div className="fw-bold">
                            <Badge className="float-end" bg="danger" pill>
                                Not complete
                            </Badge>
                        </div>
                        Mental health questionnaire
                    </div>

                </ListGroup.Item>
                <ListGroup.Item
                    action
                    as="li"
                    disabled
                >
                    <div>
                        <div className="fw-bold">
                            <Badge className="float-end" bg="success" pill>
                                Complete
                            </Badge>
                        </div>
                        Physical health questionnaire
                    </div>
                </ListGroup.Item>

            </ListGroup>
        )
    }

    const enterChat = () => {
        navigate("/chat")
    }

    const pollUser = () => {
        const sel = session_context?.sessionCache?.selected_session
        jsmoModule.checkUserCompletion(
            {
                'participant_ids': sel?.ts_authorized_participants,
                'therapy_session_id': sel?.record_id
            },
            (res) => setParticipantCompletion(res),
            (err) => setError(err)
        )
    }

    const renderAdmin = () => {
        const sel = session_context?.sessionCache?.selected_session
        console.log(error)
        return (
            <Container className='session-detail mt-3'>
                <Card>
                    <Card.Header><strong>{sel?.ts_title}</strong> - #{sel?.record_id}
                        <Button
                            variant="outline-secondary"
                            className="float-end"
                            size="sm"
                            onClick={pollUser}
                        >
                            <FontAwesomeIcon icon={faArrowsRotate} />
                        </Button>
                    </Card.Header>
                    <Card.Body>
                        {error.length ? <Alert className='landing-error' variant="danger"><Alert.Heading as="h6">Error:</Alert.Heading>{error}</Alert> : ''}
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

    const renderParticipant = () => {
        return (
            <Container fluid className='session-detail mt-3'>
                <Card>
                <Card.Header>Surveys</Card.Header>
                <Card.Body className="d-flex flex-column">
                    {/*{renderList()}*/}
                    <SurveyList />
                    <Alert className="mt-auto" variant="info">
                        <div className="d-flex align-items-center">
                            <span>Waiting for Admin to enter chat    </span>
                            <Spinner className="info-spinner ms-auto" animation="border" variant="info"/>
                        </div>
                    </Alert>
                </Card.Body>
                <Card.Footer>
                    <Button className="float-end" onClick={enterChat}>Enter Chat</Button>
                </Card.Footer>
                </Card>
            </Container>
        )
    }


    // if (!session_context?.data?.participantID) {
    //     return <Navigate to="/"/>
    // } else {
        const isAdmin = session_context?.sessionCache?.current_user?.admin

        return (
            <>
               <NavHeader/>
                {isAdmin === "1" ? renderAdmin() : renderParticipant()}
            </>
        )
    // }
}
