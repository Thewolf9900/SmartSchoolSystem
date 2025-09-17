import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
    Container, Row, Col, Card, Button, Spinner,
    Alert, Fade, ListGroup, Badge
} from "react-bootstrap";
import { useTeacherData } from "contexts/TeacherDataContext";
import { getAllAnnouncements } from "services/teacher/teacherService";

function TeacherDashboard() {
    const { classrooms, loading: loadingContext } = useTeacherData();
    const [announcements, setAnnouncements] = useState([]);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
    const [showContent, setShowContent] = useState(false);

    // --- بدأ التعديل هنا: تعريف دالة الجلب باستخدام useCallback ---
    const fetchAnnouncements = useCallback(async () => {
        setLoadingAnnouncements(true);
        try {
            const response = await getAllAnnouncements();
            setAnnouncements(response.data);
        } catch (error) {
            console.error("Failed to fetch announcements", error);
        } finally {
            setLoadingAnnouncements(false);
        }
    }, []); // مصفوفة فارغة لأن الدالة لا تعتمد على أي شيء

    // --- تحديث useEffect ليقوم بالجلب عند التركيز ---
    useEffect(() => {
        // الجلب الأولي عند تحميل المكون
        fetchAnnouncements();

        // إضافة مستمع لحدث "focus" على النافذة
        window.addEventListener('focus', fetchAnnouncements);

        // دالة التنظيف: إزالة المستمع عند مغادرة الصفحة لمنع تسرب الذاكرة
        return () => {
            window.removeEventListener('focus', fetchAnnouncements);
        };
    }, [fetchAnnouncements]); // الاعتماد على الدالة المعرفة بـ useCallback

    // ... بقية الكود يبقى كما هو تمامًا ...
    const filteredAnnouncements = useMemo(() => {
        if (!announcements || announcements.length === 0) return [];
        if (loadingContext) {
            return announcements
                .filter(a => a.targetScope === 0)
                .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
        }

        const teacherClassroomIds = new Set(classrooms.map(c => Number(c.classroomId)));
        const teacherCourseIds = new Set(classrooms.map(c => Number(c.courseId)));
        const teacherProgramIds = new Set(classrooms.map(c => Number(c.academicProgramId)));

        return announcements
            .filter(a => {
                const targetId = Number(a.targetId);
                switch (a.targetScope) {
                    case 0: return true;
                    case 1: return teacherProgramIds.has(targetId);
                    case 2: return teacherCourseIds.has(targetId);
                    case 3: return teacherClassroomIds.has(targetId);
                    default: return false;
                }
            })
            .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
    }, [announcements, classrooms, loadingContext]);

    const stats = useMemo(() => {
        if (loadingContext || !classrooms) return { activeCount: 0, completedCount: 0, totalStudents: 0 };
        const active = classrooms.filter(c => c.status === 'ACTIVE');
        return {
            activeCount: active.length,
            completedCount: classrooms.length - active.length,
            totalStudents: classrooms.reduce((sum, c) => sum + c.enrolledStudentsCount, 0)
        };
    }, [classrooms, loadingContext]);

    const activeClassrooms = useMemo(() => classrooms ? classrooms.filter(c => c.status === 'ACTIVE') : [], [classrooms]);

    useEffect(() => {
        if (!loadingContext) {
            const timer = setTimeout(() => setShowContent(true), 100);
            return () => clearTimeout(timer);
        }
    }, [loadingContext]);

    if (loadingContext) {
        return (
            <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
                <Spinner animation="border" variant="primary" />
                <h4 className="mr-3">جاري التحميل...</h4>
            </Container>
        );
    }

    return (
        <Container fluid>
            <Fade in={showContent}>
                <div>
                    <Row>
                        <Col lg="4" sm="6"><Card className="card-stats card-hover"><Card.Body><Row><Col xs="5"><div className="icon-big text-center"><i className="nc-icon nc-tv-2 text-primary"></i></div></Col><Col xs="7"><div className="numbers"><p className="card-category">الفصول النشطة</p><Card.Title as="h4">{stats.activeCount}</Card.Title></div></Col></Row></Card.Body></Card></Col>
                        <Col lg="4" sm="6"><Card className="card-stats card-hover"><Card.Body><Row><Col xs="5"><div className="icon-big text-center"><i className="nc-icon nc-check-2 text-secondary"></i></div></Col><Col xs="7"><div className="numbers"><p className="card-category">الفصول المكتملة</p><Card.Title as="h4">{stats.completedCount}</Card.Title></div></Col></Row></Card.Body></Card></Col>
                        <Col lg="4" sm="6"><Card className="card-stats card-hover"><Card.Body><Row><Col xs="5"><div className="icon-big text-center"><i className="nc-icon nc-circle-09 text-success"></i></div></Col><Col xs="7"><div className="numbers"><p className="card-category">إجمالي الطلاب</p><Card.Title as="h4">{stats.totalStudents}</Card.Title></div></Col></Row></Card.Body></Card></Col>
                    </Row>
                    <Row className="mt-4">
                        <Col md="12">
                            <Card>
                                <Card.Header><Row className="align-items-center"><Col><Card.Title as="h4">الوصول السريع للفصول النشطة</Card.Title></Col><Col xs="auto"><Button as={Link} to="/teacher/my-classrooms" variant="outline-primary" size="sm">عرض كل الفصول</Button></Col></Row></Card.Header>
                                <Card.Body>
                                    {activeClassrooms.length > 0 ? (
                                        <Row>
                                            {activeClassrooms.slice(0, 6).map(c => (<Col lg="4" md="6" key={c.classroomId} className="mb-3">
                                                <Card className="h-100 card-hover-2"><Card.Body><h5 className="mb-1">{c.name}</h5><p className="card-category text-muted">{c.courseName}</p><div className="d-flex justify-content-between align-items-center mt-3"><span><i className="fas fa-users text-info mr-2"></i> {c.enrolledStudentsCount} طالب</span><Button as={Link} to={`/teacher/classroom/${c.classroomId}`} variant="primary" size="sm" className="btn-fill">إدارة</Button></div></Card.Body></Card>
                                            </Col>))}
                                        </Row>
                                    ) : (<Alert variant="info" className="text-center">لا توجد لديك فصول نشطة حاليًا.</Alert>)}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                    <Row className="mt-4">
                        <Col md="12">
                            <Card>
                                <Card.Header><Card.Title as="h4">لوحة الإعلانات</Card.Title></Card.Header>
                                <Card.Body>
                                    {loadingAnnouncements ? <div className="text-center p-3"><Spinner size="sm" /></div> :
                                        filteredAnnouncements.length > 0 ? (
                                            <ListGroup variant="flush">
                                                {filteredAnnouncements.slice(0, 5).map(a => (
                                                    <ListGroup.Item key={a.announcementId} className="px-0">
                                                        <div className="d-flex justify-content-between">
                                                            <h6 className="font-weight-bold mb-1">{a.title}</h6>
                                                            <Badge bg={a.targetScope === 0 ? 'danger' : a.targetScope === 1 ? 'warning' : a.targetScope === 2 ? 'primary' : 'info'} pill>
                                                                {a.targetName}
                                                            </Badge>
                                                        </div>
                                                        <p className="mb-1 small">{a.content}</p>
                                                        <small className="text-muted">{new Date(a.postedAt).toLocaleString('ar-EG')}</small>
                                                    </ListGroup.Item>
                                                ))}
                                            </ListGroup>
                                        ) : <p className="text-muted text-center p-3">لا توجد إعلانات جديدة.</p>
                                    }
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </Fade>
        </Container>
    );
}

export default TeacherDashboard;