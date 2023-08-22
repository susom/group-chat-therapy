import React, {useContext, useEffect} from "react";
import {Link, Navigate, useNavigate, useLocation} from "react-router-dom";
import Container from 'react-bootstrap/Container';
import Alert from 'react-bootstrap/Alert';
import ListGroup from "react-bootstrap/ListGroup";
import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Navbar from "react-bootstrap/Navbar";
import Spinner from "react-bootstrap/Spinner";

import {NavHeader} from "../../components/NavHeader/navheader.jsx";
import {WaitingRoom} from "../../components/WaitingRoom/waitingRoom.jsx";
import {SessionContext} from "../../contexts/Session.jsx";
import './landing.css';

export default function Landing() {
    const session_context = useContext(SessionContext);
    const navigate = useNavigate()

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

    const renderAdmin = () => {
        const sel = session_context?.data?.selected_session

        return (
            <Container className='session-detail mt-3'>
                <Card>
                    <Card.Header><strong>{sel?.ts_title}</strong> - #{sel?.record_id}</Card.Header>
                    <Card.Body>
                        <WaitingRoom
                            session = {sel}
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
        const isAdmin = !session_context?.data?.current_user?.admin

        return (
            <>
               <NavHeader/>
                {isAdmin ? renderAdmin() : renderParticipant()}
            </>
        )
    // }
}
