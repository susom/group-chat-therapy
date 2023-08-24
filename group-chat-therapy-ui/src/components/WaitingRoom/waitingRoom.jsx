import React, {useContext, useEffect, useState} from "react";
import Nav from "react-bootstrap/Nav";
import Tab from "react-bootstrap/Tab";
import Stack from "react-bootstrap/Stack";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import Accordion from "react-bootstrap/Accordion";
import Spinner from "react-bootstrap/Spinner";

import './waitingRoom.css';

import {SessionContext} from "../../contexts/Session.jsx";

export const WaitingRoom = () => {
    const session_context = useContext(SessionContext);
    const {selected_session} = session_context?.data
    const [participantDetails, setParticipantDetails] = useState([])
    const [selectedSession, setSelectedSession] = useState({})
    const [loading, setLoading] = useState(false)
    const [pageLoad, setPageLoad] = useState(true)

    let jsmoModule;
    if (import.meta?.env?.MODE !== 'development')
        jsmoModule = ExternalModules.Stanford.GroupChatTherapy

    useEffect(() => {
        setSelectedSession(session_context?.data?.selected_session)

        if (session_context?.data?.selected_session?.record_id) {
            jsmoModule.getParticipants(


                {'participants' : [
                    ...session_context?.data?.selected_session?.ts_authorized_participants,
                    ...session_context?.data?.selected_session?.ts_chat_room_participants,
                        session_context?.data?.selected_session?.ts_therapist
                    ]},

                (res) => {
                    if (res) {
                        let filtered = res?.data?.filter(e => parseInt(e.admin) !== 1) //remove admins from waiting room list
                        setParticipantDetails(filtered)

                        const participant_lookup = res?.data?.reduce((acc, item) => {
                            acc[item.record_id] = item.participant_first_name;
                            return acc;
                        }, {});

                        // Only update the state if participant_lookup is different from the previous value
                        if (JSON.stringify(session_context.participantsLookUp) !== JSON.stringify(participant_lookup)) {
                            session_context.setParticipantsLookUp(participant_lookup);
                            console.log("participantLookUp", participant_lookup, participant_lookup[4]);
                        }

                        setPageLoading(false)

                        console.log('participants', filtered)
                        setPageLoad(false)
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
                    let copy = session_context?.data
                    copy['selected_session'] = res?.data
                    session_context.setData(copy)
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
        const {selected_session} = session_context?.data
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
            return arr?.map((e, i) => {
                let detail = participantDetails?.find(el => el.record_id === e)
                if (detail)
                    return (
                        <Stack key={i} direction="horizontal" gap={3}>
                            <div className="me-auto">{detail?.participant_first_name}</div>
                            {
                                type === 'waitingRoom' ?
                                    <Button data-type="admit" data-index={i} onClick={handleParticipants} value={detail?.record_id}
                                            disabled={loading} variant="outline-success">{parseInt(loading) === i ? <Spinner className="spinner-button" size="sm" ></Spinner> : "Admit"}</Button>
                                    :
                                    <Button data-type="revoke" data-index={i} onClick={handleParticipants} value={detail?.record_id}
                                            disabled={loading} variant="outline-danger">{parseInt(loading) === i ? <Spinner className="spinner-button" size="sm" ></Spinner> :  "Revoke"}</Button>
                            }
                        </Stack>
                    )
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
                        <div>Waiting Room <Badge pill
                                                 bg="danger">{selected_session?.ts_authorized_participants?.length ? selected_session?.ts_authorized_participants?.length : 0}</Badge>
                        </div>
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="chatroom">Chat Room <Badge pill
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
