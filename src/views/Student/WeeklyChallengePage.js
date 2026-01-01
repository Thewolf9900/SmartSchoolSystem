import React, { useState, useEffect, useMemo } from 'react';
// --- ✨ الإصلاح هنا: تمت إضافة ListGroup و Badge ---
import {
    Container, Row, Col, Card, Button, Spinner,
    Alert, Accordion, ListGroup, Badge
} from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getMyClassrooms } from 'services/student/studentService';
import { getChallengeLeaderboard } from 'services/student/challengeService';

// مكون لوحة المتصدرين (Leaderboard)
function Leaderboard({ courseId }) {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            if (!courseId) return;
            try {
                const response = await getChallengeLeaderboard(courseId);
                setLeaderboard(response.data);
            } catch (err) {
                console.error("Failed to fetch leaderboard for course:", courseId, err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [courseId]);

    const formatTime = (seconds) => (seconds < 60 ? `${seconds} ث` : `${Math.floor(seconds / 60)} د و ${seconds % 60} ث`);

    if (loading) return <div className="text-center my-2"><Spinner size="sm" /></div>;

    return leaderboard.length > 0 ? (
        <ListGroup variant="flush">
            {leaderboard.slice(0, 3).map(entry => (
                <ListGroup.Item key={entry.studentId} className="d-flex justify-content-between">
                    <span><i className={`fas fa-trophy ${entry.rank === 1 ? 'text-warning' : ''}`}></i> {entry.rank}. {entry.studentName}</span>
                    <Badge bg="success">{entry.score}</Badge>
                </ListGroup.Item>
            ))}
        </ListGroup>
    ) : <p className="text-muted small text-center my-2">كن أول من يشارك في تحدي هذا المساق!</p>;
}


function WeeklyChallengePage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const history = useHistory();

    useEffect(() => {
        const fetchUserCourses = async () => {
            try {
                const response = await getMyClassrooms();
                const coursesMap = new Map();
                response.data.forEach(classroom => {
                    if (!coursesMap.has(classroom.courseId)) {
                        coursesMap.set(classroom.courseId, {
                            courseId: classroom.courseId,
                            courseName: classroom.courseName,
                        });
                    }
                });
                setCourses(Array.from(coursesMap.values()));
            } catch (error) {
                console.error("Failed to fetch user courses", error);
                toast.error("فشل في تحميل قائمة المساقات.");
            } finally {
                setLoading(false);
            }
        };
        fetchUserCourses();
    }, []);

    if (loading) {
        return <div className="content d-flex justify-content-center align-items-center"><Spinner animation="border" /></div>;
    }

    return (
        <div className="content">
            <Container fluid>
                <Row>
                    <Col>
                        <h4 className="title mb-0">تحدي الأسبوع</h4>
                        <p className="category">
                            اختر مساقًا لبدء تحدي أسبوعي جديد أو عرض لوحة الأبطال.
                        </p>
                    </Col>
                </Row>
                <Row className="mt-4">
                    <Col>
                        {courses.length > 0 ? (
                            <Accordion>
                                {courses.map(course => (
                                    <Accordion.Item eventKey={course.courseId.toString()} key={course.courseId}>
                                        <Accordion.Header>
                                            <span className="fw-bold fs-5">{course.courseName}</span>
                                        </Accordion.Header>
                                        <Accordion.Body>
                                            <p>هل أنت مستعد لاختبار معلوماتك في هذا المساق؟</p>
                                            <Button
                                                variant="primary"
                                                className="btn-fill mb-3"
                                                onClick={() => history.push(`/student/challenge/take/${course.courseId}`)}
                                            >
                                                <i className="fas fa-play me-2"></i>ابدأ تحدي هذا المساق
                                            </Button>
                                            <hr />
                                            <h6 className="mt-3"><i className="fas fa-fist-raised text-primary me-2"></i>لوحة الأبطال الحالية</h6>
                                            <Leaderboard courseId={course.courseId} />
                                        </Accordion.Body>
                                    </Accordion.Item>
                                ))}
                            </Accordion>
                        ) : (
                            <Alert variant="info" className="text-center">
                                يجب أن تكون مسجلاً في فصل دراسي واحد على الأقل للمشاركة في التحديات.
                            </Alert>
                        )}
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default WeeklyChallengePage;