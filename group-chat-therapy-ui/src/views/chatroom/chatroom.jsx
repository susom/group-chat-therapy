import React, {useState, useMemo, useContext, useEffect} from "react";
import {Link} from "react-router-dom";

import { Container, Row, Col, Tab, Nav, Form, Button, Card } from 'react-bootstrap';
import { PeopleFill, Send, People, Person } from 'react-bootstrap-icons';
import {SessionContext} from "../../contexts/Session.jsx";
import { ChatContextProvider, ChatContext } from "../../contexts/Chat.jsx";

import {getAllSessions, deleteSession, deleteAllData} from "../../components/database/dexie.js";

import MessagesDisplay from "../../components/MessagesDisplay.jsx";
import GlobalHeader from "../../components/global_header.jsx";
import GlobalFooter from "../../components/global_footer.jsx";

import './chatroom.css';
// import '../../assets/css/decanter.css';
import { debounce } from 'lodash';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faFloppyDisk} from "@fortawesome/free-solid-svg-icons";

export default function ChatRoom() {
    return (
        <ChatContextProvider>
            <ChatRoomContent />
        </ChatContextProvider>
    );
}

function ChatRoomContent() {
    const session_context                               = useContext(SessionContext);
    const chat_context                                  = useContext(ChatContext);

    // CHAT SESSION DETAILS
    const participant_details                           = session_context?.data?.current_user || {};
    const participant_id                                = participant_details?.record_id;
    const isAdmin                                       = participant_details?.admin === "1";

    const chat_details                                  = session_context?.sessionCache?.selected_session || {};
    const chat_session_id                               = chat_details?.record_id || null;
    const date_string                                   = chat_details?.ts_start ? chat_details?.ts_start : "";

    //CHAT VARS CACHE
    const chatContextAllChats                           = chat_context.allChats;
    const [allChats, setAllChats]                       = useState({ ...chatContextAllChats });
    const [selectedChat, setSelectedChat]               = useState('groupChat');
    const chatContextMentionCounts                      = chat_context.mentionCounts;
    // const [mentionCounts, setMentionCounts]             = useState({ ...chatContextMentionCounts });

    const [whiteboardContent, setWhiteboardContent]     = useState(chat_details?.ts_whiteboard !== "" ? chat_details?.ts_whiteboard : "Nothing here yet.");
    const [whiteboardIsChanged, setWhiteboardIsChanged] = useState(false);

    //MESSAGE HANDLING
    const [message, setMessage]                         = useState('');
    const [startMessageTime, setStartMessageTime]       = useState(null);
    const [keystrokes, setKeystrokes]                   = useState([]);
    const [currentWord, setCurrentWord]                 = useState('');
    const [replyTo, setReplyTo]                         = useState(null);


    const [isMobile, setMobile] = useState(window.innerWidth < 640);

    const updateMedia = () => {
        setMobile(window.innerWidth < 640);
    };

    useEffect(() => {
        const selectedSession = session_context?.sessionCache?.selected_session
        if (selectedSession?.record_id) {
            const payload = {
                'participants': [
                    ...selectedSession.ts_authorized_participants,
                    ...selectedSession.ts_chat_room_participants,
                    selectedSession.ts_therapist
                ]
            };
            chat_context.callAjax(payload, "getParticipants");
        }
    }, [session_context.sessionCache]);


    const mentionCounts = useMemo(() => {
        return { ...chatContextMentionCounts };
    }, [chatContextMentionCounts]);

    // useEffect(() => {
    //     setMentionCounts({ ...chatContextMentionCounts });
    // }, [chatContextMentionCounts]);

    useEffect(() => {
        window.addEventListener("resize", updateMedia);
        return () => window.removeEventListener("resize", updateMedia);
    });

    const dateComps = useMemo(() => {
        return dateComponents(date_string);
    }, [date_string]);

    useEffect(() => {
        setWhiteboardContent(session_context?.sessionCache?.selected_session.ts_whiteboard);
    }, [session_context?.sessionCache?.selected_session.ts_whiteboard]);

    useEffect(() => {
        setAllChats({ ...chatContextAllChats });
    }, [chatContextAllChats]);


    const handleInputChange = e => {
        if (startMessageTime === null) {
            setStartMessageTime(Date.now());
        }

        const value = e.target.value;
        setMessage(value);
        console.log("resetMentions for selectedChat", selectedChat)
        chat_context.resetMentions(selectedChat);
    };

    const handleWhiteboardChange = (e) => {
        setWhiteboardIsChanged(true);
        setWhiteboardContent(e.target.value);
    };

    const updateWhiteboard = () => {
        chat_context.callAjax({record_id : chat_session_id, ts_whiteboard : whiteboardContent}, "setWhiteboard");

        const timestamp = new Date().toISOString();
        const newAction = {
            type : "whiteboard",
            sessionID : chat_session_id,
            user : participant_id,
            body : whiteboardContent,  // Use the sanitized message
            client_ts : timestamp

        };

        //ADD ACTION TO QUEUE TO BE PICKED UP AT NEXT POLL
        chat_context.sendAction(newAction);

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
            const { body: sanitizedBody } = chat_context.isMentioned({ body: message }, session_context.participantsLookUp, participant_id, true);
            // Prepare your payload here
            const newAction = {
                id : 12345,
                isFake : true,

                type : "message",
                sessionID : chat_session_id,
                user : participant_id,
                body : sanitizedBody,  // Use the sanitized message
                target: replyTo || null,
                recipients : selectedChat === 'groupChat' ? [] : [selectedChat],
                client_ts : timestamp,
                time_to_complete : duration,
                character_history : keystrokes
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
            chat_context.sendAction(newAction);

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

    function formatTime(dateString) {
        const date = new Date(dateString);

        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');

        const amOrPm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12 || 12;  // Convert to 12-hour format and ensure 12:00 is shown as 12, not 0

        return `${hours}:${minutes} ${amOrPm}`;
    }
    console.log(isMobile)
    console.log(window.innerWidth)
    return (
        <div id={`main`}>
            <GlobalHeader/>

            <Container className={"chat_room"}>
                {chat_details ? ( <Row className={"chat_details"}>
                        <Col md={2} xs={5} className={`chat_date order-last order-md-first`}>
                            <div className="su-date-stacked ">
                                <span className="su-date-stacked__month">{dateComps.month}</span>
                                <span className="su-date-stacked__day">{dateComps.day}</span>
                                <span className="su-date-stacked__year">{dateComps.year}</span>
                            </div>
                        </Col>
                        <Col md={10} xs={7}>
                            <ul>
                                <li>
                                    <h2>{chat_details.ts_title}</h2>
                                    <p>{chat_details.ts_topic}</p>
                                </li>
                                <li><b>Session Schedule : </b>  {formatTime(chat_details.ts_start)} - {formatTime(chat_details.ts_start_2)}</li>
                                <li><b>Therapist : </b> {session_context.participantsLookUp[chat_details.ts_therapist]}</li>
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
                                                <Nav.Link eventKey="groupChat" onClick={() => chat_context.resetMentions("groupChat")}>
                                                    <People  size={20} title={`Group Chat`}/>
                                                    {mentionCounts["groupChat"] > 0 && <span className="chat-badge">{mentionCounts["groupChat"]}</span>}
                                                    <b>Group</b>
                                                </Nav.Link>
                                            </Nav.Item>
                                            {Object.keys(allChats).map((chatKey, index) => {
                                                // Skip the group chat, as it's already been handled
                                                if (chatKey === 'groupChat') return null;

                                                const participantIDs    = chatKey.split('|');
                                                const participantNames  = participantIDs.map(id => session_context.participantsLookUp[id]).join(', ');
                                                return (
                                                    <Nav.Item key={index}>
                                                        <Nav.Link eventKey={chatKey} onClick={() => chat_context.resetMentions(chatKey)}>
                                                            <Person  size={20}  title={`Private Chat with ${participantNames}`}/>
                                                            {mentionCounts[chatKey] > 0 && <span className="chat-badge">{mentionCounts[chatKey]}</span>}
                                                            <b>{participantNames}</b>
                                                        </Nav.Link>
                                                    </Nav.Item>
                                                );
                                            })}
                                        </Nav>
                                    </Col>

                                    <Col md={11} xs={12}>
                                        <Card className={`whiteboard`}>
                                            <Card.Header>Whiteboard
                                                {isMobile &&
                                                    <Button className="float-end" variant="success" type="submit" disabled={!whiteboardIsChanged}><FontAwesomeIcon icon={faFloppyDisk} /></Button>
                                                }

                                            </Card.Header>
                                            <Card.Body>
                                                {
                                                    chat_details && (
                                                        participant_id === chat_details.ts_therapist ? (
                                                            <Form className={`whiteboard_form`} onSubmit={(e) => { e.preventDefault(); updateWhiteboard(); }}>
                                                                <Form.Control
                                                                    as="textarea"
                                                                    value={whiteboardContent}
                                                                    onChange={handleWhiteboardChange}
                                                                    placeholder="Edit the whiteboard content..."
                                                                />
                                                                {!isMobile &&
                                                                    <Button type="submit" variant="success" className="mt-2 whiteboard_btn" disabled={!whiteboardIsChanged}>Update Whiteboard</Button>
                                                                }

                                                            </Form>
                                                        ) : (
                                                            <Card.Text>{whiteboardContent}</Card.Text>
                                                        )
                                                    )
                                                }
                                            </Card.Body>
                                        </Card>

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
                                                        onFocus={() => chat_context.resetMentions(selectedChat)}
                                                        className={`chat_input`}
                                                    />
                                                </Col>
                                                <Col xs="2">
                                                    <Button variant="primary" type="submit" className="w-100 send_message" onClick={() => chat_context.resetMentions(selectedChat)}><Send size={20}  title={`Send Message`}/></Button>
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

