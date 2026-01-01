import React, { useState, useEffect } from 'react';
import { Card, Container, Row, Col, Spinner, Alert, Badge } from 'react-bootstrap';
import { getMyAnnouncements } from 'services/student/studentService'; // استخدام الدالة من خدمة الطالب

function Announcements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            setLoading(true);
            try {
                const response = await getMyAnnouncements();
                // فرز الإعلانات من الأحدث إلى الأقدم
                const sortedAnnouncements = response.data.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
                setAnnouncements(sortedAnnouncements);
            } catch (err) {
                setError("حدث خطأ أثناء جلب الإعلانات.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncements();
    }, []);

    // دالة مساعدة لتحديد لون وأيقونة نطاق الإعلان
    const getScopeDetails = (scope) => {
        switch (scope) {
            case 'PROGRAM':
                return { variant: 'primary', icon: 'fas fa-graduation-cap' };
            case 'COURSE':
                return { variant: 'dark', icon: 'fas fa-book' };
            case 'CLASSROOM':
                return { variant: 'success', icon: 'fas fa-chalkboard-teacher' };
            case 'GLOBAL':
                return { variant: 'info', icon: 'fas fa-globe' };
            default:
                return { variant: 'secondary', icon: 'fas fa-tag' };
        }
    };

    if (loading) {
        return (
            <div className="content d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
                <Spinner animation="border" />
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
                <Row>
                    <Col md="12">
                        <Card className="str-card">
                            <Card.Header>
                                <Card.Title as="h4">لوحة الإعلانات</Card.Title>
                                <p className="card-category">آخر الأخبار والتحديثات</p>
                            </Card.Header>
                            <Card.Body>
                                {announcements.length > 0 ? (
                                    announcements.map(announcement => {
                                        const scopeDetails = getScopeDetails(announcement.targetScope);
                                        return (
                                            <Card key={announcement.announcementId} className="mb-3">
                                                <Card.Header className="d-flex justify-content-between align-items-center">
                                                    <h5 className="mb-0">{announcement.title}</h5>
                                                    <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                                                        {new Date(announcement.postedAt).toLocaleDateString('ar-EG', {
                                                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                                        })}
                                                    </span>
                                                </Card.Header>
                                                <Card.Body>
                                                    <p style={{ whiteSpace: 'pre-wrap' }}>{announcement.content}</p>
                                                </Card.Body>
                                                <Card.Footer className="text-muted d-flex justify-content-end">
                                                    <Badge bg={scopeDetails.variant}>
                                                        <i className={`${scopeDetails.icon} me-2`}></i>
                                                        {announcement.targetName || 'إعلان عام'}
                                                    </Badge>
                                                </Card.Footer>
                                            </Card>
                                        );
                                    })
                                ) : (
                                    <Alert variant="info" className="text-center">
                                        لا توجد إعلانات جديدة في الوقت الحالي.
                                    </Alert>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default Announcements;