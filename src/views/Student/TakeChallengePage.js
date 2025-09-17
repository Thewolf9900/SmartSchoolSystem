import React, { useState, useEffect, useRef } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Card, Row, Col, Button, ProgressBar, Spinner, Alert, Container } from 'react-bootstrap';
import { toast } from 'react-toastify';
// ✨ تم تصحيح مسار الاستيراد
import { getWeeklyChallengeForCourse, submitWeeklyChallenge } from 'services/student/challengeService';

function TakeChallengePage() {
    const { courseId } = useParams();
    const history = useHistory();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Timer logic
    const startTime = useRef(Date.now());

    useEffect(() => {
        const fetchChallenge = async () => {
            try {
                const response = await getWeeklyChallengeForCourse(courseId);
                if (response.data && response.data.length > 0) {
                    setQuestions(response.data);
                } else {
                    setError("لا توجد أسئلة متاحة لهذا التحدي حاليًا.");
                }
            } catch (err) {
                // عرض رسائل الخطأ من الباك اند بوضوح
                const message = err.response?.data?.message || "حدث خطأ غير متوقع أثناء تحميل التحدي.";
                setError(message);
                toast.error(message);
            } finally {
                setLoading(false);
            }
        };
        fetchChallenge();
    }, [courseId]);

    const handleSelectOption = (questionId, optionId) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    };

    const handleNext = () => {
        if (currentQIndex < questions.length - 1) {
            setCurrentQIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentQIndex > 0) {
            setCurrentQIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < questions.length) {
            return toast.warn("يرجى الإجابة على جميع الأسئلة قبل التسليم.");
        }
        if (!window.confirm("هل أنت متأكد من رغبتك في تسليم إجاباتك؟")) return;

        setIsSubmitting(true);
        const timeTakenSeconds = Math.round((Date.now() - startTime.current) / 1000);
        const formattedAnswers = Object.keys(answers).map(qId => ({
            QuestionId: parseInt(qId),
            SelectedOptionId: answers[qId]
        }));

        try {
            const response = await submitWeeklyChallenge(courseId, { Answers: formattedAnswers, TimeTakenSeconds: timeTakenSeconds });
            toast.success(response.data.message || "تم تسليم التحدي بنجاح!");
            // توجيه الطالب إلى صفحة النتائج بعد النجاح
            history.replace(`/student/challenge/result/${courseId}`);
        } catch (err) {
            const message = err.response?.data?.message || "فشل في تسليم إجابات التحدي.";
            toast.error(message);
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="content d-flex justify-content-center align-items-center"><Spinner animation="border" /></div>;
    }

    if (error) {
        return (
            <div className="content">
                <Container>
                    <Alert variant="danger" className="text-center">
                        <h4>حدث خطأ</h4>
                        <p>{error}</p>
                        <hr />
                        <Button onClick={() => history.push('/student/weekly-challenge')} variant="outline-danger">
                            العودة إلى صفحة التحديات
                        </Button>
                    </Alert>
                </Container>
            </div>
        );
    }

    const currentQuestion = questions[currentQIndex];
    const progress = ((currentQIndex + 1) / questions.length) * 100;
    const isLastQuestion = currentQIndex === questions.length - 1;

    return (
        <div className="content">
            <Container>
                <Row className="justify-content-center">
                    <Col md={10} lg={8}>
                        <Card className="str-card quiz-card">
                            <Card.Header>
                                <div className="d-flex justify-content-between">
                                    <Card.Title as="h4">تحدي الأسبوع</Card.Title>
                                    <p className="card-category">
                                        السؤال {currentQIndex + 1} من {questions.length}
                                    </p>
                                </div>
                                <ProgressBar now={progress} animated striped variant="success" className="mt-2" />
                            </Card.Header>
                            <Card.Body style={{ minHeight: '350px' }}>
                                <div className="question-text text-center mb-4">
                                    <h3>{currentQuestion.text}</h3>
                                </div>
                                {currentQuestion.imageUrl && (
                                    <div className="text-center mb-4">
                                        <img
                                            src={`${process.env.REACT_APP_API_BASE_URL}/${currentQuestion.imageUrl}`}
                                            alt="Question Illustration"
                                            style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '8px', border: '1px solid #eee' }}
                                        />
                                    </div>
                                )}
                                <Row className="justify-content-center">
                                    {currentQuestion.options.map(option => (
                                        <Col md="6" key={option.questionOptionId} className="mb-3">
                                            <Card
                                                className={`option-card h-100 ${answers[currentQuestion.questionId] === option.questionOptionId ? 'selected' : ''}`}
                                                onClick={() => handleSelectOption(currentQuestion.questionId, option.questionOptionId)}
                                                role="button"
                                            >
                                                <Card.Body className="d-flex justify-content-center align-items-center">
                                                    <h5 className="mb-0 text-center">{option.text}</h5>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            </Card.Body>
                            <Card.Footer>
                                <div className="d-flex justify-content-between">
                                    <Button variant="secondary" onClick={handlePrev} disabled={currentQIndex === 0 || isSubmitting}>
                                        <i className="fas fa-arrow-left me-1"></i> السابق
                                    </Button>
                                    {isLastQuestion ? (
                                        <Button variant="success" size="lg" onClick={handleSubmit} disabled={isSubmitting}>
                                            {isSubmitting ? <Spinner as="span" animation="border" size="sm" /> : <><i className="fas fa-check-circle me-1"></i> إنهاء وتسليم</>}
                                        </Button>
                                    ) : (
                                        <Button variant="primary" onClick={handleNext} disabled={isSubmitting}>
                                            التالي <i className="fas fa-arrow-right ms-1"></i>
                                        </Button>
                                    )}
                                </div>
                            </Card.Footer>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default TakeChallengePage;