import React, { useContext, useEffect } from "react";
import { useNavigate, Navigate, useLocation, useBeforeUnload } from "react-router-dom";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import { NavHeader } from "../../components/NavHeader/navheader.jsx";
import SurveyList from '../../components/SurveyList/surveylist.jsx';
import { SessionContext } from "../../contexts/Session.jsx";
import './completed.css';
import Container from "react-bootstrap/Container";

export default function Completed() {
    console.log("Rendering Completed component");
    const session_context = useContext(SessionContext);
    const navigate = useNavigate();
    const location = useLocation();

    let jsmoModule;
    if (import.meta?.env?.MODE !== 'development')
        jsmoModule = ExternalModules.Stanford.GroupChatTherapy;

    const admin = session_context?.sessionCache?.current_user?.admin === '1';

    const navigateSelect = () => {
        console.log("Navigating to /select");
        navigate("/select");
    };

    useBeforeUnload(
        React.useCallback((event) => {
            event.preventDefault();
            return (event.returnValue = "Are you sure you want to leave? Your progress may not be saved.");
        }, [])
    );

    useEffect(() => {
        const preventNavigation = (event) => {
            console.log("Navigation prevented");
            window.history.pushState(null, "", window.location.href);
            event.preventDefault();
        };

        window.history.pushState(null, "", window.location.href);
        window.addEventListener("popstate", preventNavigation);

        const intervalId = setInterval(() => {
            window.history.pushState(null, "", window.location.href);
        }, 200);

        return () => {
            window.removeEventListener("popstate", preventNavigation);
            clearInterval(intervalId);
        };
    }, []);

    console.log("Checking session context", session_context);
    if (!session_context?.sessionCache?.current_user?.record_id) {
        console.log("No user record found, navigating to root");
        return <Navigate to="/" />;
    }

    return (
        <>
            <NavHeader />
            <Container fluid className='session-detail mt-3'>
                <Card>
                    <Card.Header>Post Chat Surveys</Card.Header>
                    <Card.Body className="d-flex flex-column">
                        <Alert variant="success">
                            Thank you for completing the chat session! <br/>
                            Please complete any assigned surveys and turn your video on to notify the admin when finished.
                        </Alert>
                        {!admin &&
                            <SurveyList
                                completed={true}
                            />
                        }
                        <Button variant="primary" onClick={navigateSelect}>Home</Button>
                    </Card.Body>
                </Card>
            </Container>
        </>
    );
}
