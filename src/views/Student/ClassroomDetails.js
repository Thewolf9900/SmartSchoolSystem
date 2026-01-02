import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Row, Col, Spinner, Alert, Accordion, ListGroup, Button, Breadcrumb, Modal } from 'react-bootstrap';
import { getClassroomDetails, getCourseReferenceMaterials } from 'services/student/studentService';
import { viewMaterial } from 'services/shared/materialViewService';
import { toast } from 'react-toastify';
import 'assets/css/custom.css';

// دالة تخمين نوع الملف
const getMimeType = (filename = '') => {
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
        case 'pdf': return 'application/pdf';
        case 'mp4': return 'video/mp4';
        case 'webm': return 'video/webm';
        case 'ogg': return 'video/ogg';
        case 'jpg': case 'jpeg': return 'image/jpeg';
        case 'png': return 'image/png';
        case 'gif': return 'image/gif';
        case 'doc': return 'application/msword';
        case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        default: return 'application/octet-stream';
    }
};

// مكون الفيديو
const SecureVideoPlayer = ({ materialId, title, originalFilename }) => {
    const [videoUrl, setVideoUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let objectUrl = null;
        const fetchVideo = async () => {
            try {
                const response = await viewMaterial(materialId);
                if (!response || !response.data || response.data.size === 0) {
                    toast.error(`خطأ: لا توجد بيانات فيديو من الخادم لـ: ${title}`);
                    return;
                }
                const mimeType = getMimeType(originalFilename);
                const videoBlob = new Blob([response.data], { type: mimeType });
                objectUrl = URL.createObjectURL(videoBlob);
                setVideoUrl(objectUrl);
            } catch (error) {
                toast.error(`فشل في تحميل الفيديو: ${title}`);
            } finally {
                setIsLoading(false);
            }
        };
        fetchVideo();
        return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
    }, [materialId, title, originalFilename]);

    if (isLoading) {
        return <div className="video-placeholder"><Spinner animation="border" variant="primary" /></div>;
    }
    if (!videoUrl) {
        return <Alert variant="danger">تعذر تحميل الفيديو.</Alert>;
    }
    return (
        <div className="video-responsive-wrapper">
            <video controls controlsList="nodownload" className="video-element">
                <source src={videoUrl} type={getMimeType(originalFilename)} />
                متصفحك لا يدعم تشغيل الفيديو.
            </video>
        </div>
    );
};

function ClassroomDetails() {
    const { classroomId } = useParams();
    const [classroom, setClassroom] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionId, setActionId] = useState(null);

    const [showMaterialsModal, setShowMaterialsModal] = useState(false);
    const [courseMaterials, setCourseMaterials] = useState([]);
    const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            setIsLoading(true);
            try {
                const response = await getClassroomDetails(classroomId);
                setClassroom(response.data);
            } catch (err) {
                setError("حدث خطأ أثناء جلب تفاصيل الفصل.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, [classroomId]);

    const handleShowCourseMaterials = async () => {
        if (!classroom?.courseId) return;
        setShowMaterialsModal(true);
        setIsLoadingMaterials(true);
        try {
            const response = await getCourseReferenceMaterials(classroom.courseId);
            setCourseMaterials(response.data);
        } catch (err) {
            toast.error("فشل في جلب مواد المساق.");
        } finally {
            setIsLoadingMaterials(false);
        }
    };

    const handleViewMaterial = async (materialId, originalFilename) => {
        setActionId(materialId);
        try {
            const materialViewUrl = `${process.env.REACT_APP_API_BASE_URL}/api/materials/${materialId}/view`;
            window.open(materialViewUrl, '_blank');
            toast.info("يتم فتح المادة في تبويب جديد...");
        } catch (err) {
            toast.error("فشل في فتح المادة.");
        } finally {
            setActionId(null);
        }
    };

    const isVideo = (filename = '') => /\.(mp4|webm|ogg)$/i.test(filename || '');
    const isPdf = (filename = '') => /\.(pdf)$/i.test(filename || '');

    const renderMaterialItem = (material) => {
        const materialId = material.materialId || material.MaterialId;
        const title = material.title || material.Title;
        const originalFilename = material.originalFilename || material.OriginalFilename;

        if (isVideo(originalFilename)) {
            return (
                <ListGroup.Item key={materialId} as="div" className="material-video-item border-0 mb-3 shadow-sm rounded p-3">
                    <p className="mb-2 font-weight-bold text-dark"><i className="fas fa-video text-info me-2"></i>{title}</p>
                    <SecureVideoPlayer materialId={materialId} title={title} originalFilename={originalFilename} />
                </ListGroup.Item>
            );
        }

        return (
            <ListGroup.Item key={materialId} className="d-flex justify-content-between align-items-center border-0 mb-2 shadow-sm rounded p-3">
                <span className="text-dark font-weight-bold">
                    <i className={`fas ${isPdf(originalFilename) ? 'fa-file-pdf text-danger' : 'fa-file-alt text-secondary'} me-3`}></i>
                    {title}
                </span>
                <Button
                    variant="outline-primary"
                    size="sm"
                    className="rounded-pill px-3"
                    disabled={actionId === materialId}
                    onClick={() => handleViewMaterial(materialId, originalFilename)}
                >
                    {actionId === materialId
                        ? <Spinner as="span" animation="border" size="sm" />
                        : <><i className="fas fa-eye me-1"></i> عرض</>
                    }
                </Button>
            </ListGroup.Item>
        );
    };

    if (isLoading) { return <div className="content d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}><Spinner animation="border" /></div>; }
    if (error) { return <div className="content"><Alert variant="danger">{error}</Alert></div>; }
    if (!classroom) { return <div className="content"><Alert variant="warning">لم يتم العثور على بيانات الفصل.</Alert></div>; }

    return (
        <>
            <div className="content">
                <div className="mb-4 d-flex justify-content-between align-items-center">
                    <div>
                        <h4 className="font-weight-bold mb-1" style={{ color: '#2c3e50' }}>{classroom.courseName}</h4>
                        <Breadcrumb className="bg-transparent p-0 m-0">
                            <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/student/my-classrooms" }}>فصولي الدراسية</Breadcrumb.Item>
                            <Breadcrumb.Item active>{classroom.classroomName}</Breadcrumb.Item>
                        </Breadcrumb>
                    </div>
                </div>

                <Row>
                    <Col md="12" className="mb-4">
                        <Card className="border-0 shadow-sm" style={{ borderRadius: '15px' }}>
                            <Card.Body className="p-4">
                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 border-bottom pb-4">
                                    <div className="d-flex align-items-center mb-3 mb-md-0">
                                        <div className="rounded-circle bg-light d-flex align-items-center justify-content-center mr-3" style={{ width: '60px', height: '60px', color: '#007bff' }}>
                                            <i className="fas fa-book-reader fa-2x"></i>
                                        </div>
                                        <div>
                                            <h5 className="font-weight-bold mb-0 text-dark">مقدمة في قواعد البيانات</h5>
                                            <small className="text-muted">{classroom.classroomName}</small>
                                        </div>
                                    </div>
                                    <Button variant="outline-primary" className="rounded-pill shadow-sm px-4" onClick={handleShowCourseMaterials}>
                                        <i className="fas fa-book-open me-2"></i> عرض مواد المساق
                                    </Button>
                                </div>

                                <Row className="text-center">
                                    <Col md={4} className="mb-3 mb-md-0 border-left">
                                        <p className="mb-1 text-muted small font-weight-bold">الدرجة العملية</p>
                                        <h3 className="fw-bold text-dark">{classroom.practicalGrade || 0} <span className="text-muted h6">/ 100</span></h3>
                                    </Col>
                                    <Col md={4} className="mb-3 mb-md-0 border-left">
                                        <p className="mb-1 text-muted small font-weight-bold">درجة الاختبار</p>
                                        <h3 className="fw-bold text-dark">{classroom.examGrade || 0} <span className="text-muted h6">/ 100</span></h3>
                                    </Col>
                                    <Col md={4}>
                                        <p className="mb-1 text-muted small font-weight-bold">الدرجة النهائية</p>
                                        <h3 className="fw-bold text-primary">{classroom.finalGrade || 0} <span className="text-muted h6">/ 100</span></h3>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md="12">
                        <Card className="border-0 shadow-sm" style={{ borderRadius: '15px' }}>
                            <Card.Header className="bg-white border-0 pt-4 px-4 pb-2" style={{ borderRadius: '15px 15px 0 0' }}>
                                <Card.Title as="h5" className="font-weight-bold text-dark mb-0">المحاضرات والمواد التعليمية</Card.Title>
                            </Card.Header>
                            <Card.Body className="p-4">
                                <Accordion defaultActiveKey="0" alwaysOpen className="custom-accordion">
                                    {classroom.lectures?.length > 0 ? (
                                        classroom.lectures.map((lecture, index) => (
                                            <Accordion.Item eventKey={index.toString()} key={lecture.lectureId} className="border-0 mb-3 shadow-sm rounded overflow-hidden">
                                                <Accordion.Header className="bg-light">
                                                    <span className="font-weight-bold text-primary me-2">المحاضرة {lecture.lectureOrder}:</span>
                                                    <span className="font-weight-bold text-dark">{lecture.title}</span>
                                                </Accordion.Header>
                                                <Accordion.Body className="bg-white p-4">
                                                    {lecture.description && <p className="text-muted mb-4">{lecture.description}</p>}

                                                    {lecture.lectureQuiz && lecture.lectureQuiz.isEnabled && !lecture.lectureQuiz.isSubmitted ? (
                                                        <div className="text-center bg-light rounded p-4 mb-4 border d-flex justify-content-between align-items-center">
                                                            <div className="text-right">
                                                                <h6 className="font-weight-bold mb-1 text-dark">اختبار قصير: {lecture.lectureQuiz.title}</h6>
                                                                <small className="text-muted">قم بإجراء الاختبار لتقييم فهمك</small>
                                                            </div>
                                                            <Button as={Link} to={`/student/take-quiz/${lecture.lectureId}`} variant="success" className="rounded-pill px-4 shadow-sm btn-fill">
                                                                <i className="fas fa-play-circle me-2"></i> بدء الاختبار
                                                            </Button>
                                                        </div>
                                                    ) : lecture.lectureQuiz && lecture.lectureQuiz.isSubmitted ? (
                                                        <div className="text-center bg-light rounded p-4 mb-4 border d-flex justify-content-between align-items-center">
                                                            <div className="text-right">
                                                                <h6 className="font-weight-bold mb-1 text-success">تم إنجاز الاختبار: {lecture.lectureQuiz.title}</h6>
                                                                <small className="text-muted">يمكنك مراجعة نتائجك</small>
                                                            </div>
                                                            <Button as={Link} to={`/student/quiz-result/${lecture.lectureQuiz.submissionId || lecture.lectureQuiz.lectureQuizId}`} variant="info" className="rounded-pill px-4 shadow-sm btn-fill">
                                                                <i className="fas fa-clipboard-check me-2"></i> عرض النتائج
                                                            </Button>
                                                        </div>
                                                    ) : lecture.lectureQuiz && !lecture.lectureQuiz.isEnabled ? (
                                                        <Alert variant="secondary" className="mb-4 rounded shadow-sm border-0">
                                                            <i className="fas fa-lock me-2"></i> الاختبار "{lecture.lectureQuiz.title}" غير متاح حالياً.
                                                        </Alert>
                                                    ) : null}


                                                    {lecture.materials?.length > 0 ? (
                                                        <div>
                                                            <h6 className="font-weight-bold text-muted mb-3 small">المواد المرفقة</h6>
                                                            <ListGroup variant="flush">{lecture.materials.map(renderMaterialItem)}</ListGroup>
                                                        </div>
                                                    ) : <div className="text-center text-muted py-3 bg-light rounded small">لا توجد مواد مرفقة لهذه المحاضرة.</div>}
                                                </Accordion.Body>
                                            </Accordion.Item>
                                        ))
                                    ) : (<div className="text-center py-5 text-muted">لم يتم إضافة أي محاضرات بعد في هذا الفصل.</div>)}
                                </Accordion>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
            <Modal show={showMaterialsModal} onHide={() => setShowMaterialsModal(false)} centered size="lg" className="custom-modal">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="font-weight-bold text-dark">مواد مرجعية لمساق: {classroom?.courseName}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3 pb-4">
                    {isLoadingMaterials ? (
                        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                    ) : courseMaterials.length > 0 ? (
                        <ListGroup variant="flush">{courseMaterials.map(renderMaterialItem)}</ListGroup>
                    ) : (
                        <div className="text-center py-5 text-muted">
                            <i className="fas fa-folder-open fa-3x mb-3 text-secondary opacity-50"></i>
                            <h5>لا توجد مواد مرجعية لهذا المساق.</h5>
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
}

export default ClassroomDetails;