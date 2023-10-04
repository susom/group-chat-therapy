import { createContext, useState, useEffect, useRef } from 'react';
import useLocalStorageState from "use-local-storage-state";

export const SessionContext = createContext({
    data : {},
    setData : () => {}
});

export const SessionContextProvider = ({children}) => {
    //RAW DATA PAYLOADS GO HERE
    const [data, setData]                                   = useState(); //raw INITIAL data
    const [participantsLookUp, setParticipantsLookUp]       = useState({}); //map participant_id to display name
    const [participants, setParticipants]                   = useState([]);
    const [sessionCache, setSessionCache, {removeItem}]     = useLocalStorageState('current_session', { defaultValue : []})

    return (
        <SessionContext.Provider value={{
            setData,
            data,

            sessionCache,
            setSessionCache,
            removeItem,

            setParticipantsLookUp,
            participantsLookUp,
            setParticipants,
            participants
        }}>
            {children}
        </SessionContext.Provider>
    );
}
