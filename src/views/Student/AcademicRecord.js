import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import { getMyAcademicRecord } from 'services/student/studentService';

function AcademicRecord() {
    const [record, setRecord] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRecord = async () => {
            try {
                const response = await getMyAcademicRecord();
                setRecord(response.data);
            } catch (err) {
                setError("حدث خطأ أثناء جلب السجل الأكاديمي.");
                console.error("Error fetching academic record:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecord();
    }, []);

    const getStatusInfo = (status) => {
        switch (status.toUpperCase()) {
            case 'ACTIVE': return { variant: 'success', text: 'نشط' };
            case 'COMPLETED': return { variant: 'primary', text: 'مكتمل' };
            case 'CANCELLED': return { variant: 'danger', text: 'ملغى' };
            default: return { variant: 'secondary', text: status };
        }
    };

    const getOverallStatusInfo = (status) => {
        switch (status.toUpperCase()) {
            case 'ACTIVE': return { variant: 'success', text: 'طالب نشط', icon: 'fas fa-user-check' };
            case 'GRADUATED': return { variant: 'primary', text: 'متخرج', icon: 'fas fa-user-graduate' };
            case 'FAILED': return { variant: 'danger', text: 'راسب', icon: 'fas fa-user-times' };
            default: return { variant: 'secondary', text: status, icon: 'fas fa-question-circle' };
        }
    };

    if (isLoading) {
        return (
            <div className="content d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
                <Spinner animation="border" />
            </div>
        );
    }

    if (error) {
        return <Alert variant="danger" className="mx-3">{error}</Alert>;
    }

    if (!record) {
        return <Alert variant="warning" className="mx-3">لم يتم العثور على السجل الأكاديمي.</Alert>;
    }

    const overallStatusInfo = getOverallStatusInfo(record.overallStatus);

    return (
        <div className="content">
            <Row>
                <Col md="12" className="mb-4">
                    <Card className="str-card">
                        <Card.Body>
                            <Row className="align-items-center text-center">
                                <Col md="4">
                                    <i className={`${overallStatusInfo.icon} fa-3x text-${overallStatusInfo.variant}`}></i>
                                    <h4 className="mt-2 mb-0">{overallStatusInfo.text}</h4>
                                    <p className="text-muted">{record.programNameAtCompletion}</p>
                                </Col>
                                <Col md="4">
                                    <p className="mb-1 text-muted">المعدل التراكمي النهائي</p>
                                    <h4 className="fw-bold">{record.finalGpa ?? "غير محدد"}</h4>
                                </Col>
                                <Col md="4">
                                    <p className="mb-1 text-muted">تاريخ الإكمال</p>
                                    <h4 className="fw-bold">{record.completionDate ? new Date(record.completionDate).toLocaleDateString() : "---"}</h4>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md="12">
                    <Card className="str-card">
                        <Card.Header>
                            <Card.Title as="h4">السجل الأكاديمي التفصيلي</Card.Title>
                            <p className="card-category">
                                عرض لجميع الفصول الدراسية التي قمت بتسجيلها ودرجاتك فيها.
                            </p>
                        </Card.Header>
                        <Card.Body>
                            <Table responsive="md" striped hover>
                                <thead>
                                    <tr>
                                        <th>اسم المساق</th>
                                        <th>الفصل الدراسي</th>
                                        <th>العملي</th>
                                        <th>النظري</th>
                                        <th className="text-center">النهائي</th>
                                        <th className="text-center">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {record.enrollmentHistory.map((enrollment, index) => {
                                        const statusInfo = getStatusInfo(enrollment.classroomStatus);
                                        return (
                                            <tr key={index}>
                                                <td>{enrollment.courseName}</td>
                                                <td>{enrollment.classroomName}</td>
                                                <td>{enrollment.practicalGrade ?? '---'}</td>
                                                 <td>{enrollment.examGrade ?? '---' }</td>
                                                <td className="fw-bold text-center">{enrollment.finalGrade ?? '---'}</td>
                                                <td className="text-center"><Badge bg={statusInfo.variant}>{statusInfo.text}</Badge></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

export default AcademicRecord;