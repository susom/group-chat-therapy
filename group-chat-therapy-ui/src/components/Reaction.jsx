import React, {useContext} from 'react';
import { HeartFill, EmojiSmileFill, EmojiFrownFill, EmojiAngryFill } from 'react-bootstrap-icons';
import {SessionContext} from "./../contexts/Session.jsx";
export default function Reaction({ reaction, onClick, displayOnly }) {
    const session_context       = useContext(SessionContext);

    const iconMap = {
        'heart': HeartFill,
        'smile': EmojiSmileFill,
        'sad'  : EmojiFrownFill,
        'angry': EmojiAngryFill,
    };

    const title = displayOnly ? `from ${session_context.participantsLookUp[reaction.user]}` : reaction.icon ;

    const IconComponent = iconMap[reaction.icon];
    return IconComponent ? (
        <IconComponent
            className={reaction.icon}
            title={title}
            onClick={displayOnly ? null : () => onClick(reaction.icon)}
        />
    ) : null;
}
