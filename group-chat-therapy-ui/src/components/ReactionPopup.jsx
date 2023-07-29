import React from 'react';
import Reaction from './Reaction.jsx';

const reactions = ['heart', 'smile', 'sad', 'angry']; // replace with your actual icons

function ReactionPopup({ onReact , onMouseOver, onMouseOut}) {
    return (
        <div className="reaction-popup" onMouseOver={onMouseOver} onMouseOut={onMouseOut}>
            {reactions.map((reaction, index) => (
                <Reaction
                    key={index}
                    reaction={{ icon: reaction }}
                    onClick={onReact}
                />
            ))}
        </div>
    );
}

export default ReactionPopup;
