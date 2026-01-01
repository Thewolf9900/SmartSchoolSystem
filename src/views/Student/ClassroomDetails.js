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
                <ListGroup.Item key={materialId} as="div" className="material-video-item">
                    <p className="mb-2"><i className="fas fa-video text-info me-2"></i><strong>{title}</strong></p>
                    <SecureVideoPlayer materialId={materialId} title={title} originalFilename={originalFilename} />
                </ListGroup.Item>
            );
        }

        return (
            <ListGroup.Item key={materialId} className="d-flex justify-content-between align-items-center">
                <span>
                    <i className={`fas ${isPdf(originalFilename) ? 'fa-file-pdf text-danger' : 'fa-file-alt text-secondary'} me-2`}></i>
                    {title}
                </span>
                <Button
                    variant="outline-primary"
                    size="sm"
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
                <Breadcrumb listProps={{ className: "bg-transparent p-0" }}>
                    <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/student/my-classrooms" }}>فصولي الدراسية</Breadcrumb.Item>
                    <Breadcrumb.Item active>{classroom.classroomName}</Breadcrumb.Item>
                </Breadcrumb>
                <Row>
                    <Col md="12" className="mb-4">
                        <Card className="str-card">
                            <Card.Header>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div><Card.Title as="h4">{classroom.courseName}</Card.Title><p className="card-category">{classroom.classroomName}</p></div>
                                    <Button variant="outline-primary" onClick={handleShowCourseMaterials}><i className="fas fa-book-open me-2"></i> عرض مواد المساق</Button>
                                </div>
                            </Card.Header>
                            <Card.Body>
                                <Row className="text-center">
                                    <Col><p className="mb-1 text-muted">الدرجة العملية</p><h4 className="fw-bold">{classroom.practicalGrade || 0} <small>/ 100</small></h4></Col>
                                    <Col><p className="mb-1 text-muted">درجة الاختبار</p><h4 className="fw-bold">{classroom.examGrade || 0} <small>/ 100</small></h4></Col>
                                    <Col><p className="mb-1 text-muted">الدرجة النهائية</p><h4 className="fw-bold text-primary">{classroom.finalGrade || 0} <small>/ 100</small></h4></Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md="12">
                        <Card className="str-card">
                            <Card.Header><Card.Title as="h4">المحاضرات والمواد التعليمية</Card.Title></Card.Header>
                            <Card.Body>
                                <Accordion defaultActiveKey="0" alwaysOpen>
                                    {classroom.lectures?.length > 0 ? (
                                        classroom.lectures.map((lecture, index) => (
                                            <Accordion.Item eventKey={index.toString()} key={lecture.lectureId}>
                                                <Accordion.Header>
                                                    <span className="fw-bold">المحاضرة {lecture.lectureOrder}:</span><span className="ms-2">{lecture.title}</span>
                                                </Accordion.Header>
                                                <Accordion.Body>
                                                    <p className="mb-3">{lecture.description}</p>

                                                    {/* --- هنا التعديل الحاسم: نرسل lecture.lectureId --- */}
                                                    {lecture.lectureQuiz && lecture.lectureQuiz.isEnabled && !lecture.lectureQuiz.isSubmitted ? (
                                                        <div className="text-center border-bottom pb-3 mb-3">
                                                            <Button as={Link} to={`/student/take-quiz/${lecture.lectureId}`}  variant="success">
                                                                <i className="fas fa-play-circle me-1"></i> بدء الاختبار: {lecture.lectureQuiz.title}
                                                            </Button>
                                                        </div>
                                                    ) : lecture.lectureQuiz && lecture.lectureQuiz.isSubmitted ? (
                                                        <div className="text-center border-bottom pb-3 mb-3">
                                                            {/* إذا كان هناك submissionId، نستخدمه لصفحة النتائج */}
                                                            <Button as={Link} to={`/student/quiz-result/${lecture.lectureQuiz.submissionId || lecture.lectureQuiz.lectureQuizId}`} variant="info">
                                                                <i className="fas fa-clipboard-check me-1"></i> تم إنجاز الاختبار
                                                            </Button>
                                                        </div>
                                                    ) : lecture.lectureQuiz && !lecture.lectureQuiz.isEnabled ? (
                                                        <div className="text-center border-bottom pb-3 mb-3">
                                                            <Alert variant="secondary" className="my-2">
                                                                <i className="fas fa-ban me-1"></i> الاختبار غير متاح حالياً.
                                                            </Alert>
                                                        </div>
                                                    ) : null}


                                                    {lecture.materials?.length > 0 ? (
                                                        <ListGroup variant="flush">{lecture.materials.map(renderMaterialItem)}</ListGroup>
                                                    ) : <p className="text-muted text-center my-3">لا توجد مواد مرفقة لهذه المحاضرة.</p>}
                                                </Accordion.Body>
                                            </Accordion.Item>
                                        ))
                                    ) : (<Alert variant="info">لم يتم إضافة أي محاضرات بعد في هذا الفصل.</Alert>)}
                                </Accordion>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
            <Modal show={showMaterialsModal} onHide={() => setShowMaterialsModal(false)} centered size="lg">
                <Modal.Header closeButton><Modal.Title>مواد مرجعية لمساق: {classroom?.courseName}</Modal.Title></Modal.Header>
                <Modal.Body>
                    {isLoadingMaterials ? (<div className="text-center"><Spinner /></div>) : courseMaterials.length > 0 ? (<ListGroup variant="flush">{courseMaterials.map(renderMaterialItem)}</ListGroup>) : (<Alert variant="info">لا توجد مواد مرجعية لهذا المساق.</Alert>)}
                </Modal.Body>
            </Modal>
        </>
    );
}

export default ClassroomDetails;