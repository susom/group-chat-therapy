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
    const {selected_session} = session_context?.data
    // console.log(session_context)
    const [online, setOnline] = useState([])
    const [chatroom, setChatroom] = useState([])
    const [participantDetails, setParticipantDetails] = useState([])
    const [selectedSession, setSelectedSession] = useState({})
    let jsmoModule;
    if(import.meta?.env?.MODE !== 'development')
        jsmoModule = ExternalModules.Stanford.GroupChatTherapy


    useEffect(() => {
        // console.log('inside waiting room', session)
        setSelectedSession(session_context?.data?.selected_session)

        if(session_context?.data?.selected_session?.record_id){
            jsmoModule.getParticipants(
                {'participants' : [
                    ...session_context?.data?.selected_session?.ts_authorized_participants,
                    ...session_context?.data?.selected_session?.ts_chat_room_participants
                    ]},
                (res) => {
                    if(res){
                        let filtered = res?.data?.filter(e => parseInt(e.admin) !== 1) //remove admins from waiting room list
                        setParticipantDetails(filtered)
                        console.log('participants', filtered)
                    }
                },
                (err) => {
                    console.log(err)
                }
            )
        }

    }, [session_context, selectedSession])

    const admit = (e) => {
        let {value: participant_id} = e.target
        const {selected_session} = session_context?.data

        jsmoModule.updateParticipants(
            {'record_id': selected_session?.record_id, 'action': 'admit', 'participant_id': participant_id},
            (res) => {
                if(res) {
                    let copy = session_context?.data
                    copy['selected_session'] = res?.data
                    session_context.setData(copy)
                    setSelectedSession(copy['selected_session'])
                    // session_context?.setData()
                    // setSelectedSession(res?.data)
                }
            },
            (err) => {
                console.log('callback err', err)
            }
        )

    }

    const generateStacks = (type) => {
        if(type === 'waitingRoom') {
            return selected_session?.ts_authorized_participants?.map((e,i) => {
                let detail = participantDetails?.find(el => el.record_id === e)
                if(detail)
                    return (
                        <Stack key={i} direction="horizontal" gap={3}>
                            <div className="me-auto">{detail?.participant_first_name}</div>
                            <Button onClick={admit} value={detail?.record_id} variant="outline-success">Admit</Button>
                        </Stack>
                    )
            })
        } else {
            return selected_session?.ts_chat_room_participants?.map((e,i) => {
                let detail = participantDetails?.find(el => el.record_id === e)
                if(detail)
                    return (
                        <Stack key={i} direction="horizontal" gap={3}>
                            <div className="me-auto">{detail?.participant_first_name}</div>
                                <Button variant="outline-danger">Revoke</Button>
                        </Stack>
                    )
            })
        }
        // return arr?.map((e,i) => {
        //     return (
        //         <Stack key={i} direction="horizontal" gap={3}>
        //             <div className="me-auto">{e.participant_first_name}</div>
        //             {type === 'waitingRoom' ?
        //                 <Button onClick={admit} value={e?.record_id} variant="outline-success">Admit</Button> :
        //                 <Button variant="outline-danger">Revoke</Button>
        //             }
        //         </Stack>
        //     )
        // })
    }

    return (
        <Tab.Container defaultActiveKey="online">
            <Accordion className="mb-3 chat-room-detail">
                <Accordion.Item eventKey="0">
                    <Accordion.Header>Details</Accordion.Header>
                    <Accordion.Body>
                        <div>
                            <strong><div className="text-decoration-underline">Description</div></strong>
                            {selected_session?.ts_topic}
                        </div>
                        <div>
                            <strong><div className="text-decoration-underline">Start Date</div></strong>
                            {selected_session?.ts_start}
                        </div>
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>
            <Nav variant="tabs" className="mb-3 admin-container" justify>
                <Nav.Item>
                    <Nav.Link eventKey="online">
                        <div>Waiting Room <Badge pill bg="danger">{selected_session?.ts_authorized_participants?.length ? selected_session?.ts_authorized_participants?.length : 0}</Badge></div>
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="chatroom">Chat Room <Badge pill bg="success">{selected_session?.ts_chat_room_participants?.length ? selected_session?.ts_chat_room_participants?.length : 0}</Badge></Nav.Link>
                </Nav.Item>
            </Nav>
            <Tab.Content>
                <Tab.Pane eventKey="online">
                    <Stack gap={2}>
                        { participantDetails && selected_session && generateStacks('waitingRoom')}
                    </Stack>
                </Tab.Pane>
                <Tab.Pane eventKey="chatroom">
                    <Stack gap={2}>
                        { participantDetails && selected_session && generateStacks( 'chatRoom')}
                    </Stack>
                </Tab.Pane>
            </Tab.Content>
        </Tab.Container>
    )
}
