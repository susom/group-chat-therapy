import React, {useContext, useEffect, useState} from "react";
import {Badge, Button, Table} from 'react-bootstrap';
import './surveylist.css';
import {SessionContext} from "../../contexts/Session.jsx";
import Alert from "react-bootstrap/Alert";

export default function SurveyList({completed= false, setSurveysComplete}) {
    const [surveys, setSurveys] = useState({})
    const session_context = useContext(SessionContext);

    let jsmoModule;
    if (import.meta?.env?.MODE !== 'development')
        jsmoModule = ExternalModules.Stanford.GroupChatTherapy

    const callback = (res) => {
        if('no_surveys_required' in res && setSurveysComplete)
            setSurveysComplete(true)
        setSurveys(res)
    }

    const errorCallback = (err) => {
        console.log(err)
    }

    useEffect(() => {
        jsmoModule.getUserSurveys(
            {
                'participant_id': session_context?.sessionCache?.current_user?.record_id,
                'therapy_session_id': session_context?.sessionCache?.selected_session?.record_id,
                'completed': completed
            },
            callback,
            errorCallback
        )
    }, [completed]);

    const generateStack = (key, value) => {
        if(key !== 'no_surveys_required'){
            const badgeComplete = <Badge bg="success">Done</Badge>
            const badgeIncomplete = <Badge bg="danger">Required</Badge>
            return (
                <tr>
                    <td>{key}</td>
                    <td>{value.complete === '2' ? badgeComplete : badgeIncomplete}</td>
                    <td><Button variant="outline-primary" size="sm" href={value?.url}>Navigate</Button></td>
                </tr>
            )
        } else {
            return (
                <tr>
                    <td colSpan={3}><Alert variant="success">No surveys required! </Alert></td>
                </tr>
            )
        }

    }

    const renderSurveys = () => {
        let svObj = []
        let surveysComplete = 0
        for (const [key, value] of Object.entries(surveys)) {
            if(value.complete === '2')
                surveysComplete+=1

            svObj.push(generateStack(key, value)) //keep track of if all are completed
        }

        if(setSurveysComplete && surveysComplete === Object.entries(surveys).length && Object.entries(surveys).length !== 0) { //If all are finished, set parent ui
            setSurveysComplete(true)
        }

        return svObj
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
        </div>
    )
}
