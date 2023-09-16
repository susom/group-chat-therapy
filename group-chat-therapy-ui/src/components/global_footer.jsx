import React  from "react";

export default function GlobalFooter() {
    return (
        <div className="su-global-footer">
            <div className="su-global-footer__container container" title="Common Stanford resources">
                {/*<div className="su-global-footer__brand">*/}
                {/*    <a className="su-logo" href="https://www.stanford.edu">*/}
                {/*        Stanford*/}
                {/*        <br/>*/}
                {/*        <i>University</i>*/}
                {/*    </a>*/}
                {/*</div>*/}
                <div className="su-global-footer__content">
                    <div className="su-global-footer__copyright">
                        <span>&copy; Stanford University.</span>
                        <span>&nbsp; Stanford, California 94305.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
