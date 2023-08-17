
import React, {useContext} from "react";
import Navbar from "react-bootstrap/Navbar";
import Container from "react-bootstrap/Container";
import {SessionContext} from "../../contexts/Session.jsx";
import {useNavigate} from "react-router-dom";
import Accordion from "react-bootstrap/Accordion";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Badge from "react-bootstrap/Badge";
import Tab from "react-bootstrap/Tab";
import Stack from "react-bootstrap/Stack";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import './select.css';

export default function Select(){
    const session_context = useContext(SessionContext);
    const navigate = useNavigate()
    const isAdmin = true

    const parseDate = (date) => {
        // let time = Date(date)
        let time = date;
        let split = time.split(" ");

        if(split[0])
            return split[0]
        return date
    }

    const jumpTo = (e) => {
        let sessions = session_context?.data?.chat_sessions
        let index = sessions.findIndex(session=> session.record_id === e.target.value)
        if(index !== -1 ){ //Pass props from selected session to landing
            let copy = session_context.data
            copy['selected_session'] = sessions[index]
            session_context.setData(copy)
            // navigate("/landing", { state: sessions[index] })
            navigate("/landing")
        }

    }
    const renderRows = () => {
        const items = session_context?.data?.chat_sessions.map((e,i) => (
            <Accordion.Item className="mb-3" key={i} eventKey={i}>
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
                        <strong><div className="text-decoration-underline">Description</div></strong>
                        {e.ts_topic}
                    </div>
                    <div className="d-block text-end">
                        <Button value={e?.record_id} onClick={jumpTo} size="sm">Select</Button>
                    </div>
                </Accordion.Body>
            </Accordion.Item>
        ))

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
            <Navbar bg="light" className="bg-body-tertiary main-nav">
                <Container>
                    <Navbar.Brand>{isAdmin ? "Admin" : "Participant"}</Navbar.Brand>
                    <Navbar.Toggle />
                    <Navbar.Collapse className="justify-content-end">
                        <Navbar.Text>
                            Signed in as: {session_context?.data?.participantID}
                        </Navbar.Text>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
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
