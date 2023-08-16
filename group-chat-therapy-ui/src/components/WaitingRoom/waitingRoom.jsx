import React, {useContext, useEffect, useState} from "react";
import Nav from "react-bootstrap/Nav";
import Tab from "react-bootstrap/Tab";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import Accordion from "react-bootstrap/Accordion";

import './waitingRoom.css';

import {SessionContext} from "../../contexts/Session.jsx";

export const WaitingRoom = ({session}) => {
    const session_context = useContext(SessionContext);
    const [online, setOnline] = useState([])
    const [chatroom, setChatroom] = useState([])

    let jsmoModule;
    if(import.meta?.env?.MODE !== 'development')
        jsmoModule = ExternalModules.Stanford.GroupChatTherapy

    const jsmoSuccessCallback = (res) => {
        if(res){
            let filtered = res?.data.filter(e => parseInt(e.admin) !== 1)
            setOnline(filtered)
            console.log('participants', filtered)
        }

    }

    const jsmoErrorCallback = (err) => {
        console.log(err)
    }

    useEffect(() => {
        console.log('inside waiting room', session)
        if(session?.record_id){
            jsmoModule.getParticipants(
                {'participants' : session?.ts_authorized_participants},
                (res) => {
                    if(res){
                        let filtered = res?.data.filter(e => parseInt(e.admin) !== 1)
                        setOnline(filtered)
                        console.log('participants', filtered)
                    }
                },
                (err) => {
                    console.log(err)
                }
            )
        }

    }, [session])

    const admit = (e) => {
        let {value: participant_id} = e.target
        console.log('in admit')
        console.log(participant_id)
        let copy = session;

        // let index = copy?.full?.chat_session_details?.participants.findIndex(e=> e.participant_id === participant_id)
        // if(index){
        //     copy.full.chat_session_details.participants[index]['status'] = 'chat'
        // }

        jsmoModule.updateParticipants(
            {'record_id': session?.record_id, 'action': 'admit', 'participant_id': participant_id},
            jsmoSuccessCallback,
            jsmoErrorCallback
        )
        // session_context.setData(copy)
        // console.log(index)
        // session_context.setData()
    }

    const generateStacks = (arr, type) => {
        return arr.map((e,i) => {
            return (
                <Stack key={i} direction="horizontal" gap={3}>
                    <div className="me-auto">{e.participant_first_name}</div>
                    {type === 'waitingRoom' ?
                        <Button onClick={admit} value={e?.record_id} variant="outline-success">Admit</Button> :
                        <Button variant="outline-danger">Revoke</Button>
                    }
                </Stack>
            )
        })
    }

    return (
        <Tab.Container defaultActiveKey="online">
            <Accordion className="mb-3 chat-room-detail">
                <Accordion.Item eventKey="0">
                    <Accordion.Header>Details</Accordion.Header>
                    <Accordion.Body>
                        <div>
                            <strong><div className="text-decoration-underline">Description</div></strong>
                            {session?.ts_topic}
                        </div>
                        <div>
                            <strong><div className="text-decoration-underline">Start Date</div></strong>
                            {session?.ts_start}
                        </div>
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>
            <Nav variant="tabs" className="mb-3 admin-container" justify>
                <Nav.Item>
                    <Nav.Link eventKey="online">
                        <div>Waiting Room <Badge pill bg="danger">{online?.length ? online.length : 0}</Badge></div>
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="chatroom">Chat Room <Badge pill bg="success">{chatroom?.length ? chatroom.length : 0}</Badge></Nav.Link>
                </Nav.Item>
            </Nav>
            <Tab.Content>
                <Tab.Pane eventKey="online">
                    <Stack gap={2}>
                        { online && generateStacks(online, 'waitingRoom')}
                    </Stack>
                </Tab.Pane>
                <Tab.Pane eventKey="chatroom">
                    <Stack gap={2}>
                        { chatroom && generateStacks(chatroom, 'chatRoom')}
                    </Stack>
                </Tab.Pane>
            </Tab.Content>
        </Tab.Container>
    )
}
