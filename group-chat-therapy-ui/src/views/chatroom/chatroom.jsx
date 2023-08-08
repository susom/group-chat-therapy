import React, {useState, useContext, useEffect} from "react";
import {Link} from "react-router-dom";

import { Container, Row, Col, Tab, Nav, Form, Button, Card } from 'react-bootstrap';
import { PeopleFill, Send, People, Person } from 'react-bootstrap-icons';
import {SessionContext} from "../../contexts/Session.jsx";
import {getAllSessions, deleteSession, deleteAllData} from "../../components/database/dexie.js";

import MessagesDisplay from "../../components/MessagesDisplay.jsx";
import GlobalHeader from "../../components/global_header.jsx";
import GlobalFooter from "../../components/global_footer.jsx";

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
    const date_string                       = chat_details?.date ? chat_details?.date : "";
    const [dateComps, setDateComps]         = useState(dateComponents(date_string));
    const [whiteboardContent, setWhiteboardContent]     = useState(whiteboard);
    const [whiteboardIsChanged, setWhiteboardIsChanged] = useState(false);

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

    useEffect(() => {
        setDateComps(dateComponents(date_string));
    }, [date_string]);

    const handleInputChange = e => {
        if (startMessageTime === null) {
            setStartMessageTime(Date.now());
        }

        const value = e.target.value;
        setMessage(value);

        session_context.resetMentions(selectedChat);
    };

    const handleWhiteboardChange = (e) => {
        setWhiteboardIsChanged(true);
        setWhiteboardContent(e.target.value);
    };

    const updateWhiteboard = () => {
        session_context.callAjax({whiteBoardContent : whiteboardContent},"setWhiteBoardContent");
        setWhiteboardContent(whiteboardContent);
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
            const { body: sanitizedBody } = session_context.isMentioned({ body: message }, session_context.participantsLookUp, participant_id, true);
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

    function dateComponents(dateStr) {
        const dateObj = new Date(dateStr);

        const month = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        const day   = String(dateObj.getDate()).padStart(2, '0');
        const year  = dateObj.getFullYear();

        return { month, day, year };
    }

    return (
        <div id={`main`}>
            <GlobalHeader/>


            <Container className={"chat_room"}>

                    {chat_details ? ( <Row className={"chat_details"}>
                                        <Col xs={3} className={`chat_date order-last order-md-first`}>
                                            <div className="su-date-stacked ">
                                                <span className="su-date-stacked__month">{dateComps.month}</span>
                                                <span className="su-date-stacked__day">{dateComps.day}</span>
                                                <span className="su-date-stacked__year">{dateComps.year}</span>
                                            </div>
                                        </Col>
                                        <Col xs={9}>
                                            <ul>
                                                <li>
                                                    <h2>{chat_details.title}</h2>
                                                    <p>{chat_details.description}</p>
                                                </li>
                                                <li><b>Session Schedule : </b>  {chat_details.time_start} - {chat_details.time_end}</li>
                                                <li><b>Therapist : </b> {participant_lookup[chat_details.therapist]}</li>
                                            </ul>
                                        </Col>
                                    </Row>
                        ) : (
                            <p>Loading...</p>
                        )}

                <Row className={"chat_ui"}>
                    <Col>
                        <Container fluid>
                            <Row>
                                <Col md={{ span: 11, offset: 1 }} xs={12} className={"whiteboard"}>
                                    <Card>
                                        <Card.Body>
                                            <Card.Title>Whiteboard</Card.Title>
                                            {
                                                chat_details && (
                                                    participant_id === chat_details.therapist ? (
                                                        <Form className={`whiteboard_form`} onSubmit={(e) => { e.preventDefault(); updateWhiteboard(); }}>
                                                            <Form.Control
                                                                as="textarea"
                                                                value={whiteboardContent}
                                                                onChange={handleWhiteboardChange}
                                                                placeholder="Edit the whiteboard content..."
                                                            />
                                                            <Button type="submit" className="mt-2 whiteboard_btn" disabled={!whiteboardIsChanged}>Update Whiteboard</Button>
                                                        </Form>
                                                    ) : (
                                                        <Card.Text>{whiteboard}</Card.Text>
                                                    )
                                                )
                                            }
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                            <Row>
                                <Tab.Container
                                    activeKey={selectedChat}
                                    onSelect={(k) => {
                                        setSelectedChat(k);  // Update the selected chat when a tab is selected
                                    }}
                                    defaultActiveKey="groupChat"
                                    className={`order-last order-md-first`}
                                >
                                    <Col md={1} xs={12}>
                                        <Nav variant="pills" className="flex-md-column flex-xs-row mt-2 chat_tab">
                                            <Nav.Item>
                                                <Nav.Link eventKey="groupChat" onClick={() => session_context.resetMentions(selectedChat)}>
                                                    <People  size={20} title={`Group Chat`}/>
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
                                                        <Nav.Link eventKey={chatKey} onClick={() => session_context.resetMentions(chatKey)}>
                                                            <Person  size={20}  title={`Private Chat with ${participantNames}`}/>
                                                            {mentionCounts[chatKey] > 0 && <span className="badge">{mentionCounts[chatKey]}</span>}
                                                        </Nav.Link>
                                                    </Nav.Item>
                                                );
                                            })}
                                        </Nav>
                                    </Col>

                                    <Col md={11} xs={12}>
                                        <Tab.Content>
                                            <h3 className={'chat_title'}>Chatting with : {
                                                selectedChat === "groupChat" ? "Group" : session_context.participantsLookUp[selectedChat] || selectedChat
                                            }</h3>
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
                                                        onFocus={() => session_context.resetMentions(selectedChat)}
                                                        className={`chat_input`}
                                                    />
                                                </Col>
                                                <Col xs="2">
                                                    <Button variant="primary" type="submit" className="w-100 send_message" onClick={() => session_context.resetMentions(selectedChat)}><Send size={20}  title={`Send Message`}/></Button>
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


            <GlobalFooter/>

        </div>
    );
}
