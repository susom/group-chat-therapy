import React, {useState, useContext, useEffect} from "react";
import {Link} from "react-router-dom";

import { Container, Row, Col, Tab, Nav, Form, Button, Card } from 'react-bootstrap';
import { PeopleFill, Person } from 'react-bootstrap-icons';
import {SessionContext} from "../../contexts/Session.jsx";
import {getAllSessions, deleteSession, deleteAllData} from "../../components/database/dexie.js";

import MessagesDisplay from "../../components/MessagesDisplay.jsx";
import YourAssessments from "../../components/YourAssessments.jsx";

import './chatroom.css';
import { debounce } from 'lodash';

export default function ChatRoom() {
    const session_context = useContext(SessionContext);

    // CHAT SESSION DETAILS
    const participant_id                    = session_context.participantID;
    const isAdmin                           = session_context.isAdmin;
    const participant_lookup                = session_context.participantsLookUp;
    const chat_details                      = session_context.chatSessionDetails;
    const whiteboard                        = chat_details?.whiteboard !== "" ? chat_details?.whiteboard : "Nothing here yet.";

    //CHAT VARS CACHE
    const sessionContextAllChats            = session_context.allChats;
    const [allChats, setAllChats]           = useState({ ...sessionContextAllChats });
    const [selectedChat, setSelectedChat]   = useState('groupChat');
    const sessionContextMentionCounts       = session_context.mentionCounts;
    const [mentionCounts, setMentionCounts] = useState({ ...sessionContextMentionCounts });

    //MESSAGE HANDLING
    const [message, setMessage]                     = useState('');
    const [startMessageTime, setStartMessageTime]   = useState(null);
    const [keystrokes, setKeystrokes]               = useState([]);
    const [currentWord, setCurrentWord]             = useState('');
    const [replyTo, setReplyTo] = useState(null);

    useEffect(() => {
        setMentionCounts({ ...sessionContextMentionCounts });
    }, [sessionContextMentionCounts]);

    useEffect(() => {
        setAllChats({ ...sessionContextAllChats });
    }, [sessionContextAllChats]);

    const handleInputChange = e => {
        if (startMessageTime === null) {
            setStartMessageTime(Date.now());
        }

        const value = e.target.value;
        setMessage(value);
    };

    const handleKeyDown = (e) => {
        // This will add each new keystroke to the array
        setKeystrokes([...keystrokes, e.key]);
    };

    const handleSubmit = e => {
        e.preventDefault();

        if (message) {
            const endTime   = Date.now();
            const duration  = (endTime - startMessageTime) + "ms";
            const timestamp = new Date().toISOString();

            // Sanitize the user input
            const { body: sanitizedBody } = session_context.isMentioned({ body: message }, session_context.participantsLookUp, true);
            console.log("Sanitized message: ", sanitizedBody); // Log the sanitized message
            // Prepare your payload here
            const newAction = {
                id : 12345,
                isFake : true,

                client_ts : timestamp,
                type : "message",
                body : sanitizedBody,  // Use the sanitized message
                user : participant_id,
                recipients : selectedChat === 'groupChat' ? [] : [selectedChat],
                time_to_complete : duration,
                character_history : keystrokes,
                target: replyTo || null
            };

            // Add the message to the local chat history
            setAllChats(prevChats => {
                const currentChat = prevChats[selectedChat] ? [...prevChats[selectedChat]] : [];
                return {
                    ...prevChats,
                    [selectedChat]: [...currentChat, newAction]
                };
            });

            //ADD ACTION TO QUEUE TO BE PICKED UP AT NEXT POLL
            session_context.sendAction(newAction);

            // Reset states
            setMessage('');
            setStartMessageTime(null);
            setCurrentWord('');
            setKeystrokes([]);
            setReplyTo(null);
        }
    };


    return (
        <Container className={"chat_room"}>
            <Row className={"chat_details"}>
                <Col>
                    {chat_details ? (
                        <>
                            <h1>{chat_details.title}</h1>
                            <p>{chat_details.description}</p>
                            <ul>
                                <li>Session Schedule : {chat_details.date} {chat_details.time_start} - {chat_details.time_end}</li>
                                <li>Therapist : {participant_lookup[chat_details.therapist]}</li>
                            </ul>
                        </>
                    ) : (
                        <p>Loading...</p>
                    )}
                </Col>
            </Row>

            <Row className={"chat_ui"}>
                <Col>
                    <Container fluid>
                        <Row>
                            <Tab.Container
                                activeKey={selectedChat}
                                onSelect={(k) => {
                                    setSelectedChat(k);  // Update the selected chat when a tab is selected
                                }}
                                defaultActiveKey="groupChat">
                                <Col md={1} xs={12}>
                                    <Nav variant="pills" className="flex-column mt-2">
                                        <Nav.Item>
                                            <Nav.Link eventKey="groupChat">
                                                <PeopleFill color="white" size={20} />
                                                {mentionCounts["groupChat"] > 0 && <span className="badge">{mentionCounts["groupChat"]}</span>}
                                            </Nav.Link>
                                        </Nav.Item>
                                        {Object.keys(allChats).map((chatKey, index) => {
                                            // Skip the group chat, as it's already been handled
                                            if (chatKey === 'groupChat') return null;

                                            const participantIDs    = chatKey.split('|');
                                            const participantNames  = participantIDs.map(id => participant_lookup[id]).join(', ');
                                            return (
                                                <Nav.Item key={index}>
                                                    <Nav.Link eventKey={chatKey}>
                                                        <Person color="gray" size={20} />
                                                        {mentionCounts[chatKey] > 0 && <span className="badge">{mentionCounts[chatKey]}</span>}
                                                    </Nav.Link>
                                                </Nav.Item>
                                            );
                                        })}
                                    </Nav>
                                </Col>
                                <Col md={11} xs={12}>
                                    <Row className={"whiteboard"}>
                                        <Col>
                                            <Card>
                                                <Card.Body>
                                                    <Card.Title>Whiteboard</Card.Title>
                                                    <Card.Text>{whiteboard}</Card.Text>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                    <Tab.Content>
                                        <Tab.Pane eventKey="groupChat">
                                            <MessagesDisplay messages={allChats['groupChat']} replyTo={replyTo} setReplyTo={setReplyTo} />
                                        </Tab.Pane>
                                        {Object.keys(allChats).map(chatKey => {
                                            // Skip the group chat, as it's already been handled
                                            if (chatKey === 'groupChat') return null;

                                            return (
                                                <Tab.Pane eventKey={chatKey} key={chatKey}>
                                                    <MessagesDisplay messages={allChats[chatKey]} replyTo={replyTo} setReplyTo={setReplyTo} />
                                                </Tab.Pane>
                                            );
                                        })}
                                    </Tab.Content>
                                    <Form onSubmit={handleSubmit}>
                                        <Row className="align-items-center">
                                            <Col xs="10">
                                                <Form.Control
                                                    as="input"
                                                    value={message}
                                                    onKeyDown={handleKeyDown}
                                                    onChange={handleInputChange}
                                                />
                                            </Col>
                                            <Col xs="2">
                                                <Button variant="primary" type="submit" className="w-100">Send</Button>
                                            </Col>
                                        </Row>
                                    </Form>
                                </Col>
                            </Tab.Container>
                        </Row>
                    </Container>
                </Col>
            </Row>
        </Container>
    );
}
