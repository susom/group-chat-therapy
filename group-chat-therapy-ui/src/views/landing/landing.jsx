import React, {useContext, useEffect} from "react";
import {Link, Navigate, useNavigate, useLocation} from "react-router-dom";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Alert from 'react-bootstrap/Alert';
import ListGroup from "react-bootstrap/ListGroup";
import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Navbar from "react-bootstrap/Navbar";
import Spinner from "react-bootstrap/Spinner";

import {WaitingRoom} from "../../components/WaitingRoom/waitingRoom.jsx";
import {SessionContext} from "../../contexts/Session.jsx";
import './landing.css';

export default function Landing() {
    const session_context = useContext(SessionContext);
    const navigate = useNavigate()
    const {state: selectedSession} = useLocation(); //Grab

    useEffect(() => {

        // if (!session_context?.participantID) {
        //     console.log('Redirected, not logged in')
        //     navigate("/", {replace: true})
        // }
    }, [])

    const renderList = () => {
        return (
            <ListGroup as="ol" className="my-2 survey-list">
                <ListGroup.Item
                    action
                    as="li"
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
        // navigate("/chat")
    }

    const renderAdmin = () => {
        return (
            <Container className='session-detail mt-3'>
                <Card>
                    <Card.Header><strong>{selectedSession?.ts_title}</strong> - #{selectedSession?.record_id}</Card.Header>
                    <Card.Body>
                        <WaitingRoom
                            session = {selectedSession}
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
                    {renderList()}
                    <Alert className="mt-auto" variant="info">
                        <div className="d-flex align-items-center">
                            <span>Waiting for Admin to enter chat    </span>
                            <Spinner className="info-spinner ms-auto" animation="border" variant="info"/>
                        </div>

                    </Alert>
                </Card.Body>
                <Card.Footer>

                    <Button disabled className="float-end" onClick={enterChat}>Enter Chat</Button>
                </Card.Footer>
                </Card>
            </Container>
        )
    }


    // if (!session_context?.data?.participantID) {
    //     return <Navigate to="/"/>
    // } else {
        const isAdmin = true
        return (
            <>
                <Navbar bg="light" className="bg-body-tertiary main-nav">
                    <Container>
                        {/*<Navbar.Brand>{session_context?.isAdmin ? "Admin" : "Participant"}</Navbar.Brand>*/}
                        <Navbar.Brand>{isAdmin ? "Admin" : "Participant"}</Navbar.Brand>
                        <Navbar.Toggle />
                        <Navbar.Collapse className="justify-content-end">
                            <Navbar.Text>
                                Signed in as: {session_context?.participantID}
                            </Navbar.Text>
                        </Navbar.Collapse>
                    </Container>
                </Navbar>
                {/*{session_context?.isAdmin ? renderAdmin() : renderParticipant()}*/}
                {isAdmin ? renderAdmin() : renderParticipant()}
            </>
        )
    // }
}
