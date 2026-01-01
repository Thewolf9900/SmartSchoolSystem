import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getMyClassrooms } from 'services/student/studentService';

function MyClassrooms() {
    const [classrooms, setClassrooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchClassrooms = async () => {
            try {
                const response = await getMyClassrooms();
                setClassrooms(response.data);
            } catch (err) {
                setError("حدث خطأ أثناء جلب الفصول الدراسية. يرجى المحاولة مرة أخرى.");
                console.error("Error fetching classrooms:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchClassrooms();
    }, []);

    const getStatusInfo = (status) => {
        switch (status.toUpperCase()) { // استخدام toUpperCase لضمان التوافق
            case 'ACTIVE': return { variant: 'success', text: 'نشط' };
            case 'COMPLETED': return { variant: 'primary', text: 'مكتمل' };
            case 'CANCELLED': return { variant: 'danger', text: 'ملغى' };
            default: return { variant: 'secondary', text: status };
        }
    };

    if (isLoading) {
        return (
            <div className="content d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
                <Spinner animation="border" role="status" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="content">
                <Alert variant="danger">{error}</Alert>
            </div>
        );
    }

    return (
        <div className="content">
            <Row>
                <Col md="12">
                    <Card className="str-card">
                        <Card.Header>
                            <Card.Title as="h4">فصولي الدراسية</Card.Title>
                            <p className="card-category">تصفح جميع الفصول الدراسية المسجل بها</p>
                        </Card.Header>
                        <Card.Body>
                            {classrooms.length === 0 ? (
                                <Alert variant="info">لا توجد لديك أي فصول دراسية مسجلة حاليًا.</Alert>
                            ) : (
                                <Row>
                                    {classrooms.map((classroom) => {
                                        const statusInfo = getStatusInfo(classroom.status);
                                        return (
                                            <Col lg="4" md="6" sm="12" key={classroom.classroomId} className="mb-4">
                                                <Card className="card-classroom h-100 shadow-sm">
                                                    <Card.Header className="bg-light text-center">
                                                        <h5 className="card-title mb-1 fw-bold">{classroom.courseName}</h5>
                                                        <small className="text-muted">{classroom.name}</small>
                                                    </Card.Header>
                                                    <Card.Body className="d-flex flex-column justify-content-center align-items-center">
                                                        <div className="text-center mb-3">
                                                            <i className="fas fa-chalkboard-teacher fa-2x text-info"></i>
                                                            <p className="mb-0 mt-2"><strong>المدرس:</strong></p>
                                                            <p className="text-muted">{classroom.teacherName}</p>
                                                            <p className="mb-0 mt-2"><strong>عدد الطلاب</strong></p>
                                                            <p className="text-muted">{classroom.enrolledStudentsCount}</p>
                                                        </div>
                                                       
                                                    </Card.Body>
                                                    <Card.Footer>
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <Badge bg={statusInfo.variant} className="p-2 d-flex align-items-center">
                                                                {classroom.status.toUpperCase() === 'ACTIVE' && (
                                                                    <i className="fas fa-cog fa-spin me-1"></i>
                                                                )}
                                                                {statusInfo.text}
                                                            </Badge>
                                                            <Link to={`/student/classrooms/${classroom.classroomId}`} className="btn btn-primary btn-sm">
                                                                عرض التفاصيل
                                                            </Link>
                                                        </div>
                                                    </Card.Footer>
                                                </Card>
                                            </Col>
                                        );
                                    })}
                                </Row>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

export default MyClassrooms;