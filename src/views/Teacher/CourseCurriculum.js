import React, { useState, useMemo } from "react";
import {
    Container, Row, Col, Card, Button, Spinner,
    Accordion, ListGroup, Alert
} from "react-bootstrap";
import { toast } from 'react-toastify';
import { useTeacherData } from "contexts/TeacherDataContext";
import {
    getCourseReferenceMaterials,
    downloadTeacherMaterial // <-- 1. استيراد دالة التحميل الجديدة
} from "services/teacher/teacherService";

function CourseCurriculum() {
    const { classrooms, loading: loadingContext } = useTeacherData();

    const uniqueCourses = useMemo(() => {
        if (loadingContext || !classrooms) return [];
        const coursesMap = new Map();
        classrooms.forEach(classroom => {
            if (!coursesMap.has(classroom.courseId)) {
                coursesMap.set(classroom.courseId, {
                    courseId: classroom.courseId,
                    courseName: classroom.courseName,
                    programName: classroom.academicProgramName,
                });
            }
        });
        return Array.from(coursesMap.values());
    }, [classrooms, loadingContext]);

    const [materialsCache, setMaterialsCache] = useState({});
    const [loadingMaterialId, setLoadingMaterialId] = useState(null);

    const handleAccordionToggle = async (courseId) => {
        if (materialsCache[courseId]) return;

        setLoadingMaterialId(courseId);
        try {
            const response = await getCourseReferenceMaterials(courseId);
            setMaterialsCache(prevCache => ({
                ...prevCache,
                [courseId]: response.data
            }));
        } catch (error) {
            toast.error(`فشل في جلب مواد دورة: ${uniqueCourses.find(c => c.courseId === courseId)?.courseName}`);
            console.error("Failed to fetch course materials", error);
        } finally {
            setLoadingMaterialId(null);
        }
    };

 
    const renderContent = () => {
        if (loadingContext) {
            return <div className="text-center py-5"><Spinner animation="border" /><h5 className="mt-3">جاري تحميل بيانات الدورات...</h5></div>;
        }
        if (uniqueCourses.length === 0) {
            return <Alert variant="info" className="text-center">لا توجد دورات مسندة إليك حاليًا لعرض مناهجها.</Alert>;
        }

        return (
            <Accordion>
                {uniqueCourses.map(course => (
                    <Card as={Accordion.Item} eventKey={course.courseId.toString()} key={course.courseId} className="mb-2 card-hover">
                        <Card.Header as={Accordion.Header} onClick={() => handleAccordionToggle(course.courseId)}>
                            <div className="w-100">
                                <h5 className="mb-0">{course.courseName}</h5>
                                <small className="text-muted">{course.programName}</small>
                            </div>
                        </Card.Header>
                        <Accordion.Body>
                            <Card.Body>
                                {loadingMaterialId === course.courseId ? (
                                    <div className="text-center"><Spinner size="sm" /> <span>جاري تحميل المواد...</span></div>
                                ) : (
                                    materialsCache[course.courseId] && materialsCache[course.courseId].length > 0 ? (
                                        <ListGroup variant="flush">
                                            {materialsCache[course.courseId].map(material => (
                                                <ListGroup.Item key={material.materialId} className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <i className={`fas ${material.materialType === 'File' ? 'fa-file-pdf text-danger' : 'fa-link text-primary'} mr-2`}></i>
                                                        {material.title}

                                                        {material.description && (
                                                            <small className="d-block text-muted mt-1">{material.description}</small>
                                                        )}

                                                    </div>
                                                     <Button variant="outline-secondary" size="sm" onClick={() => {
                                                        if (material.materialType === 'Link') {
                                                            window.open(material.url, '_blank', 'noopener,noreferrer');
                                                        } else {
                                                            downloadTeacherMaterial(material);
                                                        }
                                                    }}>
                                                        {material.materialType === 'File' ? 'تحميل' : 'فتح الرابط'} <i className="fas fa-arrow-circle-down ml-1"></i>
                                                    </Button>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    ) : (
                                        <p className="text-muted text-center">لا توجد مواد مرجعية لهذه الدورة.</p>
                                    )
                                )}
                            </Card.Body>
                        </Accordion.Body>
                    </Card>
                ))}
            </Accordion>
        );
    };

    return (
        <>
            <Container fluid>
                <Row><Col><h4 className="title mb-0">المناهج الدراسية</h4><p className="category">المواد المرجعية المعتمدة للدورات التي تقوم بتدريسها.</p></Col></Row>
                <Row className="mt-4"><Col md="12">{renderContent()}</Col></Row>
            </Container>
        </>
    );
}

export default CourseCurriculum;