import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import { getMyCourses } from 'services/student/studentService'; // افترض وجود هذه الدالة

function StartChallengePage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const history = useHistory();

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await getMyCourses(); // يجب أن تعيد { courseId, courseName }
                setCourses(response.data);
            } catch (error) {
                console.error("Failed to fetch courses", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    if (loading) return <div className="content text-center"><Spinner /></div>;

    return (
        <div className="content">
            <Container fluid>
                <Card className="str-card">
                    <Card.Header>
                        <Card.Title as="h4">تحدي الأسبوع</Card.Title>
                        <p className="card-category">اختر مساقًا لبدء التحدي الأسبوعي الخاص به.</p>
                    </Card.Header>
                    <Card.Body>
                        {courses.length > 0 ? (
                            <Row>
                                {courses.map(course => (
                                    <Col md={4} key={course.courseId} className="mb-3">
                                        <Card className="text-center">
                                            <Card.Body>
                                                <Card.Title>{course.courseName}</Card.Title>
                                                <Button
                                                    variant="primary"
                                                    onClick={() => history.push(`/student/challenge/take/${course.courseId}`)}
                                                >
                                                    <i className="fas fa-play me-2"></i>ابدأ التحدي
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        ) : (
                            <Alert variant="info">أنت غير مسجل في أي مساقات حاليًا.</Alert>
                        )}
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
}
export default StartChallengePage;