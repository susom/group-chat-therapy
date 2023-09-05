import { createContext, useState, useEffect, useRef } from 'react';

export const SessionContext = createContext({
    data : {},
    setData : () => {}
});

export const SessionContextProvider = ({children}) => {
    //RAW DATA PAYLOADS GO HERE
    const [data, setData]                                   = useState(); //raw INITIAL data
    const [participantsLookUp, setParticipantsLookUp]       = useState({}); //map participant_id to display name
    const [participants, setParticipants]                   = useState([]);

    return (
        <SessionContext.Provider value={{
                                        setData,
                                        data,
                                        setParticipantsLookUp,
                                        participantsLookUp,
                                        setParticipants,
                                        participants
        }}>
            {children}
        </SessionContext.Provider>
    );
}
