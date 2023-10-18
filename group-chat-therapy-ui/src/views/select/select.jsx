
import React, {useContext, useEffect, useState} from "react";

import Container from "react-bootstrap/Container";
import {SessionContext} from "../../contexts/Session.jsx";
import {useNavigate} from "react-router-dom";
import Accordion from "react-bootstrap/Accordion";

import Tab from "react-bootstrap/Tab";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import './select.css';

import {NavHeader} from "../../components/NavHeader/navheader.jsx";

export default function Select(){
    const session_context = useContext(SessionContext);
    const navigate = useNavigate()
    const [chatSessions, setChatSessions] = useState([])

    let jsmoModule;
    if (import.meta?.env?.MODE !== 'development')
        jsmoModule = ExternalModules.Stanford.GroupChatTherapy

    useEffect(() => {
        jsmoModule.getUserSessions(
            session_context?.sessionCache?.current_user,
            (res) => {
                if (res) {
                    setChatSessions(res)
                    console.log(res)
                }
            },
            (err) => {
                console.log(err)
            }
        )
    }, []);

    const parseDate = (date) => {
        // let time = Date(date)
        let time = date;
        let split = time.split(" ");

        if(split[0])
            return split[0]
        return date
    }

    const jumpTo = (e) => {
        let index = chatSessions.findIndex(session=> session.record_id === e.target.value)
        if(index !== -1 ){ //Pass props from selected session to landing
            let copy = session_context?.sessionCache
            copy['selected_session'] = chatSessions[index]
            session_context.setData(copy)
            session_context?.setSessionCache(copy)
            navigate("/landing")
        }

    }
    const renderRows = () => {
        const items = chatSessions?.map((e,i) => (
            <Accordion.Item key={i} eventKey={i} className={`${e.ts_status === '1' ? "Open" : "Closed"}`}>
                <Accordion.Header className="accHeader">
                    <span>{`${e.ts_title}`}</span>
                    <span>{parseDate(e.ts_start)}</span>
                </Accordion.Header>
                <Accordion.Body>
                    <div>
                        <div className="text-decoration-underline"><strong>Chat ID</strong></div>
                        <div className="">{e.record_id}</div>
                    </div>
                    <div>
                        <div className="text-decoration-underline"><strong>Start Date</strong></div>
                        <div className="ml-5">{e.ts_start}</div>
                    </div>
                    <div>
                        <strong><div className="text-decoration-underline">Topic</div></strong>
                        {e.ts_topic}
                    </div>
                    <div className="d-block text-end">
                        <Button value={e?.record_id} onClick={jumpTo} size="sm">Select</Button>
                    </div>
                </Accordion.Body>
            </Accordion.Item>
        ))

        items.sort((a)=> a.props.className === 'Open' ? -1 : 1)

        return (
            <Tab.Container defaultActiveKey="online">
                <Accordion className="mb-3">
                    {items}
                </Accordion>
            </Tab.Container>
        )
    }

    return (
        <>
           <NavHeader/>
            <div>
                <Container className='session-detail mt-3'>
                    <Card>
                        <Card.Header>Chat sessions</Card.Header>
                        <Card.Body>
                            {renderRows()}
                        </Card.Body>
                    </Card>
                </Container>
            </div>
        </>
    );
}
