import React, { useContext } from "react";
import { Navbar, Container, NavDropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { SessionContext } from "../contexts/Session.jsx";

export default function GlobalHeader() {
    const session_context = useContext(SessionContext);
    const currentUser = session_context?.sessionCache?.current_user;
    const navigate = useNavigate();

    const logout = () => {
        console.log('logging out...');
        session_context.removeItem();
        navigate('/', { replace: true });
    };

    return (
        <section className="su-brand-bar">
            <div className="su-brand-bar__container container d-flex justify-content-between align-items-center">
                <a className="su-brand-bar__logo" href="https://med.stanford.edu">Stanford University</a>
                {currentUser && (
                    <NavDropdown title={`Signed in as: ${currentUser.participant_display_name}`} className="ms-auto nav-dropdown">
                        <NavDropdown.Item onClick={logout} className="dropdown-item">Logout</NavDropdown.Item>
                    </NavDropdown>
                )}
            </div>
        </section>
    );
}
