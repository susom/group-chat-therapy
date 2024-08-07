import React, {useContext, useEffect, useState} from "react";
import Nav from "react-bootstrap/Nav";
import Tab from "react-bootstrap/Tab";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import Accordion from "react-bootstrap/Accordion";
import Spinner from "react-bootstrap/Spinner";
import Alert from "react-bootstrap/Alert";

import './waitingRoom.css';

import {SessionContext} from "../../contexts/Session.jsx";

export const WaitingRoom = ({participantCompletion}) => {
    const session_context = useContext(SessionContext);
    const {selected_session} = session_context?.sessionCache
    const [participantDetails, setParticipantDetails] = useState([])
    const [selectedSession, setSelectedSession] = useState({})
    const [loading, setLoading] = useState(false)
    const [pageLoad, setPageLoad] = useState(true)
    let jsmoModule;
    if (import.meta?.env?.MODE !== 'development')
        jsmoModule = ExternalModules.Stanford.GroupChatTherapy

    useEffect(() => {
        setSelectedSession(session_context?.sessionCache?.selected_session)

        if (session_context?.sessionCache?.selected_session?.record_id) {
            jsmoModule.getParticipants(
                {'participants' : [
                    ...session_context?.sessionCache?.selected_session?.ts_authorized_participants,
                    ...session_context?.sessionCache?.selected_session?.ts_chat_room_participants
                    ]},

                (res) => {
                    if (res) {
                        let filtered = res?.data?.filter(e => parseInt(e.admin) !== 1) //remove admins from waiting room list
                        setParticipantDetails(filtered);

                        setPageLoad(false);
                    }
                },
                (err) => {
                    console.log(err)
                    setPageLoad(false)
                }
            )
        }

    }, [session_context, selectedSession])

    const sendAjax = (payload) => {
        jsmoModule.updateParticipants(
            payload,
            (res) => {
                if (res) {
                    let copy = session_context?.sessionCache
                    copy['selected_session'] = res?.data
                    session_context.setSessionCache(copy)
                    setSelectedSession(copy['selected_session'])
                    setLoading(false)
                }
            },
            (err) => {
                console.log('callback err', err)
                setLoading(false)
            }
        )
    }

    const handleParticipants = (e) => {
        const {value: participant_id} = e.target
        const type = e.target.getAttribute('data-type')
        const {selected_session} = session_context?.sessionCache
        setLoading(e.target.getAttribute('data-index')) //Set loading for singular button
        sendAjax({'record_id': selected_session?.record_id, 'action': type, 'participant_id': participant_id})
    }

    const generateStacks = (type) => {
        let arr = type === 'waitingRoom' ? selectedSession?.ts_authorized_participants : selectedSession?.ts_chat_room_participants
        if(pageLoad){ //render placeholders if page load
            return (
                <div className="d-flex justify-content-center mt-5">
                    <Spinner animation="border" variant="primary" />
                </div>
            )
        } else {
            if(!arr.length) {
                return (
                    <Alert variant="info">
                        No current users
                    </Alert>
                )
            }

            return arr?.map((e, i) => {
                let detail = participantDetails?.find(el => el.record_id === e)
                if (detail) {
                    let b;
                    if (detail?.record_id in participantCompletion){
                        if(participantCompletion[detail?.record_id] === true)
                            b = <Badge bg="success">Finished</Badge>
                        else
                            b = <Badge bg="danger">Incomplete</Badge>
                    } else {
                        b = <Spinner className="spinner-button" size="sm"/>
                    }

                    return (
                        <Stack key={i} direction="horizontal" gap={3}>
                            <div className="me-auto">{detail?.participant_display_name}</div>
                            {b}
                            {
                                type === 'waitingRoom' ?
                                    <Button data-type="admit" data-index={i} onClick={handleParticipants}
                                            value={detail?.record_id}
                                            size="sm"
                                            disabled={loading} variant="outline-success">{parseInt(loading) === i ?
                                        <Spinner className="spinner-button" size="sm"></Spinner> : "Admit"}</Button>
                                    :
                                    <Button data-type="revoke" data-index={i} onClick={handleParticipants}
                                            value={detail?.record_id}
                                            size="sm"
                                            disabled={loading} variant="outline-danger">{parseInt(loading) === i ?
                                        <Spinner className="spinner-button" size="sm"></Spinner> : "Revoke"}</Button>
                            }
                        </Stack>
                    )
                }
            })
        }
    }

    return (
        <Tab.Container defaultActiveKey="online">
            <Accordion className="mb-3 chat-room-detail">
                <Accordion.Item eventKey="0">
                    <Accordion.Header>Details</Accordion.Header>
                    <Accordion.Body>
                        <div>
                            <strong>
                                <div className="text-decoration-underline">Description</div>
                            </strong>
                            {selected_session?.ts_topic}
                        </div>
                        <div>
                            <strong>
                                <div className="text-decoration-underline">Start Date</div>
                            </strong>
                            {selected_session?.ts_start}
                        </div>
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>
            <Nav variant="tabs" className="mb-3 admin-container" justify>
                <Nav.Item>
                    <Nav.Link eventKey="online">
                        <div>Waiting <Badge pill
                                                 bg="danger">{selected_session?.ts_authorized_participants?.length ? selected_session?.ts_authorized_participants?.length : 0}</Badge>
                        </div>
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="chatroom">Chat <Badge pill
                                                                   bg="success">{selected_session?.ts_chat_room_participants?.length ? selected_session?.ts_chat_room_participants?.length : 0}</Badge></Nav.Link>
                </Nav.Item>
            </Nav>
            <Tab.Content>
                <Tab.Pane eventKey="online">
                    <Stack gap={2}>
                        { generateStacks('waitingRoom')}
                    </Stack>
                </Tab.Pane>
                <Tab.Pane eventKey="chatroom">
                    <Stack gap={2}>
                        { generateStacks('chatRoom')}
                    </Stack>
                </Tab.Pane>

            </Tab.Content>
        </Tab.Container>
    )
}
