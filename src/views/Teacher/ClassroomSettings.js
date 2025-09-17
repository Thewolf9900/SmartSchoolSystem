import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useHistory } from "react-router-dom";
import {
    Container, Row, Col, Card, Button, Breadcrumb, Form,
    Spinner, Modal, Alert, ListGroup, Fade
} from "react-bootstrap";
import { toast } from 'react-toastify';
import {
    getClassroomDetails,
    createClassroomAnnouncement,
    toggleClassroomStatus,
    deleteAnnouncement
} from "services/teacher/teacherService";

function ClassroomSettings() {
    const { classroomId } = useParams();
    const history = useHistory();

    const [classroom, setClassroom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const [showContent, setShowContent] = useState(false);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [announcementToDelete, setAnnouncementToDelete] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const response = await getClassroomDetails(classroomId);
            setClassroom(response.data);
        } catch (error) {
            toast.error("فشل في تحميل بيانات الفصل.");
        } finally {
            setLoading(false);
            setShowContent(true);
        }
    }, [classroomId]);

    useEffect(() => {
        setLoading(true);
        fetchData();
    }, [fetchData]);

    const handleCreateAnnouncement = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        const form = event.target;
        const announcementData = {
            Title: form.elements.title.value,
            Content: form.elements.content.value
        };

        try {
            await createClassroomAnnouncement(classroomId, announcementData);
            toast.success("تم إرسال الإعلان بنجاح!");
            form.reset();
            await fetchData();
        } catch (error) {
            toast.error("فشل في إرسال الإعلان.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async () => {
        try {
            var m = await toggleClassroomStatus(classroomId);
            toast.success(m.data.message || "تم تغيير حالة الفصل بنجاح." || m);
            await fetchData();
            setIsToggling(true);

        } catch (error) {
            toast.error(error.response?.data || "فشل في تغيير حالة الفصل.");
        } finally {
            setShowConfirmModal(false);
            setIsToggling(false);
        }
    };

    const handleShowDeleteModal = (announcement) => {
        setAnnouncementToDelete(announcement);
        setShowDeleteModal(true);
    };

    const handleCloseDeleteModal = () => setShowDeleteModal(false);

    const handleConfirmDelete = async () => {
        if (!announcementToDelete) return;
        setIsSubmitting(true);
        try {
            await deleteAnnouncement(announcementToDelete.announcementId);
            toast.success("تم حذف الإعلان بنجاح!");
            handleCloseDeleteModal();
            await fetchData();
        } catch (error) {
            toast.error("فشل في حذف الإعلان.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <Container fluid className="text-center py-5"><Spinner animation="border" /><h5 className="mt-3">جاري التحميل...</h5></Container>;
    }
    if (!classroom) {
        return <Container fluid><Alert variant="danger" className="text-center">فشل في تحميل بيانات الفصل.</Alert></Container>;
    }

    const isClassroomActive = classroom.status === 'ACTIVE';

    return (
        <>
            <Container fluid>
                <Row><Col><Breadcrumb listProps={{ className: "bg-transparent p-0" }}><li className="breadcrumb-item"><Link to="/teacher/my-classrooms">فصولي</Link></li><li className="breadcrumb-item"><Link to={`/teacher/classroom/${classroomId}`}>البوابة</Link></li><Breadcrumb.Item active>الإعدادات والإعلانات</Breadcrumb.Item></Breadcrumb></Col></Row>
                <Row className="mb-3 align-items-center"><Col xs="auto"><Button variant="outline-secondary" onClick={() => history.goBack()} title="رجوع"><i className="fas fa-arrow-right"></i></Button></Col><Col><h4 className="title mb-0">الإعدادات والإعلانات</h4></Col></Row>

                <Fade in={showContent}>
                    <Row>
                        <Col md={6} className="mb-4">
                            <Card className="card-hover h-100">
                                <Card.Header><Card.Title as="h4">إعدادات الفصل</Card.Title></Card.Header>
                                <Card.Body className="d-flex flex-column">
                                    <h5>حالة الفصل الحالية</h5>
                                    <Alert variant={isClassroomActive ? "success" : "secondary"} className="d-flex align-items-center">
                                        {isClassroomActive && <i className="fas fa-cog fa-spin mr-2"></i>}
                                        <span>الفصل حاليًا: <strong>{isClassroomActive ? "نشط" : "مكتمل"}</strong></span>
                                    </Alert>
                                    <hr />
                                    <p className="text-muted flex-grow-1">
                                        {isClassroomActive ? "عند إنهاء الفصل، سيتم أرشفته..." : "إعادة تفعيل الفصل ستسمح لك بالتعديل..."}
                                    </p>
                                    <Button variant={isClassroomActive ? "danger" : "info"} className="btn-fill mt-auto" onClick={() => setShowConfirmModal(true)}>
                                        <i className={`fas ${isClassroomActive ? 'fa-check-circle' : 'fa-history'} mr-2`}></i>
                                        {isClassroomActive ? "إنهاء الفصل الدراسي" : "إعادة تفعيل الفصل"}
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card className="card-hover mb-4">
                                <Card.Header><Card.Title as="h4">إرسال إعلان جديد</Card.Title></Card.Header>
                                <Card.Body>
                                    <Form onSubmit={handleCreateAnnouncement}>
                                        <Form.Group><Form.Label>عنوان الإعلان</Form.Label><Form.Control type="text" name="title" required placeholder="مثال: تذكير بموعد الاختبار" /></Form.Group>
                                        <Form.Group className="mt-3"><Form.Label>محتوى الإعلان</Form.Label><Form.Control as="textarea" rows={4} name="content" required placeholder="اكتب رسالتك للطلاب هنا..." /></Form.Group>
                                        <Button variant="primary" type="submit" className="btn-fill mt-3 w-100" disabled={isSubmitting}>
                                            {isSubmitting ? <Spinner as="span" size="sm" /> : <><i className="fas fa-paper-plane mr-2"></i> إرسال الإعلان</>}
                                        </Button>
                                    </Form>
                                </Card.Body>
                            </Card>
                            <Card className="mt-2">
                                <Card.Header><Card.Title as="h4">سجل الإعلانات</Card.Title></Card.Header>
                                <ListGroup variant="flush" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                    {classroom.announcements.length > 0 ? classroom.announcements.map(a => (
                                        <ListGroup.Item key={a.announcementId} className="d-flex justify-content-between align-items-start">
                                            <div>
                                                <h6 className="font-weight-bold mb-1">{a.title}</h6>
                                                <p className="mb-1 small">{a.content}</p>
                                                <small className="text-muted">{new Date(a.postedAt).toLocaleString('ar-EG')}</small>
                                            </div>
                                            <Button variant="light" size="sm" className="text-danger" title="حذف الإعلان" onClick={() => handleShowDeleteModal(a)}>
                                                <i className="fas fa-times"></i>
                                            </Button>
                                        </ListGroup.Item>
                                    )) : <ListGroup.Item className="text-muted text-center">لا توجد إعلانات سابقة.</ListGroup.Item>}
                                </ListGroup>
                            </Card>
                        </Col>
                    </Row>
                </Fade>
            </Container>

            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>تأكيد الإجراء</Modal.Title></Modal.Header>
                <Modal.Body>هل أنت متأكد من رغبتك في <strong>{isClassroomActive ? "إنهاء" : "إعادة تفعيل"}</strong> هذا الفصل؟</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>إلغاء</Button>
                    <Button variant={isClassroomActive ? "danger" : "info"} onClick={handleToggleStatus} disabled={isToggling}>
                        {isToggling ? <Spinner as="span" size="sm" /> : `نعم، قم بـ ${isClassroomActive ? "الإنهاء" : "التفعيل"}`}
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} centered>
                <Modal.Header closeButton><Modal.Title>تأكيد الحذف</Modal.Title></Modal.Header>
                <Modal.Body>هل أنت متأكد من رغبتك في حذف الإعلان بعنوان: <strong>"{announcementToDelete?.title}"</strong>؟</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseDeleteModal}>إلغاء</Button>
                    <Button variant="danger" onClick={handleConfirmDelete} disabled={isSubmitting}>
                        {isSubmitting ? <Spinner as="span" size="sm" /> : "نعم، قم بالحذف"}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default ClassroomSettings;