import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Alert, Table, Badge, Button } from 'react-bootstrap';
// ✨ تم تصحيح مسار الاستيراد
import { getChallengeLeaderboard } from 'services/student/challengeService';

// دالة مساعدة لتحويل الثواني إلى دقائق وثواني
const formatTime = (totalSeconds) => {
    if (totalSeconds === null || totalSeconds === undefined) return '-';
    if (totalSeconds < 60) return `${totalSeconds} ثانية`;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes} دقيقة و ${seconds} ثانية`;
};

// دالة مساعدة لعرض أيقونة للمراكز الثلاثة الأولى
const getRankIcon = (rank) => {
    if (rank === 1) return <><i className="fas fa-trophy text-warning"></i></>;
    if (rank === 2) return <><i className="fas fa-medal" style={{ color: '#C0C0C0' }}></i></>;
    if (rank === 3) return <><i className="fas fa-award" style={{ color: '#cd7f32' }}></i></>;
    return <Badge bg="dark" pill>{rank}</Badge>;
};

function ChallengeResultPage() {
    const { courseId } = useParams();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUserRank, setCurrentUserRank] = useState(null);

    // الحصول على ID الطالب الحالي من التوكن (نفترض أنه مخزن)
    const currentUserId = JSON.parse(atob(localStorage.getItem('token').split('.')[1])).nameid;


    useEffect(() => {
        const fetchLeaderboard = async () => {
            if (!courseId) return;
            setLoading(true);
            try {
                const response = await getChallengeLeaderboard(courseId);
                setLeaderboard(response.data);

                // البحث عن ترتيب الطالب الحالي
                const userEntry = response.data.find(entry => entry.studentId.toString() === currentUserId);
                if (userEntry) {
                    setCurrentUserRank(userEntry.rank);
                }

            } catch (err) {
                setError("فشل في تحميل لوحة الأبطال.");
                console.error("Failed to fetch leaderboard", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [courseId, currentUserId]);

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
                <Row className="justify-content-center">
                    <Col md={10} lg={8}>
                        {/* رسالة تهنئة إذا كان الطالب من المتصدرين */}
                        {currentUserRank && currentUserRank <= 10 && (
                            <Alert variant="success" className="text-center">
                                <Alert.Heading>تهانينا!</Alert.Heading>
                                <p>لقد أحرزت المركز <strong>{currentUserRank}</strong> في تحدي هذا الأسبوع. أداء رائع!</p>
                            </Alert>
                        )}

                        <Card className="str-card">
                            <Card.Header className="text-center">
                                <Card.Title as="h3"><i className="fas fa-fist-raised text-primary me-2"></i>لوحة الأبطال</Card.Title>
                                <p className="card-category">نتائج تحدي هذا الأسبوع</p>
                            </Card.Header>
                            <Card.Body className="p-0">
                                {leaderboard.length > 0 ? (
                                    <Table striped hover responsive className="mb-0">
                                        <thead>
                                            <tr>
                                                <th className="text-center">الترتيب</th>
                                                <th>اسم المتحدي</th>
                                                <th className="text-center">النتيجة</th>
                                                <th className="text-center">الوقت المستغرق</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {leaderboard.map(entry => (
                                                <tr key={entry.studentId} className={entry.studentId.toString() === currentUserId ? 'table-primary' : (entry.rank <= 3 ? 'table-light' : '')}>
                                                    <td className="text-center align-middle fs-5">{getRankIcon(entry.rank)}</td>
                                                    <td className="align-middle fw-bold">{entry.studentName}</td>
                                                    <td className="text-center align-middle">
                                                        <Badge bg="success" className="fs-6 px-2">{entry.score}</Badge>
                                                    </td>
                                                    <td className="text-center align-middle text-muted small">{formatTime(entry.timeTakenSeconds)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                ) : (
                                    <Alert variant="info" className="m-3 text-center">
                                        لا توجد نتائج لعرضها حاليًا. كن أول من يكمل التحدي!
                                    </Alert>
                                )}
                            </Card.Body>
                            <Card.Footer className="text-center">
                                <Button as={Link} to="/student/weekly-challenge" variant="primary" className="btn-fill">
                                    <i className="fas fa-gamepad me-2"></i> العودة إلى صفحة التحديات
                                </Button>
                            </Card.Footer>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default ChallengeResultPage;