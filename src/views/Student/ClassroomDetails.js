import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Row, Col, Spinner, Alert, Accordion, ListGroup, Button, Breadcrumb, Modal } from 'react-bootstrap';
import { getClassroomDetails, downloadMaterial, getCourseReferenceMaterials } from 'services/student/studentService';
import { toast } from 'react-toastify';

function ClassroomDetails() {
    const { classroomId } = useParams();
    const [classroom, setClassroom] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);

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
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, [classroomId]);

    const handleShowCourseMaterials = async () => {
        if (!classroom?.courseId) {
            toast.error("لا يمكن جلب المواد، معرّف المساق غير متوفر.");
            return;
        }
        setShowMaterialsModal(true);
        setIsLoadingMaterials(true);
        try {
            const response = await getCourseReferenceMaterials(classroom.courseId);
            setCourseMaterials(response.data);
        } catch (err) {
            toast.error("فشل في جلب مواد المساق.");
            console.error(err);
        } finally {
            setIsLoadingMaterials(false);
        }
    };

    // ✨ الإصلاح هنا: الدالة الآن تفهم كلا الشكلين (PascalCase و camelCase)
    const handleDownload = async (material) => {
        const materialId = material.materialId || material.MaterialId;
        const originalFilename = material.originalFilename || material.OriginalFilename;

        setDownloadingId(materialId);
        try {
            const response = await downloadMaterial(materialId);
            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', originalFilename || `material-${materialId}`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success("تم بدء تحميل الملف بنجاح.");
        } catch (err) {
            toast.error("فشل تحميل الملف.");
            console.error(err);
        } finally {
            setDownloadingId(null);
        }
    };

    if (isLoading) { return <div className="content d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}><Spinner animation="border" /></div>; }
    if (error) { return <div className="content"><Alert variant="danger">{error}</Alert></div>; }
    if (!classroom) { return <div className="content"><Alert variant="warning">لم يتم العثور على بيانات الفصل.</Alert></div>; }

    // ✨ الإصلاح هنا: الدالة الآن تفهم كلا الشكلين (PascalCase و camelCase)
    const renderMaterialItem = (material) => {
        const materialId = material.materialId || material.MaterialId;
        const materialType = material.materialType || material.MaterialType;
        const title = material.title || material.Title;
        const url = material.url || material.Url;

        return (
            <ListGroup.Item key={materialId} className="d-flex justify-content-between align-items-center px-1">
                {materialType === 'Link' ? (
                    <span><i className="fas fa-link text-primary me-2"></i>{title}</span>
                ) : (
                    <span><i className="fas fa-file-alt text-danger me-2"></i>{title}</span>
                )}

                {materialType === 'Link' && url ? (
                    <Button as="a" href={url} target="_blank" rel="noopener noreferrer" variant="outline-primary" size="sm">
                        <i className="fas fa-external-link-alt me-1"></i> فتح الرابط
                    </Button>
                ) : materialType === 'File' ? (
                    <Button
                        variant="outline-info"
                        size="sm"
                        disabled={downloadingId === materialId}
                        onClick={() => handleDownload(material)}
                        title="تحميل الملف"
                    >
                        {downloadingId === materialId
                            ? <Spinner as="span" animation="border" size="sm" />
                            : <><i className="fas fa-download me-1"></i> تحميل</>
                        }
                    </Button>
                ) : null}
            </ListGroup.Item>
        );
    };

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
                                    <div><Button variant="outline-primary" onClick={handleShowCourseMaterials} disabled={!classroom.courseId} title={!classroom.courseId ? "معرّف المساق غير متوفر حاليًا" : "عرض المواد المرجعية للمساق"}><i className="fas fa-book-open me-2"></i> عرض مواد المساق</Button></div>
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
                                    {classroom.lectures && classroom.lectures.length > 0 ? (
                                        classroom.lectures.map((lecture, index) => (
                                            <Accordion.Item eventKey={index.toString()} key={lecture.lectureId}>
                                                <Accordion.Header>
                                                    <span className="fw-bold">المحاضرة {lecture.lectureOrder}:</span>
                                                    <span className="ms-2">{lecture.title}</span>
                                                </Accordion.Header>
                                                <Accordion.Body>
                                                    <div className="text-center border-bottom pb-3 mb-3">{/* Quiz Logic */}</div>
                                                    <p className="mb-3">{lecture.description}</p>
                                                    {lecture.materials && lecture.materials.length > 0 && (
                                                        <ListGroup variant="flush">
                                                            {lecture.materials.map(renderMaterialItem)}
                                                        </ListGroup>
                                                    )}
                                                </Accordion.Body>
                                            </Accordion.Item>
                                        ))
                                    ) : (<Alert variant="info">لم يتم إضافة أي محاضرات.</Alert>)}
                                </Accordion>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>

            <Modal show={showMaterialsModal} onHide={() => setShowMaterialsModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>مواد مرجعية لمساق: {classroom?.courseName}</Modal.Title></Modal.Header>
                <Modal.Body>
                    {isLoadingMaterials ? (
                        <div className="text-center"><Spinner animation="border" /></div>
                    ) : courseMaterials.length > 0 ? (
                        <ListGroup variant="flush">
                            {courseMaterials.map(renderMaterialItem)}
                        </ListGroup>
                    ) : (<Alert variant="info">لا توجد مواد مرجعية.</Alert>)}
                </Modal.Body>
            </Modal>
        </>
    );
}

export default ClassroomDetails;