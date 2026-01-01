import React from "react";
import { Card, Table, Col, Spinner } from "react-bootstrap";
import PositiveState from "../PositiveState/PositiveState";

const ReportCard = ({ title, description, loading, data, renderRow, positiveMessage, ...colProps }) => {
    // Default to md=6 if no sizing props are provided
    const finalColProps = Object.keys(colProps).some(k => ['xs', 'sm', 'md', 'lg', 'xl'].includes(k))
        ? colProps
        : { md: 6, ...colProps };

    const renderContent = () => {
        if (loading) {
            return <tr><td className="text-center p-5"><Spinner /></td></tr>;
        }
        if (data.length > 0) {
            return data.map(renderRow);
        }
        return <tr><td><PositiveState message={positiveMessage} /></td></tr>;
    };

    return (
        <Col {...finalColProps} className="mb-4">
            <Card>
                <Card.Header>
                    <Card.Title as="h4">{title}</Card.Title>
                    <p className="card-category">{description}</p>
                </Card.Header>
                <Card.Body className="table-full-width table-responsive px-0">
                    <Table className="table-hover">
                        <tbody>
                            {renderContent()}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </Col>
    );
};

export default ReportCard;
