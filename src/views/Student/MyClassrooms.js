import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Spinner, Alert, Container, Button } from 'react-bootstrap';
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
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="font-weight-bold mb-1" style={{ color: '#2c3e50' }}>فصولي الدراسية</h4>
                        <p className="text-muted mb-0 small">تصفح جميع الفصول الدراسية المسجل بها ومتابعة حالتها</p>
                    </div>
                </div>

                {classrooms.length === 0 ? (
                    <Card className="border-0 shadow-sm text-center py-5" style={{ borderRadius: '15px' }}>
                        <Card.Body>
                            <div className="mb-3 text-muted">
                                <i className="fas fa-chalkboard fa-3x mb-3 text-secondary opacity-50"></i>
                                <h5>لا توجد لديك أي فصول دراسية مسجلة حاليًا.</h5>
                            </div>
                        </Card.Body>
                    </Card>
                ) : (
                    <Row>
                        {classrooms.map((classroom) => {
                            const statusInfo = getStatusInfo(classroom.status);
                            return (
                                <Col lg={4} md={6} sm={12} key={classroom.classroomId} className="mb-4">
                                    <Card className="h-100 border-0 shadow-sm hover-card" style={{ borderRadius: '15px', transition: 'transform 0.2s' }}>
                                        <Card.Header className="bg-white border-bottom-0 pt-4 px-4 pb-0" style={{ borderRadius: '15px 15px 0 0' }}>
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <Badge bg={statusInfo.variant} className="rounded-pill px-3 py-2">
                                                    {classroom.status.toUpperCase() === 'ACTIVE' && (
                                                        <i className="fas fa-circle text-white mr-1" style={{ fontSize: '8px' }}></i>
                                                    )}
                                                    {statusInfo.text}
                                                </Badge>
                                                <small className="text-muted font-weight-bold">#{classroom.classroomId}</small>
                                            </div>
                                            <h5 className="font-weight-bold text-dark mb-1">{classroom.courseName}</h5>
                                            <p className="text-muted small mb-0">{classroom.name}</p>
                                        </Card.Header>

                                        <Card.Body className="px-4 py-3">
                                            <div className="d-flex align-items-center mb-3 p-3 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                                                <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center mr-3" style={{ width: '45px', height: '45px', color: '#007bff' }}>
                                                    <i className="fas fa-user-tie fa-lg"></i>
                                                </div>
                                                <div>
                                                    <div className="text-muted small">المدرس</div>
                                                    <div className="font-weight-bold text-dark">{classroom.teacherName}</div>
                                                </div>
                                            </div>

                                            <div className="d-flex justify-content-between text-center px-2">
                                                <div>
                                                    <div className="text-muted small mb-1">الطلاب المسجلين</div>
                                                    <div className="h5 font-weight-bold text-primary mb-0">{classroom.enrolledStudentsCount}</div>
                                                </div>
                                                <div className="border-right"></div>
                                                <div>
                                                    <div className="text-muted small mb-1">التقدم</div>
                                                    <div className="h5 font-weight-bold text-success mb-0">- %</div>
                                                </div>
                                            </div>
                                        </Card.Body>

                                        <Card.Footer className="bg-white border-0 px-4 pb-4 pt-0" style={{ borderRadius: '0 0 15px 15px' }}>
                                            <Link to={`/student/classrooms/${classroom.classroomId}`} className="text-decoration-none">
                                                <Button variant="outline-primary" className="w-100 rounded-pill shadow-sm" style={{ border: '2px solid' }}>
                                                    عرض التفاصيل <i className="fas fa-arrow-left mr-2"></i>
                                                </Button>
                                            </Link>
                                        </Card.Footer>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                )}
            </Container>
        </div>
    );
}

export default MyClassrooms;