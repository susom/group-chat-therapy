import React, {useState, useContext} from "react";
import {useNavigate} from 'react-router-dom';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import './login.css';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';

import {SessionContext} from "../../contexts/Session.jsx";

export default function Login() {
    const session_context = useContext(SessionContext);
    const [phone, setPhone] = useState('')
    const [lastName, setLastName] = useState('')
    const [loading, setLoading] = useState(false)
    const [code, setCode] = useState('')
    const [showCode, setShowCode] = useState(false)

    const [error, setError] = useState('')
    const [lastNameError, setLastNameError] = useState(false)

    //TODO DISABLING FOR NOW FOR TESTING UI
    const jsmoModule = ExternalModules.Stanford.GroupChatTherapy
    const navigate = useNavigate()
    /**
     * Callback passed to execute react functions in JSMO
     * @param type String : Possible values = 'validateCode' and 'validateUserPhone'
     * @param res Bool
     */
    const callback = (type, res) => {
        if (type === 'validateCode') { //User is inputting code from OTP
            res ? setError('') : setError('Invalid code entered')

            //TODO FAKING FOR NOW TO TEST UI
            const res_fake = {
                chat_session_details : {
                    chat_id : "123456abcxyz",
                    title : "Alcohol Intervention",
                    description : "Group Session Chat for Dudes",
                    date : "2023-07-21",
                    time_start : 1100,
                    time_end : 1300,
                    therapist : "123xyz",
                    whiteboard : "",

                    participants :  [
                        {participant_id: "123xyz" , display_name : "Mr. Therapist", status : "online/offline"},
                        {participant_id: "abc456" , display_name : "Gilligan", status : "online/offline"},
                        {participant_id: "def789" , display_name : "Wally", status : "online/offline"}
                    ]
                },
                assessments : [
                    { participant_id : "abc456",
                        required : [
                            { assessment : "opt-in" , link : "https://redcap.stanford.edu/1", status : true },
                            { assessment : "e-consent" , link : "https://redcap.stanford.edu/2", status : true },
                            { assessment : "baseline survey" , link : "https://redcap.stanford.edu/3", status : false }
                        ]
                    }
                ],
                participant_id : "abc456"
            }

            session_context.setData(res_fake);
            navigate(`/chat`)
        } else { //User is checking existence within study
            res ? setError('') : setError('Invalid credentials supplied')
            setShowCode(res)
        }
        setLoading(false)
    }

    /**
     * Callback passed to jsmo to handle react state
     * @param type
     * @param res
     */
    const errorCallback = (type, res) => {
        setError(res?.msg)
        setLoading(false)
    }

    /**
     * Function to handle jsmo calls and loading UI
     */
    const submit = () => {
        if (!lastName) {
            setLastNameError(true)
        }

        if (showCode) { //User has entered a code
            setLoading(true);

            //TODO DISABLING FOR NOW FOR TESTING UI
            jsmoModule.validateCode(code, callback, errorCallback);
        } else if (lastName && phone) { // User needs to be verified as part of study, sent OTP
            setLoading(true);

            //TODO TEMPORARY PLACEMENT FOR TESTING UI
            // callback("validateCode", true);

            //TODO DISABLING FOR NOW FOR TESTING UI
            jsmoModule.validateUserPhone(lastName, phone, callback, errorCallback)
        } else {
            setError('Something went wrong')
        }
    }


    const getButtonState = () => {
        if (!loading) {
            return (<>Submit</>)
        } else {
            return (
                <>
                    <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="text-left"
                    />
                </>
            )
        }
    }

    return (
        <>
            <Container className="h-100 ct">
                <Row className="align-items-center h-100">
                    <Col md={{span: 6, offset: 3}}>
                        <Card className="card-body login-body">
                            {error &&
                                <Alert key='danger' variant='danger'>{error}</Alert>
                            }
                            <h2 className="text-center">Login</h2>
                            <div className="text-center mb-5">
                                <img src="https://storage.googleapis.com/group-chat-therapy/stanford-logo.svg"
                                     alt="logo-shield" className="logo-shield my-3"/>
                            </div>

                            {! showCode &&
                                <>
                                <InputGroup hasValidation className={`mb-3 ${showCode ? 'code-greyed' : 'code-showed'}`}>
                                    <InputGroup.Text id="lastname">@</InputGroup.Text>
                                    <Form.Control
                                        onChange={e => setLastName(e?.target?.value)}
                                        required
                                        isInvalid={lastNameError}
                                        disabled={showCode}
                                        placeholder="Last Name"
                                        aria-label="lastname"
                                        aria-describedby="lastname"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Please enter a valid name
                                    </Form.Control.Feedback>
                                </InputGroup>

                                <InputGroup className={`mb-3 ${showCode ? 'code-greyed' : 'code-showed'}`}>
                                    <PhoneInput
                                        country={'us'}
                                        onlyCountries={['us']}
                                        value={phone}
                                        disabled={showCode}
                                        placeholder="+1"
                                        onChange={phone => setPhone(phone)}
                                    />
                                </InputGroup>
                            </>
                            }

                            <InputGroup className={`mb-3 ${showCode ? 'code-shown' : 'code-hidden'}`}>
                                <InputGroup.Text id="code">#</InputGroup.Text>
                                <Form.Control
                                    disabled={!showCode}
                                    onChange={e => setCode(e?.target?.value)}
                                    placeholder={`Please enter your one-time code`}
                                    aria-label="code"
                                    aria-describedby="code"
                                />
                            </InputGroup>

                            <div className="d-grid gap-2 mb-5">
                                <Button
                                    className="submit"
                                    onClick={submit}
                                    disabled={loading}
                                >
                                    {getButtonState()}
                                </Button>
                            </div>
                            <p className="text-center"><i>Not registered? Contact <a href="#">here</a></i></p>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    )
}
