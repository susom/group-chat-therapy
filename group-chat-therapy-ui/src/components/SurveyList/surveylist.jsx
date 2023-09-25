import {useContext, useEffect, useState} from "react";
import {Badge, Button, Table} from 'react-bootstrap';
import './surveylist.css';
import {SessionContext} from "../../contexts/Session.jsx";

export default function SurveyList({completed= false}) {
    const [surveys, setSurveys] = useState({})
    const session_context = useContext(SessionContext);

    let jsmoModule;
    if (import.meta?.env?.MODE !== 'development')
        jsmoModule = ExternalModules.Stanford.GroupChatTherapy

    const callback = (res) => {
        setSurveys(res)
    }

    const errorCallback = (err) => {
        console.log(err)
    }

    useEffect(() => {
        if(completed) {
            jsmoModule.getUserSurveys(
                {
                    'participant_id': session_context?.sessionCache?.current_user?.record_id,
                    'therapy_session_id': session_context?.sessionCache?.selected_session?.record_id,
                    'completed': true
                },
                callback,
                errorCallback
            )
        } else {
            jsmoModule.getUserSurveys(
                {
                    'participant_id': session_context?.sessionCache?.current_user?.record_id,
                    'therapy_session_id': session_context?.sessionCache?.selected_session?.record_id,
                    'completed': false
                },
                callback,
                errorCallback
            )
        }

    }, [completed]);

    const generateStack = (key, value) => {
        const badgeComplete = <Badge bg="success">Done</Badge>
        const badgeIncomplete = <Badge bg="danger">Required</Badge>
        return (
            <tr>
                <td>{key}</td>
                <td>{value.complete === '2' ? badgeComplete : badgeIncomplete}</td>
                <td><Button variant="outline-primary" size="sm" href={value?.url}>Navigate</Button></td>
            </tr>
        )
    }

    const renderSurveys = () => {
        let svObj = []

        for (const [key, value] of Object.entries(surveys))
            svObj.push(generateStack(key, value))

        return svObj
    }

    const checkCompletion = () => {
        let counter = 0
        for (const [key, value] of Object.entries(surveys))
            if (value?.complete === '2')
                counter += 1

        return counter === Object.entries(surveys).length
    }

    return (
        <div>
            <Table responsive>
                <thead>
                <tr>
                    <th>Survey</th>
                    <th>Status</th>
                    <th className="navigate_col">Navigate</th>
                </tr>
                </thead>
                <tbody>
                {Object.keys(surveys) && renderSurveys()}
                </tbody>
            </Table>
            {/*<Stack gap={1}>*/}
            {/*    {Object.keys(surveys).length && renderSurveys()}*/}
            {/*</Stack>*/}
        </div>
    )
}
