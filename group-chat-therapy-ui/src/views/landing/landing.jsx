import React from "react";
import {Link} from "react-router-dom";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import ListGroup from "react-bootstrap/ListGroup";
import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Stack from 'react-bootstrap/Stack';

import './landing.css';

export default function Landing() {

    const renderList = () => {
        return (
            <Card text="dark" bg="light">
                <Card.Body>
                    <Card.Title>Surveys</Card.Title>
                    <ListGroup as="ol"  className="my-2">
                        <ListGroup.Item
                            action
                            as="li"
                            className="d-flex justify-content-between align-items-start"
                        >
                            <div className="ms-2 me-auto">
                                <div className="fw-bold">Survey 1</div>
                                Mental health questionnaire
                            </div>
                            <Badge bg="danger" pill>
                                Not complete
                            </Badge>
                        </ListGroup.Item>
                        <ListGroup.Item
                            action
                            as="li"
                            className="d-flex justify-content-between align-items-start"
                            disabled
                        >
                            <div className="ms-2 me-auto">
                                <div className="fw-bold">Survey 2</div>
                                Physical health questionnaire
                            </div>
                            <Badge bg="success" pill>
                                Complete
                            </Badge>
                        </ListGroup.Item>
                    </ListGroup>
                </Card.Body>
            </Card>
        )
    }

    const renderChatRooms = () => {
        return (
            <Card className="mt-3">
                <Card.Body>
                    <Card.Title>Chat Rooms</Card.Title>
                    <ListGroup as="ol"  className="my-2">
                        <ListGroup.Item
                            action
                            as="li"
                            className="d-flex justify-content-between align-items-start"
                        >
                            <div className="ms-2 me-auto">
                                <div className="fw-bold">Chat 08/08/23</div>
                                Led by: Jordan Schultz
                            </div>
                            <Button>Enter chat</Button>
                        </ListGroup.Item>
                        <ListGroup.Item
                            action
                            as="li"
                            className="d-flex justify-content-between align-items-start"
                            disabled
                        >
                            <div className="ms-2 me-auto">
                                <div className="fw-bold">Chat 09/21/23</div>
                                Led by: Andrew Martin
                            </div>
                            <Button>Enter chat</Button>
                        </ListGroup.Item>
                    </ListGroup>
                </Card.Body>
            </Card>
        )
    }

    return (
        <>
            <Container fluid>
                <Row>
                    <Col className="align-items-center">
                        <h1>Landing</h1>
                        {renderList()}
                        {renderChatRooms()}
                        <Link to={"/"}>Back to login page</Link>
                    </Col>
                </Row>
            </Container>


        </>
    );
}
