import Navbar from "react-bootstrap/Navbar";
import Container from "react-bootstrap/Container";
import Button from 'react-bootstrap/Button';
import NavDropdown from "react-bootstrap/NavDropdown";
import {Link, Navigate, useNavigate, useLocation} from "react-router-dom";

import React, {useContext} from "react";
import {SessionContext} from "../../contexts/Session.jsx";


export const NavHeader = () => {
    const session_context = useContext(SessionContext);
    const currentUser = session_context?.sessionCache?.current_user
    const navigate = useNavigate()

    const logout = () => {
    //         Remove local storage
        console.log('logging out...')
        session_context.removeItem()
        navigate('/', {replace: true})
    }

    return (
        <>
            <Navbar bg="light" className="bg-body-tertiary main-nav">
                <Container>
                    <Navbar.Brand>{currentUser?.admin === "1" ? "Admin" : "Participant"}</Navbar.Brand>
                    <Navbar.Toggle />
                    <Navbar.Collapse className="justify-content-end">
                        <NavDropdown title={`Signed in as: ${currentUser?.participant_first_name}`}>
                            <NavDropdown.Item onClick={logout}>Logout</NavDropdown.Item>
                        </NavDropdown>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        </>
    )
}
