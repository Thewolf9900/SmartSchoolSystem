import React, { useState, useEffect } from 'react';
import { useParams, Link, useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    Container, Row, Col, Card, Button, Modal, Form, Spinner,
    ListGroup, Breadcrumb, Badge, Image, Table, Alert
} from 'react-bootstrap';
import { getQuizDetails, addQuestionToQuiz, deleteQuizQuestion, getQuizSubmissions, activateQuiz } from 'services/teacher/teacherService';

function QuizManagement() {
    const { quizId } = useParams();
    const history = useHistory();
    const [quizDetails, setQuizDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isActivating, setIsActivating] = useState(false);
    const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
    const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
    const initialNewQuestionState = { text: '', image: null, questionType: 'MultipleChoice', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] };
    const [newQuestion, setNewQuestion] = useState(initialNewQuestionState);
    const [submitting, setSubmitting] = useState(false);
    const [submissions, setSubmissions] = useState([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [imageToShow, setImageToShow] = useState('');

    const fetchQuizData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getQuizDetails(quizId);
            setQuizDetails(response.data);
        } catch (err) {
            const errorMessage = err.response?.data?.message || "فشل في جلب تفاصيل الاختبار.";
            toast.error(errorMessage);
            setError("لم يتم العثور على الاختبار أو لا تملك صلاحية الوصول.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuizData();
    }, [quizId]);

    const handleActivateQuiz = async () => {
        if (quizDetails.questions.length === 0) {
            return toast.warn("لا يمكن تفعيل اختبار لا يحتوي على أسئلة.");
        }
        if (window.confirm("هل أنت متأكد من تفعيل الاختبار؟ لن تتمكن من تعديله أو حذف الأسئلة بعد التفعيل.")) {
            setIsActivating(true);
            try {
                await activateQuiz(quizId);
                toast.success("تم تفعيل الاختبار بنجاح.");
                fetchQuizData();
            } catch (err) {
                toast.error(err.response?.data?.message || "فشل في تفعيل الاختبار.");
            } finally {
                setIsActivating(false);
            }
        }
    };

    const handleOptionChange = (index, field, value) => {
        const updatedOptions = [...newQuestion.options];
        if (newQuestion.questionType === 'MultipleChoice' && field === 'isCorrect' && value === true) {
            updatedOptions.forEach((opt, i) => opt.isCorrect = (i === index));
        } else {
            updatedOptions[index][field] = value;
        }
        setNewQuestion({ ...newQuestion, options: updatedOptions });
    };

    const handleQuestionTypeChange = (e) => {
        const type = e.target.value;
        let options = [{ text: 'صح', isCorrect: true }, { text: 'خطأ', isCorrect: false }];
        if (type === 'MultipleChoice') {
            options = [{ text: '', isCorrect: true }, { text: '', isCorrect: false }];
        }
        setNewQuestion({ ...newQuestion, questionType: type, options });
    };

    const addOption = () => setNewQuestion({ ...newQuestion, options: [...newQuestion.options, { text: '', isCorrect: false }] });
    const removeOption = (index) => setNewQuestion({ ...newQuestion, options: newQuestion.options.filter((_, i) => i !== index) });

    const handleAddQuestionSubmit = async (e) => {
        e.preventDefault();
        if (!newQuestion.text.trim() && !newQuestion.image) { return toast.warn("يجب إدخال نص للسؤال أو رفع صورة."); }
        if (newQuestion.options.some(opt => !opt.text.trim())) { return toast.warn("يجب تعبئة جميع خيارات الإجابة."); }
        if (!newQuestion.options.some(opt => opt.isCorrect)) { return toast.warn("يجب تحديد إجابة صحيحة واحدة على الأقل."); }
        setSubmitting(true);
        const formData = new FormData();
        formData.append('Text', newQuestion.text);
        if (newQuestion.image) { formData.append('Image', newQuestion.image); }
        formData.append('QuestionType', newQuestion.questionType);
        newQuestion.options.forEach((opt, index) => {
            formData.append(`Options[${index}].Text`, opt.text);
            formData.append(`Options[${index}].IsCorrect`, opt.isCorrect);
        });
        try {
            await addQuestionToQuiz(quizId, formData);
            toast.success("تمت إضافة السؤال بنجاح.");
            setShowAddQuestionModal(false);
            setNewQuestion(initialNewQuestionState);
            fetchQuizData();
        } catch (error) {
            const errorMessage = error.response?.data?.message || "فشل في إضافة السؤال.";
            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteQuestion = async (questionId) => {
        if (window.confirm("هل أنت متأكد من حذف هذا السؤال؟")) {
            try {
                await deleteQuizQuestion(questionId);
                toast.success("تم حذف السؤال بنجاح.");
                fetchQuizData();
            } catch (error) {
                toast.error(error.response?.data?.message || "فشل في حذف السؤال.");
            }
        }
    };

    const handleShowSubmissions = async () => {
        setShowSubmissionsModal(true);
        setLoadingSubmissions(true);
        try {
            const response = await getQuizSubmissions(quizId);
            setSubmissions(response.data);
        } catch (error) {
            const errorMessage = error.response?.data?.message || "فشل في جلب نتائج الطلاب.";
            toast.error(errorMessage);
        } finally {
            setLoadingSubmissions(false);
        }
    };

    const handleShowImage = (imageUrl) => {
        const fullUrl = `${process.env.REACT_APP_API_BASE_URL}/${imageUrl}`;
        setImageToShow(fullUrl);
        setShowImageModal(true);
    };

    if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;
    if (error) return <Container><Alert variant="danger" className="mt-4">{error}</Alert></Container>;

    return (
        <>
            <Container fluid>
                <Row>
                    <Col>
                        <Breadcrumb listProps={{ className: "bg-transparent p-0" }}>
                            <li className="breadcrumb-item"><Link to="/teacher/my-classrooms">فصولي</Link></li>
                            <Breadcrumb.Item active>إدارة الاختبار</Breadcrumb.Item>
                        </Breadcrumb>
                    </Col>
                </Row>
                <Row className="mb-3 align-items-center">
                    <Col xs="auto">
                        <Button variant="outline-secondary" onClick={() => history.goBack()} title="رجوع"><i className="fas fa-arrow-right"></i></Button>
                    </Col>
                    <Col>
                        <h4 className="title mb-0">إدارة اختبار: {quizDetails?.title}</h4>
                    </Col>
                </Row>

                <Card>
                    <Card.Header>
                        <Row className="align-items-center">
                            <Col><Card.Title as="h5">الأسئلة ({quizDetails?.questions?.length || 0})</Card.Title></Col>
                            <Col xs="auto" className="d-flex align-items-center">
                                {quizDetails?.isEnabled ? (
                                    <Badge bg="success" className="p-2">
                                        <i className="fas fa-check-circle me-1"></i> الاختبار مفعّل
                                    </Badge>
                                ) : (
                                    <Button
                                        variant="warning"
                                        size="sm"
                                        onClick={handleActivateQuiz}
                                        disabled={isActivating}
                                        title="بعد التفعيل، لن تتمكن من تعديل الاختبار"
                                    >
                                        {isActivating ? <Spinner size="sm" /> : <><i className="fas fa-power-off me-1"></i> تفعيل الاختبار</>}
                                    </Button>
                                )}
                                <Button variant="success" size="sm" className="ms-3" onClick={() => setShowAddQuestionModal(true)} disabled={quizDetails?.isEnabled}>
                                    <i className="fas fa-plus" /> إضافة سؤال
                                </Button>
                                <Button variant="outline-info" size="sm" className="ms-2" onClick={handleShowSubmissions}>
                                    <i className="fas fa-poll" /> عرض النتائج
                                </Button>
                            </Col>
                        </Row>
                    </Card.Header>
                    <Card.Body>
                        {quizDetails?.questions.length > 0 ? (
                            quizDetails.questions.map((q, index) => (
                                <Card key={q.lectureQuizQuestionId} className="mb-3">
                                    <Card.Header className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <Badge bg="dark" className="me-2">{index + 1}</Badge>
                                            <strong>{q.text}</strong>
                                        </div>
                                        <div>
                                            {q.imageUrl && <Button variant="light" size="sm" className="text-info mx-1" onClick={() => handleShowImage(q.imageUrl)} title="عرض الصورة"><i className="fas fa-image" /></Button>}
                                            <Button variant="light" size="sm" className="text-danger" onClick={() => handleDeleteQuestion(q.lectureQuizQuestionId)} disabled={quizDetails?.isEnabled} title={quizDetails?.isEnabled ? 'لا يمكن الحذف بعد التفعيل' : 'حذف السؤال'}><i className="fas fa-trash" /></Button>
                                        </div>
                                    </Card.Header>
                                    <Card.Body>
                                        {q.imageUrl && <Image src={`${process.env.REACT_APP_API_BASE_URL}/${q.imageUrl}`} thumbnail style={{ maxHeight: '150px' }} className="mb-3" />}
                                        <ListGroup variant="flush">
                                            {q.options.map(opt => (
                                                <ListGroup.Item
                                                    key={opt.lectureQuizQuestionOptionId}
                                                    className={`d-flex align-items-center ${opt.isCorrect ? 'bg-light-success' : ''}`}
                                                >
                                                    <i className={`fas ${opt.isCorrect ? 'fa-check-circle text-success' : 'fa-circle text-muted'} me-2`}></i>
                                                    {opt.text}
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    </Card.Body>
                                </Card>
                            ))
                        ) : (
                            <Alert variant="info" className="text-center">
                                لم يتم إضافة أسئلة بعد. انقر على "إضافة سؤال" للبدء.
                            </Alert>
                        )}
                    </Card.Body>
                </Card>
            </Container>

            <Modal show={showAddQuestionModal} onHide={() => setShowAddQuestionModal(false)} size="lg" centered>
                <Modal.Header closeButton><Modal.Title>إضافة سؤال جديد</Modal.Title></Modal.Header>
                <Form onSubmit={handleAddQuestionSubmit}>
                    <Modal.Body>
                        <Form.Group><Form.Label>نص السؤال (اختياري)</Form.Label><Form.Control as="textarea" rows={2} value={newQuestion.text} onChange={e => setNewQuestion({ ...newQuestion, text: e.target.value })} /></Form.Group>
                        <Form.Group className="mt-3"><Form.Label>صورة السؤال (اختياري)</Form.Label><Form.Control type="file" accept="image/*" onChange={e => setNewQuestion({ ...newQuestion, image: e.target.files[0] })} /></Form.Group>
                        <Form.Group className="mt-3"><Form.Label>نوع السؤال</Form.Label><Form.Select value={newQuestion.questionType} onChange={handleQuestionTypeChange}><option value="MultipleChoice">اختيار من متعدد</option><option value="TrueFalse">صح / خطأ</option></Form.Select></Form.Group>
                        <hr /><h6 className="mt-3">خيارات الإجابة</h6>
                        {newQuestion.options.map((opt, index) => (
                            <Row key={index} className="align-items-center mb-2">
                                <Col xs="auto"><Form.Check type="radio" name="correctOption" id={`option-radio-${index}`} checked={opt.isCorrect} onChange={e => handleOptionChange(index, 'isCorrect', e.target.checked)} /></Col>
                                <Col><Form.Control type="text" placeholder={`نص الخيار ${index + 1}`} value={opt.text} onChange={e => handleOptionChange(index, 'text', e.target.value)} required /></Col>
                                <Col xs="auto">{newQuestion.options.length > 2 && <Button variant="outline-danger" size="sm" onClick={() => removeOption(index)}><i className="fas fa-times" /></Button>}</Col>
                            </Row>
                        ))}
                        {newQuestion.questionType === 'MultipleChoice' && <Button variant="link" size="sm" onClick={addOption}>+ إضافة خيار</Button>}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowAddQuestionModal(false)}>إلغاء</Button>
                        <Button variant="primary" type="submit" disabled={submitting}>{submitting ? <Spinner size="sm" /> : "حفظ السؤال"}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Modal show={showSubmissionsModal} onHide={() => setShowSubmissionsModal(false)} size="lg" centered>
                <Modal.Header closeButton><Modal.Title>نتائج الطلاب</Modal.Title></Modal.Header>
                <Modal.Body>
                    {loadingSubmissions ? <div className="text-center"><Spinner /></div> : submissions.length > 0 ? (
                        <Table striped bordered hover responsive size="sm">
                            <thead><tr><th>#</th><th>الطالب</th><th>النتيجة</th><th>تاريخ التسليم</th></tr></thead>
                            <tbody>
                                {submissions.map((sub, index) => (
                                    <tr key={sub.studentId}>
                                        <td>{index + 1}</td>
                                        <td>{sub.studentName}</td>
                                        <td><Badge bg={sub.score >= (sub.totalQuestions / 2) ? 'success' : 'danger'}>{sub.score} / {sub.totalQuestions}</Badge></td>
                                        <td>{new Date(sub.submittedAt).toLocaleString('ar-EG')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ) : <p className="text-center text-muted">لم يقم أي طالب بإجراء الاختبار بعد.</p>}
                </Modal.Body>
            </Modal>

            <Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>عرض الصورة</Modal.Title></Modal.Header>
                <Modal.Body className="text-center">
                    <Image src={imageToShow} fluid />
                </Modal.Body>
            </Modal>
        </>
    );
}

export default QuizManagement;