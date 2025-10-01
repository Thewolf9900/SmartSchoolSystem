import React, { useState, useEffect } from 'react';
import { useParams, Link, useHistory } from 'react-router-dom';
import { Card, Row, Col, Spinner, Alert, Button, ListGroup, ProgressBar, Badge } from 'react-bootstrap';
import { getQuizResultReview } from 'services/student/studentService';

function QuizResult() {
    const { submissionId } = useParams();
    const history = useHistory(); // استخدام useHistory للتحكم في التنقل
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchResult = async () => {
            if (!submissionId) {
                setError("لم يتم توفير معرّف لنتيجة الاختبار.");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);
            try {
                const response = await getQuizResultReview(submissionId);
                setResult(response.data);
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    setError("لم يتم العثور على بيانات لنتيجة الاختبار المطلوبة.");
                } else {
                    setError("حدث خطأ ما أثناء جلب النتيجة. يرجى المحاولة مرة أخرى.");
                }
                console.error("Error fetching quiz result:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResult();
    }, [submissionId]);

    if (isLoading) {
        return (
            <div className="content d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
                <Spinner animation="border" variant="primary" />
                <h4 className="ms-3">جاري تحميل النتيجة...</h4>
            </div>
        );
    }

    if (error) {
        return (
            <div className="content">
                <Alert variant={error.includes("العثور") ? "warning" : "danger"}>{error}</Alert>
                <Button onClick={() => history.goBack()} variant="primary">
                    <i className="fas fa-arrow-left me-2"></i>
                    العودة
                </Button>
            </div>
        );
    }

    if (!result) {
        return (
            <div className="content">
                <Alert variant="info">لا توجد بيانات لعرضها.</Alert>
            </div>
        );
    }

    const percentage = result.totalQuestions > 0 ? Math.round((result.score / result.totalQuestions) * 100) : 0;
    const scoreVariant = percentage >= 50 ? 'success' : 'danger';

    return (
        <div className="content">
            <Row className="justify-content-center">
                <Col md="10" lg="8">
                    {/* بطاقة ملخص النتيجة */}
                    <Card className="str-card mb-4">
                        <Card.Header>
                            <Card.Title as="h4">نتيجة اختبار: {result.quizTitle}</Card.Title>
                            <p className="card-category">
                                تم التقديم بتاريخ: {new Date(result.submittedAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </Card.Header>
                        <Card.Body className="text-center">
                            <h3>النتيجة النهائية</h3>
                            <h1 className={`display-4 fw-bold text-${scoreVariant}`}>
                                {result.score} <span className="h4">/ {result.totalQuestions}</span>
                            </h1>
                            <ProgressBar now={percentage} variant={scoreVariant} style={{ height: '25px' }} className="mt-3" label={`${percentage}%`} />
                            <p className="mt-3 text-muted">{`لقد أجبت بشكل صحيح على ${result.score} من أصل ${result.totalQuestions} سؤال.`}</p>
                        </Card.Body>
                        <Card.Footer className="text-center">
                            <Button onClick={() => history.goBack()} variant="primary">
                                <i className="fas fa-arrow-left me-2"></i>
                                <Link to="/student/classrooms/" style={{ textDecoration: 'none' }}></Link>       
                                عودة للفصل
                                                     </Button>
                        </Card.Footer>
                    </Card>

                    {/* بطاقة مراجعة الأسئلة التفصيلية */}
                    <Card className="str-card">
                        <Card.Header>
                            <Card.Title as="h4">مراجعة الأسئلة</Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <ListGroup variant="flush">
                                {result.questionReviews && result.questionReviews.length > 0 ? (
                                    result.questionReviews.map((review, index) => (
                                        <ListGroup.Item key={review.questionId} className="p-3 mb-2 border rounded">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <h6 className="mb-0" style={{ flex: 1 }}>
                                                    <Badge bg="secondary" className="me-2 p-2">سؤال {index + 1}</Badge>
                                                    {review.questionText}
                                                </h6>
                                                {review.wasCorrect ? (
                                                    <span className="text-success"><i className="fas fa-check-circle fa-2x"></i></span>
                                                ) : (
                                                    <span className="text-danger"><i className="fas fa-times-circle fa-2x"></i></span>
                                                )}
                                            </div>

                                            {review.imageUrl && (
                                                <div className="text-center my-3">
                                                    <img
                                                        src={`${review.imageUrl}`}
                                                        alt={`Question Illustration`}
                                                        style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '8px', border: '1px solid #eee' }}
                                                    />
                                                </div>
                                            )}

                                            <div className={`p-2 rounded ${review.wasCorrect ? 'bg-light-success' : 'bg-light-danger'}`}>
                                                <strong>إجابتك:</strong> {review.yourAnswerText || "لم تتم الإجابة"}
                                            </div>

                                            {!review.wasCorrect && (
                                                <div className="p-2 mt-2 rounded bg-light-info">
                                                    <strong>الإجابة الصحيحة:</strong> {review.correctAnswerText}
                                                </div>
                                            )}
                                        </ListGroup.Item>
                                    ))
                                ) : (
                                    <Alert variant="info" className="text-center">
                                        لا توجد تفاصيل للأسئلة في هذه المراجعة.
                                    </Alert>
                                )}
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

export default QuizResult;