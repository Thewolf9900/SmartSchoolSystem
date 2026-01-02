import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, Spinner, Alert, Container } from 'react-bootstrap';
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
            case 'ACTIVE': return { variant: 'success', text: 'طالب نشط', icon: 'fas fa-user-check', iconStyle: { width: '100%', height: '100%',padding: '29px' } };
            case 'GRADUATED': return { variant: 'primary', text: 'متخرج', icon: 'fas fa-user-graduate', iconStyle: {} };
            case 'FAILED': return { variant: 'danger', text: 'راسب', icon: 'fas fa-user-times', iconStyle: { width: '100%', height: '100%', padding: '29px' } };
            default: return { variant: 'secondary', text: status, icon: 'fas fa-question-circle', iconStyle: {} };
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
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="font-weight-bold mb-1" style={{ color: '#2c3e50' }}>السجل الأكاديمي</h4>
                        <p className="text-muted mb-0 small">عرض شامل للتقدم الأكاديمي وتفاصيل الدرجات</p>
                    </div>
                </div>

                <Row>
                    <Col md="12" className="mb-4">
                        <Card className="border-0 shadow-sm" style={{ borderRadius: '15px' }}>
                            <Card.Body className="p-5">
                                <Row className="align-items-center text-center">
                                    <Col md="4" className="mb-4 mb-md-0 d-flex flex-column align-items-center justify-content-center text-center">
                                        <div className={`rounded-circle d-flex align-items-center justify-content-center mb-3 shadow-sm bg-light`}
                                            style={{ width: '100px', height: '100px' }}>
                                            <i className={`${overallStatusInfo.icon} fa-3x text-${overallStatusInfo.variant}`} style={overallStatusInfo.iconStyle}></i>
                                        </div>
                                        <h4 className="font-weight-bold mb-0">{overallStatusInfo.text}</h4>
                                     </Col>
                                    <Col md="4" className="mb-4 mb-md-0 border-right border-left">
                                        <p className="mb-2 text-muted small font-weight-bold text-uppercase">المعدل التراكمي النهائي</p>
                                        <h1 className="display-4 fw-bold text-dark mb-0">{record.finalGpa ?? "---"}</h1>
                                        <div className="mt-2">
                                            {record.finalGpa ? (
                                                <Badge bg="info" className="rounded-pill px-3">معدل جيد</Badge>
                                            ) : <Badge bg="secondary" className="rounded-pill px-3">غير محدد</Badge>}
                                        </div>
                                    </Col>
                                    <Col md="4">
                                        <p className="mb-2 text-muted small font-weight-bold text-uppercase">تاريخ الإكمال</p>
                                        <h3 className="fw-bold text-dark mb-0">
                                            {record.completionDate ? new Date(record.completionDate).toLocaleDateString('ar-EG') : "---"}
                                        </h3>
                                      </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md="12">
                        <Card className="border-0 shadow-sm" style={{ borderRadius: '15px' }}>
                            <Card.Header className="bg-white border-0 pt-4 px-4 pb-2" style={{ borderRadius: '15px 15px 0 0' }}>
                                <div className="d-flex align-items-center">
                                    <i className="fas fa-list-alt text-primary mr-2 fa-lg"></i>
                                    <h5 className="font-weight-bold text-dark mb-0">تفاصيل المساقات والفصول الدراسية</h5>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <div className="table-responsive">
                                    <Table hover className="align-middle mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="border-0 py-3 pl-4 small font-weight-bold text-muted">اسم المساق</th>
                                                <th className="border-0 py-3 small font-weight-bold text-muted">الفصل الدراسي</th>
                                                <th className="border-0 py-3 small font-weight-bold text-muted text-center">العملي</th>
                                                <th className="border-0 py-3 small font-weight-bold text-muted text-center">النظري</th>
                                                <th className="border-0 py-3 small font-weight-bold text-muted text-center">الدرجة النهائية</th>
                                                <th className="border-0 py-3 pr-4 small font-weight-bold text-muted text-center">الحالة</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {record.enrollmentHistory.length > 0 ? (
                                                record.enrollmentHistory.map((enrollment, index) => {
                                                    const statusInfo = getStatusInfo(enrollment.classroomStatus);
                                                    return (
                                                        <tr key={index} style={{ borderBottom: '1px solid #f1f1f1' }}>
                                                            <td className="py-3 pl-4 font-weight-bold text-dark">{enrollment.courseName}</td>
                                                            <td className="py-3 text-muted">{enrollment.classroomName}</td>
                                                            <td className="py-3 text-center">{enrollment.practicalGrade ?? '-'}</td>
                                                            <td className="py-3 text-center">{enrollment.examGrade ?? '-'}</td>
                                                            <td className="py-3 text-center">
                                                                {enrollment.finalGrade ? (
                                                                    <span className={`f-w-600 ${enrollment.finalGrade >= 50 ? 'text-success' : 'text-danger'} fw-bold`}>
                                                                        {enrollment.finalGrade}
                                                                    </span>
                                                                ) : '-'}
                                                            </td>
                                                            <td className="py-3 pr-4 text-center">
                                                                <Badge bg={statusInfo.variant} className="rounded-pill px-3">
                                                                    {statusInfo.text}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="text-center py-5 text-muted">
                                                        لا توجد بيانات تسجيل لعرضها.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default AcademicRecord;