import React, { useState, useEffect } from 'react';
import { Card, Table, Spinner, Alert, Badge } from 'react-bootstrap';
import { getChallengeLeaderboard } from '../services/student/challengeService';

const formatTime = (totalSeconds) => {
    if (totalSeconds === null || totalSeconds === undefined) return '-';
    if (totalSeconds < 60) return `${totalSeconds} ثانية`;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes} دقيقة و ${seconds} ثانية`;
};

const getRankIcon = (rank) => {
    if (rank === 1) return <><i className="fas fa-trophy text-warning"></i></>;
    if (rank === 2) return <><i className="fas fa-medal" style={{ color: '#C0C0C0' }}></i></>;
    if (rank === 3) return <><i className="fas fa-award" style={{ color: '#cd7f32' }}></i></>;
    return <Badge bg="dark" pill>{rank}</Badge>;
};

function WeeklyChallenge({ courseId, courseName }) {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            if (!courseId) return;
            setLoading(true);
            try {
                const response = await getChallengeLeaderboard(courseId);
                setLeaderboard(response.data);
            } catch (err) {
                setError("فشل في تحميل بيانات التحدي.");
                console.error("Failed to fetch challenge leaderboard:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [courseId]);

    if (loading) {
        return <div className="text-center my-4"><Spinner animation="border" size="sm" /> <span className="ms-2">جاري تحميل نتائج التحدي...</span></div>;
    }

    if (error) {
        return <Alert variant="danger" className="mt-3">{error}</Alert>;
    }

    return (
        <Card className="str-card mt-4">
            <Card.Header>
                <Card.Title as="h5"><i className="fas fa-fist-raised text-primary me-2"></i>لوحة أبطال مساق: {courseName}</Card.Title>
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
                                <tr key={entry.studentId} className={entry.rank <= 3 ? 'table-light' : ''}>
                                    <td className="text-center align-middle fs-5">{getRankIcon(entry.rank)}</td>
                                    <td className="align-middle fw-bold">{entry.studentName}</td>
                                    <td className="text-center align-middle"><Badge bg="success" className="fs-6">{entry.score}</Badge></td>
                                    <td className="text-center align-middle text-muted small">{formatTime(entry.timeTakenSeconds)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ) : (
                    <div className="p-4 text-center">
                        <i className="fas fa-users fa-2x text-muted mb-2"></i>
                        <p className="mb-0">كن أول من يشارك في تحدي هذا المساق!</p>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}

export default WeeklyChallenge;