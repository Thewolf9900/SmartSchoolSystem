import React, { useState, useMemo } from "react";
import {
    Container, Row, Col, Card, Button, Spinner,
    Accordion, ListGroup, Alert, Table, Badge
} from "react-bootstrap";
import { toast } from 'react-toastify';
import { useTeacherData } from "contexts/TeacherDataContext";
import { getChallengeLeaderboardForTeacher } from "services/teacher/teacherService";

function WeeklyChallengeViewer() {
    const { classrooms, loading: loadingContext } = useTeacherData();
    const [leaderboardCache, setLeaderboardCache] = useState({});
    const [loadingLeaderboardId, setLoadingLeaderboardId] = useState(null);

    // استخلاص قائمة فريدة بالمساقات
    const uniqueCourses = useMemo(() => {
        if (loadingContext || !classrooms) return [];
        const coursesMap = new Map();
        classrooms.forEach(classroom => {
            if (!coursesMap.has(classroom.courseId)) {
                coursesMap.set(classroom.courseId, {
                    courseId: classroom.courseId,
                    courseName: classroom.courseName,
                    programName: classroom.academicProgramName,
                });
            }
        });
        return Array.from(coursesMap.values());
    }, [classrooms, loadingContext]);

    // جلب بيانات لوحة المتصدرين عند فتح الأكورديون
    const handleAccordionToggle = async (courseId) => {
        if (leaderboardCache[courseId]) return;
        setLoadingLeaderboardId(courseId);
        try {
            const response = await getChallengeLeaderboardForTeacher(courseId);
            setLeaderboardCache(prevCache => ({
                ...prevCache,
                [courseId]: response.data
            }));
        } catch (error) {
            toast.error(`فشل في تحميل لوحة الأبطال لمساق: ${uniqueCourses.find(c => c.courseId === courseId)?.courseName}`);
        } finally {
            setLoadingLeaderboardId(null);
        }
    };

    const formatTime = (seconds) => (seconds < 60 ? `${seconds} ث` : `${Math.floor(seconds / 60)} د و ${seconds % 60} ث`);
    const getRankIcon = (rank) => {
        if (rank === 1) return <i className="fas fa-trophy text-warning"></i>;
        if (rank === 2) return <i className="fas fa-medal" style={{ color: '#C0C0C0' }}></i>;
        if (rank === 3) return <i className="fas fa-award" style={{ color: '#cd7f32' }}></i>;
        return <Badge bg="dark" pill>{rank}</Badge>;
    };

    const renderContent = () => {
        if (loadingContext) {
            return <div className="text-center py-5"><Spinner /></div>;
        }
        if (uniqueCourses.length === 0) {
            return <Alert variant="info" className="text-center">لا توجد مساقات مرتبطة بحسابك لعرض تحدياتها.</Alert>;
        }

        return (
            <Accordion>
                {uniqueCourses.map(course => (
                    <Card as={Accordion.Item} eventKey={course.courseId.toString()} key={course.courseId} className="mb-2">
                        <Card.Header as={Accordion.Header} onClick={() => handleAccordionToggle(course.courseId)}>
                            <div className="w-100">
                                <h5 className="mb-0">{course.courseName}</h5>
                                <small className="text-muted">{course.programName}</small>
                            </div>
                        </Card.Header>
                        <Accordion.Body>
                            {loadingLeaderboardId === course.courseId ? (
                                <div className="text-center p-3"><Spinner size="sm" /></div>
                            ) : (
                                leaderboardCache[course.courseId] && leaderboardCache[course.courseId].length > 0 ? (
                                    <Table striped bordered hover responsive>
                                        <thead><tr><th className="text-center">الترتيب</th><th>الطالب</th><th className="text-center">النتيجة</th><th>الوقت</th></tr></thead>
                                        <tbody>
                                            {leaderboardCache[course.courseId].map(entry => (
                                                <tr key={entry.studentId}>
                                                    <td className="text-center align-middle fs-5">{getRankIcon(entry.rank)}</td>
                                                    <td className="align-middle fw-bold">{entry.studentName}</td>
                                                    <td className="text-center align-middle"><Badge bg="success">{entry.score}</Badge></td>
                                                    <td className="text-center align-middle small text-muted">{formatTime(entry.timeTakenSeconds)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                ) : (
                                    <Alert variant="secondary" className="text-center">لا توجد مشاركات في تحدي هذا الأسبوع لهذا المساق بعد.</Alert>
                                )
                            )}
                        </Accordion.Body>
                    </Card>
                ))}
            </Accordion>
        );
    };

    return (
        <div className="content">
            <Container fluid>
                <Row>
                    <Col>
                        <h4 className="title mb-0">متابعة تحديات الأسبوع</h4>
                        <p className="category">عرض لوحات الأبطال للمساقات التي تقوم بتدريسها أو تنسيقها.</p>
                    </Col>
                </Row>
                <Row className="mt-4">
                    <Col md="12">
                        {renderContent()}
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default WeeklyChallengeViewer;