import React, {useState} from "react";
import {Link} from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import './login.css';
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/bootstrap.css'

export default function Login() {
    const [phone, setPhone] = useState('')
    return (
        <>
            <Container className="h-100 ct">
                <Row className="align-items-center h-100">
                    <Col md={{ span: 6, offset: 3 }}>

                        <Card className="card-body">
                            <h2 className="text-center">Login</h2>
                            <div className="text-center mb-5">
                                <img src="https://storage.googleapis.com/group-chat-therapy/stanford-logo.svg" alt="logo-shield" className="logo-shield my-3"/>
                            </div>

                            <InputGroup className="mb-3">
                                <InputGroup.Text id="sunet">@</InputGroup.Text>
                                <Form.Control
                                    placeholder="Sunet"
                                    aria-label="Sunet"
                                    aria-describedby="sunet"
                                />
                            </InputGroup>
                            <InputGroup className="mb-3">
                                <PhoneInput
                                    country={'us'}
                                    value={phone}
                                    onChange={phone => setPhone(phone )}
                                />
                            </InputGroup>
                            <div className="d-grid gap-2 mb-5">
                                <Button className="submit">Submit</Button>
                            </div>
                            <p className="text-center"><i>Not registered? Contact <a href="#">here</a></i> </p>
                            {/*<Link to={"/chat"}>Click</Link>*/}
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    )
}
