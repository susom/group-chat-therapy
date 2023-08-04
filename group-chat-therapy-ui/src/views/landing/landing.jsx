import React, {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import ListGroup from "react-bootstrap/ListGroup";
import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import { Table, Tag, Transfer } from "antd";
import {TableTransfer} from "../../components/TableTransfer/TableTransfer.jsx";
import './landing.css';

const leftTableColumns = [
    {
        dataIndex: 'title',
        title: 'Name',
    },
    {
        dataIndex: 'tag',
        title: 'Tag',
        render: (tag) => <Tag>{tag}</Tag>,
    }
];

const rightTableColumns = [
    {
        dataIndex: 'title',
        title: 'Name',
    },
];

export default function Landing() {
    const [mockData, setMockData] = useState([])
    const [targetKeys, setTargetKeys] = useState([])
    const [disabled, setDisabled] = useState(false);

    const onChange = (nextTargetKeys) => {
        setTargetKeys(nextTargetKeys);
    };
    const triggerDisable = (checked) => {
        setDisabled(checked);
    };

    useEffect(() => {
        const tempTargetKeys = [];
        const tempMockData = [];
        const names = ["Alvin Schultasdfasdfz", "Eric asdfasdfasdf", "Jordan", "Andre", "Sally", "Daphne", "Alyssa", "Barbie", "Kevin", "Troy"]
        for (let i = 0; i < 10; i++) {
            const data = {
                key: i.toString(),
                title: names[i],
                description: `description of content${i + 1}`,
                chosen: i % 2 === 0,
            };
            if (data.chosen) {
                tempTargetKeys.push(data.key);
            }
            tempMockData.push(data);
        }
        setMockData(tempMockData);
        setTargetKeys(tempTargetKeys);
    }, [])


    const renderList = () => {
        return (
            <Card text="dark" bg="light">
                <Card.Body>
                    <Card.Title>Surveys</Card.Title>
                    <ListGroup as="ol"  className="my-2">
                        <ListGroup.Item
                            action
                            as="li"
                            className="d-flex justify-content-between align-items-start"
                        >
                            <div className="ms-2 me-auto">
                                <div className="fw-bold">Survey 1</div>
                                Mental health questionnaire
                            </div>
                            <Badge bg="danger" pill>
                                Not complete
                            </Badge>
                        </ListGroup.Item>
                        <ListGroup.Item
                            action
                            as="li"
                            className="d-flex justify-content-between align-items-start"
                            disabled
                        >
                            <div className="ms-2 me-auto">
                                <div className="fw-bold">Survey 2</div>
                                Physical health questionnaire
                            </div>
                            <Badge bg="success" pill>
                                Complete
                            </Badge>
                        </ListGroup.Item>

                    </ListGroup>
                </Card.Body>
            </Card>
        )
    }

    const renderChatRooms = () => {
        return (
            <Card className="mt-3">
                <Card.Body>
                    <Card.Title>Chat Rooms</Card.Title>
                    <ListGroup as="ol"  className="my-2">
                        <ListGroup.Item
                            action
                            as="li"
                            className="d-flex justify-content-between align-items-start"
                        >
                            <div className="ms-2 me-auto">
                                <div className="fw-bold">Chat 08/08/23</div>
                                Led by: Jordan Schultz
                            </div>
                            <Button>Enter chat</Button>
                        </ListGroup.Item>
                        <ListGroup.Item
                            action
                            as="li"
                            className="d-flex justify-content-between align-items-start"
                            disabled
                        >
                            <div className="ms-2 me-auto">
                                <div className="fw-bold">Chat 09/21/23</div>
                                Led by: Andrew Martin
                            </div>
                            <Button>Enter chat</Button>
                        </ListGroup.Item>
                    </ListGroup>
                </Card.Body>
            </Card>
        )
    }

    return (
        <>
            <Container fluid>
                <Row>
                    <Col className="align-items-center">
                        <h1>Landing</h1>
                        {renderList()}
                        {renderChatRooms()}
                        <Link to={"/"}>Back to login page</Link>
                    </Col>
                </Row>


            </Container>
            <div className="admin-table">
                <TableTransfer
                    dataSource={mockData}
                    targetKeys={targetKeys}
                    // listStyle={{width: 500}}
                    // style={{width: '1000px'}}
                    disabled={disabled}
                    onChange={onChange}
                    filterOption={(inputValue, item) =>
                        item.title.indexOf(inputValue) !== -1 || item.tag.indexOf(inputValue) !== -1
                    }
                    leftColumns={leftTableColumns}
                    rightColumns={rightTableColumns}
                />
            </div>


        </>
    );
}
