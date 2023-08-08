import React, {useContext, useEffect, useState} from "react";
import Nav from "react-bootstrap/Nav";
import Tab from "react-bootstrap/Tab";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import Accordion from "react-bootstrap/Accordion";

import './waitingRoom.css';

import {SessionContext} from "../../contexts/Session.jsx";

export const WaitingRoom = () => {
    const session_context = useContext(SessionContext);
    const [online, setOnline] = useState([])
    const [chatroom, setChatroom] = useState([])

    useEffect(() => {
        // console.log(session_context)
        // console.log(session_context?.chatSessionDetails)

        if(session_context?.chatSessionDetails?.participants){
            let chat = []
            let online = []

            for(let participant of session_context?.chatSessionDetails?.participants) {
                if (participant.status === 'online')
                    online.push(participant)
                else
                    chat.push(participant)
            }
            // console.log(online)
            setOnline(online)
            setChatroom(chat)
        }

        // setOnline([{name: "Andy Martin"}, {name: "Jordan Schultz"}])
        // setChatroom([{name: "Ihab Zeedia"}, {name: "Becky Chiu"}])
    }, [session_context])

    const admit = (e) => {
        // console.log(e.target.value)
        // console.log(e)
        let value = e.target.value
        console.log(value)
        console.log(session_context)
        let copy = session_context;
        let index = copy?.full?.chat_session_details?.participants.findIndex(e=> e.participant_id === value)
        if(index){
            copy.full.chat_session_details.participants[index]['status'] = 'chat'
        }

        session_context.setData(copy)
        console.log(index)
        console.log(session_context)
        // session_context.setData()
    }

    const generateStacks = (arr, type) => {
        return arr.map((e,i) =>
            <Stack key={i} direction="horizontal" gap={3}>
                <div className="me-auto">{e.display_name}</div>
                {type === 'waitingRoom' ?
                    <Button onClick={admit} value={e?.participant_id} variant="outline-success">Admit</Button> :
                    <Button variant="outline-danger">Revoke</Button>
                }
            </Stack>
        )
    }

    return (
        <Tab.Container defaultActiveKey="online">
            <Accordion className="mb-3 chat-room-detail">
                <Accordion.Item eventKey="0">
                    <Accordion.Header>Details</Accordion.Header>
                    <Accordion.Body>
                        <div>
                            <strong><div className="text-decoration-underline">Description</div></strong>
                            {session_context?.chatSessionDetails?.description}
                        </div>
                        <div>
                            <strong><div className="text-decoration-underline">Date</div></strong>
                            {session_context?.chatSessionDetails?.date}
                        </div>

                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>
            <Nav variant="tabs" className="mb-3 admin-container" justify>
                <Nav.Item>
                    <Nav.Link eventKey="online">
                        <div>Waiting Room <Badge pill bg="danger">{online.length}</Badge></div>
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="chatroom">Chat Room <Badge pill bg="success">{chatroom.length}</Badge></Nav.Link>
                </Nav.Item>
            </Nav>
            <Tab.Content>
                <Tab.Pane eventKey="online">
                    <Stack gap={2}>
                        {generateStacks(online, 'waitingRoom')}
                    </Stack>
                </Tab.Pane>
                <Tab.Pane eventKey="chatroom">
                    <Stack gap={2}>
                        {generateStacks(chatroom, 'chatRoom')}
                    </Stack>
                </Tab.Pane>
            </Tab.Content>
        </Tab.Container>
    )
}
