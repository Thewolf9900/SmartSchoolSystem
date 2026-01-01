import React, { useState, useEffect } from "react";
import { useParams, Link, useHistory } from "react-router-dom";
import {
    Container, Row, Col, Card, Button, ListGroup,
    Modal, Form, Spinner, Alert, Breadcrumb, Tabs, Tab
} from "react-bootstrap";
import { toast } from 'react-toastify';
import {
    getClassroomLectures, createLecture, deleteLecture,
    addMaterialToLecture, deleteMaterial, downloadTeacherMaterial,
    createQuizForLecture, deleteQuiz
} from "services/teacher/teacherService";

function LectureManagement() {
    const { classroomId } = useParams();
    const history = useHistory();
    const [lectures, setLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLecture, setSelectedLecture] = useState(null);

    const [showAddLectureModal, setShowAddLectureModal] = useState(false);
    const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
    const [showDeleteLectureModal, setShowDeleteLectureModal] = useState(false);
    const [showDeleteMaterialModal, setShowDeleteMaterialModal] = useState(false);
    const [materialToDelete, setMaterialToDelete] = useState(null);
    const [materialTypeTab, setMaterialTypeTab] = useState('file');
    const [showCreateQuizModal, setShowCreateQuizModal] = useState(false);

    const fetchLectures = async (options = {}) => {
        const { keepSelection = false } = options;
        const currentSelectedId = selectedLecture?.lectureId;
        setLoading(true);
        try {
            const response = await getClassroomLectures(classroomId);
            const sortedLectures = response.data.sort((a, b) => a.lectureOrder - b.lectureOrder);
            setLectures(sortedLectures);

            let lectureToSelect = null;
            if (sortedLectures.length > 0) {
                if (keepSelection && currentSelectedId) {
                    // ابحث عن المحاضرة المحددة حاليًا في القائمة الجديدة
                    lectureToSelect = sortedLectures.find(l => l.lectureId === currentSelectedId) || sortedLectures[0];
                } else {
                    // إذا لم يكن هناك تحديد مسبق، اختر الأولى
                    lectureToSelect = sortedLectures[0];
                }
            }
            setSelectedLecture(lectureToSelect);

        } catch (error) {
            toast.error("فشل في جلب قائمة المحاضرات.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLectures();
    }, [classroomId]);

    const handleSelectLecture = (lecture) => { setSelectedLecture(lecture); };
    const handleShowAddLectureModal = () => setShowAddLectureModal(true);
    const handleCloseAddLectureModal = () => setShowAddLectureModal(false);
    const handleShowAddMaterialModal = () => setShowAddMaterialModal(true);
    const handleCloseAddMaterialModal = () => { setShowAddMaterialModal(false); setMaterialTypeTab('file'); };
    const handleShowDeleteLectureModal = () => setShowDeleteLectureModal(true);
    const handleCloseDeleteLectureModal = () => setShowDeleteLectureModal(false);
    const handleShowDeleteMaterialModal = (material) => { setMaterialToDelete(material); setShowDeleteMaterialModal(true); };
    const handleCloseDeleteMaterialModal = () => setShowDeleteMaterialModal(false);
    const handleShowCreateQuizModal = () => setShowCreateQuizModal(true);
    const handleCloseCreateQuizModal = () => setShowCreateQuizModal(false);

    const handleAddLecture = async (event) => {
        event.preventDefault();
        const form = event.target;
        const lectureData = { Title: form.elements.title.value, Description: form.elements.description.value, LectureOrder: parseInt(form.elements.lectureOrder.value, 10) };
        try {
            await createLecture(classroomId, lectureData);
            toast.success("تمت إضافة المحاضرة بنجاح.");
            handleCloseAddLectureModal();
            await fetchLectures(); // إعادة تحميل بسيطة
        } catch (error) { toast.error("فشل في إضافة المحاضرة."); }
    };

    const handleConfirmDeleteLecture = async () => {
        if (!selectedLecture) return;
        try {
            await deleteLecture(selectedLecture.lectureId);
            toast.success("تم حذف المحاضرة بنجاح.");
            handleCloseDeleteLectureModal();
            await fetchLectures(); // إعادة تحميل بسيطة
        } catch (error) { toast.error("فشل في حذف المحاضرة."); }
    };

    const handleAddMaterial = async (event) => {
        event.preventDefault();
        if (!selectedLecture) return;
        const formData = new FormData();
        if (materialTypeTab === 'file') {
            const fileInput = event.target.elements.file;
            if (fileInput.files.length === 0) { return toast.warn("الرجاء اختيار ملف أولاً."); }
            formData.append('File', fileInput.files[0]);
            formData.append('Title', fileInput.files[0].name);
        } else {
            formData.append('Title', event.target.elements.linkTitle.value);
            formData.append('Url', event.target.elements.linkUrl.value);
        }
        try {
            await addMaterialToLecture(selectedLecture.lectureId, formData);
            toast.success("تمت إضافة المادة بنجاح.");
            handleCloseAddMaterialModal();
            fetchLectures({ keepSelection: true });
        } catch (error) { toast.error("فشل في إضافة المادة."); }
    };

    const handleConfirmDeleteMaterial = async () => {
        if (!materialToDelete) return;
        try {
            await deleteMaterial(materialToDelete.materialId);
            toast.success("تم حذف المادة بنجاح.");
            handleCloseDeleteMaterialModal();
            fetchLectures({ keepSelection: true });
        } catch (error) { toast.error("فشل في حذف المادة."); }
    };

    const handleCreateQuiz = async (event) => {
        event.preventDefault();
        if (!selectedLecture) return;
        const title = event.target.elements.title.value;
        try {
            const response = await createQuizForLecture(selectedLecture.lectureId, { title });
            toast.success("تم إنشاء الاختبار بنجاح!");
            handleCloseCreateQuizModal();
            history.push(`/teacher/quiz/${response.data.lectureQuizId}/manage`);
        } catch (error) {
             
            const errorMessage = error.response?.data?.message || "فشل في إنشاء الاختبار. يرجى المحاولة مرة أخرى.";
            toast.error(errorMessage);
         }
    };

    const handleDeleteQuiz = async () => {
        if (!selectedLecture?.lectureQuiz) return;
        if (window.confirm("هل أنت متأكد من حذف هذا الاختبار وكل أسئلته؟")) {
            try {
                await deleteQuiz(selectedLecture.lectureQuiz.lectureQuizId);
                toast.success("تم حذف الاختبار بنجاح.");
                fetchLectures({ keepSelection: true }); // إعادة تحميل لتحديث الحالة
            } catch (error) {
                toast.error("فشل في حذف الاختبار.");
            }
        }
    };

    const renderLectureList = () => (
        <Card>
            <Card.Header><Card.Title as="h5">قائمة المحاضرات ({lectures.length})</Card.Title></Card.Header>
            <ListGroup variant="flush" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                {lectures.map(lecture => (
                    <ListGroup.Item key={lecture.lectureId} action active={selectedLecture?.lectureId === lecture.lectureId} onClick={() => handleSelectLecture(lecture)}>
                        {lecture.title}
                        {lecture.lectureQuiz && <i className="fas fa-clipboard-check text-success ml-2" title="يحتوي على اختبار"></i>}
                    </ListGroup.Item>
                ))}
            </ListGroup>
            <Card.Footer className="text-center">
                <Button variant="primary" className="btn-fill w-100" onClick={handleShowAddLectureModal}><i className="fas fa-plus mr-2"></i> محاضرة جديدة</Button>
            </Card.Footer>
        </Card>
    );

    const renderLectureDetails = () => {
        if (!selectedLecture) {
            return (<Card className="h-100"><Card.Body className="d-flex flex-column justify-content-center align-items-center text-center text-muted"><i className="nc-icon nc-paper-2" style={{ fontSize: '4rem', marginBottom: '1rem' }}></i>{lectures.length > 0 ? <h4>الرجاء تحديد محاضرة.</h4> : <h4>لا توجد محاضرات.</h4>}</Card.Body></Card>);
        }
        return (
            <Card>
                <Card.Header>
                    <Row className="align-items-center">
                        <Col><h5 className="mb-0">{selectedLecture.title}</h5><small className="text-muted">نشر في: {new Date(selectedLecture.createdAt).toLocaleDateString('ar-EG')}</small></Col>
                        <Col xs="auto"><Button variant="primary" size="sm" className="ml-2" onClick={handleShowAddMaterialModal}><i className="fas fa-plus"></i> إضافة مادة</Button><Button variant="danger" size="sm" onClick={handleShowDeleteLectureModal}><i className="fas fa-trash"></i> حذف المحاضرة</Button></Col>
                    </Row>
                </Card.Header>
                <Card.Body>
                    <p>{selectedLecture.description || "لا يوجد وصف."}</p>
                    <hr />
                    <h6>المواد التعليمية ({selectedLecture.materials?.length || 0})</h6>
                    {selectedLecture.materials && selectedLecture.materials.length > 0 ? (
                        <ListGroup variant="flush">{selectedLecture.materials.map(material => (
                            <ListGroup.Item key={material.materialId} className="d-flex justify-content-between align-items-center px-0">
                                <div><i className={`fas ${material.materialType === 'File' ? 'fa-file-alt text-info' : 'fa-link text-warning'} mr-2`}></i><span>{material.title}</span></div>
                                <div>
                                    <Button variant="light" size="sm" className="ml-2" onClick={() => { material.materialType === 'Link' ? window.open(material.url, '_blank', 'noopener,noreferrer') : downloadTeacherMaterial(material); }} title={material.materialType === 'File' ? "تحميل" : "فتح"}>
                                        {material.materialType === 'File' ? <i className="fas fa-download"></i> : <i className="fas fa-external-link-alt"></i>}
                                    </Button>
                                    <Button variant="light" size="sm" className="text-danger" title="حذف" onClick={() => handleShowDeleteMaterialModal(material)}><i className="fas fa-times"></i></Button>
                                </div>
                            </ListGroup.Item>))}</ListGroup>
                    ) : (<p className="text-muted">لم يتم إضافة مواد بعد.</p>)}
                </Card.Body>
                <Card.Footer>
                    <Row className="align-items-center">
                        <Col><h6 className="mb-0">الاختبار القصير</h6></Col>
                        <Col xs="auto">
                            {selectedLecture.lectureQuiz ? (
                                <>
                                    <Button as={Link} to={`/teacher/quiz/${selectedLecture.lectureQuiz.lectureQuizId}/manage`} variant="info" size="sm" className="ml-2">
                                        <i className="fas fa-edit mr-1"></i> إدارة الاختبار
                                    </Button>
                                    <Button variant="outline-danger" size="sm" onClick={handleDeleteQuiz}>
                                        <i className="fas fa-trash mr-1"></i> حذف الاختبار
                                    </Button>
                                </>
                            ) : (
                                <Button variant="success" size="sm" onClick={handleShowCreateQuizModal}>
                                    <i className="fas fa-plus mr-1"></i> إنشاء اختبار
                                </Button>
                            )}
                        </Col>
                    </Row>
                </Card.Footer>
            </Card>
        );
    };

    const nextLectureOrder = lectures.length > 0 ? Math.max(...lectures.map(l => l.lectureOrder)) + 1 : 1;

    return (
        <>
            <Container fluid>
                <Row><Col><Breadcrumb listProps={{ className: "bg-transparent p-0" }}><li className="breadcrumb-item"><Link to="/teacher/my-classrooms">فصولي</Link></li><li className="breadcrumb-item"><Link to={`/teacher/classroom/${classroomId}`}>البوابة</Link></li><Breadcrumb.Item active>المحاضرات</Breadcrumb.Item></Breadcrumb></Col></Row>
                <Row className="mb-3 align-items-center"><Col xs="auto"><Button variant="outline-secondary" onClick={() => history.goBack()} title="رجوع"><i className="fas fa-arrow-right"></i></Button></Col><Col><h4 className="title mb-0">إدارة المحاضرات والمواد</h4></Col></Row>
                {loading ? (<div className="text-center py-5"><Spinner animation="border" /><h5 className="mt-3">جاري التحميل...</h5></div>) : (<Row><Col md="4">{renderLectureList()}</Col><Col md="8">{renderLectureDetails()}</Col></Row>)}
            </Container>

            <Modal show={showAddLectureModal} onHide={handleCloseAddLectureModal} centered><Modal.Header closeButton><Modal.Title>إضافة محاضرة جديدة</Modal.Title></Modal.Header><Form onSubmit={handleAddLecture}><Modal.Body><Form.Group><Form.Label>عنوان المحاضرة</Form.Label><Form.Control type="text" name="title" required /></Form.Group><Form.Group className="mt-3"><Form.Label>ترتيب المحاضرة</Form.Label><Form.Control type="number" name="lectureOrder" defaultValue={nextLectureOrder} required min="1" /><Form.Text className="text-muted">سيتم استخدام هذا الرقم لترتيب المحاضرات.</Form.Text></Form.Group><Form.Group className="mt-3"><Form.Label>الوصف (اختياري)</Form.Label><Form.Control as="textarea" rows={3} name="description" /></Form.Group></Modal.Body><Modal.Footer><Button variant="secondary" onClick={handleCloseAddLectureModal}>إلغاء</Button><Button variant="primary" type="submit">إضافة</Button></Modal.Footer></Form></Modal>
            <Modal show={showAddMaterialModal} onHide={handleCloseAddMaterialModal} centered><Modal.Header closeButton><Modal.Title>إضافة مادة إلى: {selectedLecture?.title}</Modal.Title></Modal.Header><Form onSubmit={handleAddMaterial}><Modal.Body><Tabs activeKey={materialTypeTab} onSelect={(k) => setMaterialTypeTab(k)} className="mb-3" fill><Tab eventKey="file" title={<span><i className="fas fa-file-upload"></i> رفع ملف</span>}><Form.Group><Form.Label>اختر الملف</Form.Label><Form.Control name="file" type="file" required={materialTypeTab === 'file'} /></Form.Group></Tab><Tab eventKey="link" title={<span><i className="fas fa-link"></i> إضافة رابط</span>}><Form.Group><Form.Label>عنوان الرابط</Form.Label><Form.Control type="text" name="linkTitle" placeholder="مثال: فيديو شرح" required={materialTypeTab === 'link'} /></Form.Group><Form.Group className="mt-3"><Form.Label>الرابط</Form.Label><Form.Control type="url" name="linkUrl" placeholder="https://example.com" required={materialTypeTab === 'link'} /></Form.Group></Tab></Tabs></Modal.Body><Modal.Footer><Button variant="secondary" onClick={handleCloseAddMaterialModal}>إلغاء</Button><Button variant="primary" type="submit">حفظ</Button></Modal.Footer></Form></Modal>
            <Modal show={showDeleteLectureModal} onHide={handleCloseDeleteLectureModal} centered><Modal.Header closeButton><Modal.Title>تأكيد الحذف</Modal.Title></Modal.Header><Modal.Body>هل أنت متأكد من حذف: <strong>"{selectedLecture?.title}"</strong>؟<br /><span className="text-danger">سيتم حذف جميع المواد والاختبارات المرتبطة بها.</span></Modal.Body><Modal.Footer><Button variant="secondary" onClick={handleCloseDeleteLectureModal}>إلغاء</Button><Button variant="danger" onClick={handleConfirmDeleteLecture}>نعم، حذف</Button></Modal.Footer></Modal>
            <Modal show={showDeleteMaterialModal} onHide={handleCloseDeleteMaterialModal} centered><Modal.Header closeButton><Modal.Title>تأكيد الحذف</Modal.Title></Modal.Header><Modal.Body>هل أنت متأكد من حذف: <strong>"{materialToDelete?.title}"</strong>؟</Modal.Body><Modal.Footer><Button variant="secondary" onClick={handleCloseDeleteMaterialModal}>إلغاء</Button><Button variant="danger" onClick={handleConfirmDeleteMaterial}>نعم، حذف</Button></Modal.Footer></Modal>

            <Modal show={showCreateQuizModal} onHide={handleCloseCreateQuizModal} centered>
                <Modal.Header closeButton><Modal.Title>إنشاء اختبار للمحاضرة</Modal.Title></Modal.Header>
                <Form onSubmit={handleCreateQuiz}>
                    <Modal.Body>
                        <p>أنت على وشك إنشاء اختبار قصير للمحاضرة: <strong>{selectedLecture?.title}</strong></p>
                        <Form.Group>
                            <Form.Label>عنوان الاختبار</Form.Label>
                            <Form.Control type="text" name="title" defaultValue={`اختبار قصير: ${selectedLecture?.title}`} required />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseCreateQuizModal}>إلغاء</Button>
                        <Button variant="primary" type="submit">إنشاء والانتقال لإضافة الأسئلة</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
}

export default LectureManagement;