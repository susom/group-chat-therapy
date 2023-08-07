import React , { useContext } from "react";
import {SessionContext} from "./../contexts/Session.jsx";

export default function GlobalHeader() {
    const session_context   = useContext(SessionContext);

    return (
        <section className="su-brand-bar">
            <div className="su-brand-bar__container">
                <a className="su-brand-bar__logo" href="https://med.stanford.edu">Stanford University</a>
            </div>
        </section>
    );
}
