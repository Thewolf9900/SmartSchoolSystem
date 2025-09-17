import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Card, Row, Col, Button, ProgressBar, Spinner, Alert } from 'react-bootstrap';
import { getQuizForLecture, submitQuiz } from 'services/student/studentService';
import { toast } from 'react-toastify';

function TakeQuiz() {
    const { quizId } = useParams();
    const history = useHistory();

    const [quiz, setQuiz] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});

    useEffect(() => {
        const fetchQuiz = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // لاحظ أننا نستخدم quizId من الرابط هنا، وهو في الواقع lectureId
                const response = await getQuizForLecture(quizId);
                setQuiz(response.data);
            } catch (err) {
                const errorMessage = err.response?.data?.message || "فشل في تحميل الاختبار. قد تكون قد قمت بتقديمه بالفعل.";
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuiz();
    }, [quizId]);

    const handleSelectOption = (questionId, optionId) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        const totalQuestions = quiz.questions.length;
        const answeredQuestions = Object.keys(answers).length;

        if (answeredQuestions < totalQuestions) {
            toast.warn("يرجى الإجابة على جميع الأسئلة قبل التسليم.");
            return;
        }

        if (window.confirm("هل أنت متأكد من رغبتك في تسليم إجاباتك؟ لا يمكنك التراجع بعد ذلك.")) {
            setIsSubmitting(true);
            const formattedAnswers = Object.keys(answers).map(questionId => ({
                questionId: parseInt(questionId),
                selectedOptionId: answers[questionId]
            }));

            try {
                const response = await submitQuiz(quiz.lectureQuizId, formattedAnswers);
                toast.success("تم تسليم الاختبار بنجاح! جارٍ عرض نتيجتك...");

                // --- ✨ هذا هو الكود الجديد والمعدل ---
                // نستخرج submissionId من الاستجابة ونوجه الطالب إلى المسار الديناميكي الصحيح
                const { submissionId } = response.data;
                if (submissionId) {
                    history.push(`/student/quiz-result/${submissionId}`);
                } else {
                    // في حالة عدم وجود submissionId لسبب ما، يتم توجيه الطالب إلى صفحة عامة
                    toast.error("حدث خطأ أثناء الحصول على معرّف النتيجة.");
                    history.push('/student/my-classrooms');
                }

            } catch (err) {
                const errorMessage = err.response?.data?.message || "فشل في تسليم الاختبار.";
                toast.error(errorMessage);
                setIsSubmitting(false);
            }
        }
    };

    if (isLoading) {
        return <div className="content d-flex justify-content-center pt-5"><Spinner animation="border" /></div>;
    }

    if (error) {
        return (
            <div className="content">
                <Alert variant="danger" className="text-center">
                    <Alert.Heading>عذرًا، حدث خطأ!</Alert.Heading>
                    <p>{error}</p>
                    <hr />
                    <Button onClick={() => history.goBack()} variant="outline-danger">
                        العودة
                    </Button>
                </Alert>
            </div>
        );
    }

    if (!quiz) {
        return <Alert variant="warning">لم يتم العثور على بيانات الاختبار.</Alert>;
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
    const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

    return (
        <div className="content">
            <Row className="justify-content-center">
                <Col md="10" lg="8">
                    <Card className="str-card quiz-card">
                        <Card.Header>
                            <Card.Title as="h4">{quiz.title}</Card.Title>
                            <p className="card-category">
                                السؤال {currentQuestionIndex + 1} من {quiz.questions.length}
                            </p>
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
                                        alt={`Question ${currentQuestion.lectureQuizQuestionId}`}
                                        style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '8px', border: '1px solid #eee' }}
                                    />
                                </div>
                            )}

                            <Row className="justify-content-center">
                                {currentQuestion.options.map(option => (
                                    <Col md="6" key={option.lectureQuizQuestionOptionId} className="mb-3">
                                        <Card
                                            className={`option-card h-100 ${answers[currentQuestion.lectureQuizQuestionId] === option.lectureQuizQuestionOptionId ? 'selected' : ''}`}
                                            onClick={() => handleSelectOption(currentQuestion.lectureQuizQuestionId, option.lectureQuizQuestionOptionId)}
                                            role="button"
                                        >
                                            <Card.Body className="d-flex justify-content-center align-items-center">
                                                <h5 className="mb-0">{option.text}</h5>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>

                        </Card.Body>
                        <Card.Footer>
                            <div className="d-flex justify-content-between">
                                <Button variant="secondary" onClick={handlePrevious} disabled={currentQuestionIndex === 0 || isSubmitting}>
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
        </div>
    );
}

export default TakeQuiz;