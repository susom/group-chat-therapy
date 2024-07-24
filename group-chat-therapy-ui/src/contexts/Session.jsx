import { createContext, useState, useEffect, useRef } from 'react';
import useLocalStorageState from "use-local-storage-state";

export const SessionContext = createContext({
    data: {},
    setData: () => {}
});

export const SessionContextProvider = ({ children }) => {
    //RAW DATA PAYLOADS GO HERE
    const [data, setData] = useState(); //raw INITIAL data
    const [participantsLookUp, setParticipantsLookUp] = useState({}); //map participant_id to display name
    const [participants, setParticipants] = useState([]);
    const [sessionCache, setSessionCache, { removeItem }] = useLocalStorageState('current_session', { defaultValue: [] });
    const isAdmin = sessionCache?.current_user?.admin === "1";

    // Define jsmoModule outside useEffect to ensure it's in scope
    let jsmoModule;
    if (import.meta?.env?.MODE !== 'development') {
        jsmoModule = ExternalModules.Stanford.GroupChatTherapy;
    }

    // Function to check and update the session cache
    const checkAndUpdateSessionCache = () => {
        let clone = { ...sessionCache };
        jsmoModule.getUserSessions(
            sessionCache?.current_user,
            (res) => {
                if (res) {
                    let selectedSession = res.filter(e => e?.record_id === sessionCache?.selected_session?.record_id);
                    if (selectedSession.length > 0) {
                        clone['selected_session'] = selectedSession[0];
                        setSessionCache(clone);
                    }
                }
            },
            (err) => {
                console.error(err);
            }
        );
    };

    // Polling for session cache update
    useEffect(() => {
        if (jsmoModule) {
            const intervalId = setInterval(checkAndUpdateSessionCache, 3000); // Update every 5 seconds
            return () => clearInterval(intervalId); // Clear interval on component unmount
        }
    }, [sessionCache]);

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
            participants,
            isAdmin
        }}>
            {children}
        </SessionContext.Provider>
    );
}
