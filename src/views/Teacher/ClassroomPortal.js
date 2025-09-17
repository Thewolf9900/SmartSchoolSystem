import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Breadcrumb, Button, Modal, Form, ListGroup } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { getClassroomDetails, createClassroomAnnouncement } from 'services/teacher/teacherService';

function ClassroomPortal() {
    const { classroomId } = useParams();
    const [classroom, setClassroom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAnnounceModal, setShowAnnounceModal] = useState(false);

    const fetchClassroomData = async () => {
        try {
            const response = await getClassroomDetails(classroomId);
            setClassroom(response.data);
        } catch (error) {
            toast.error("فشل في جلب بيانات الفصل الدراسي.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchClassroomData();
    }, [classroomId]);

    const handleShowAnnounceModal = () => setShowAnnounceModal(true);
    const handleCloseAnnounceModal = () => setShowAnnounceModal(false);

    const handleCreateAnnouncement = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const content = form.elements.content.value;
        const title = form.elements.title.value;

        try {
            await createClassroomAnnouncement(classroomId, { title, content });
            toast.success("تم إرسال الإعلان بنجاح!");
            handleCloseAnnounceModal();
            fetchClassroomData();
        } catch (error) {
            toast.error("فشل في إرسال الإعلان.");
        }
    };

    if (loading || !classroom) {
        return (
            <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
                <Spinner animation="border" variant="primary" />
                <h4 className="mr-3">جاري تحميل بيانات الفصل...</h4>
            </Container>
        );
    }

    const statsCards = [
        { icon: "fas fa-users text-info", title: "الطلاب المسجلون", value: `${classroom.enrolledStudentsCount} / ${classroom.capacity}` },
        { icon: "fas fa-book-open text-success", title: "إجمالي المحاضرات", value: classroom.lectureCount },
        { icon: `fas ${classroom.status === 'ACTIVE' ? 'fa-cog fa-spin' : 'fa-check-circle'} text-warning`, title: "حالة الفصل", value: classroom.status === 'ACTIVE' ? 'نشط' : 'مكتمل' }
    ];

    const managementLinks = [
        { to: `/teacher/classroom/${classroomId}/lectures`, icon: "nc-icon nc-paper-2 text-primary", title: "المحاضرات والمواد", description: "إضافة وتعديل المواد التعليمية والواجبات." },
        { to: `/teacher/classroom/${classroomId}/grading`, icon: "nc-icon nc-chart-bar-32 text-success", title: "الطلاب والدرجات", description: "رصد الدرجات، عرض قائمة الطلاب، وحساب النتائج." },
        { to: `/teacher/classroom/${classroomId}/settings`, icon: "nc-icon nc-settings-gear-64 text-danger", title: "الإعدادات العامة", description: "تغيير حالة الفصل وغيرها من الإعدادات." }
    ];

    return (
        <>
            <Container fluid>
                <Row>
                    <Col>
                        {/* --- هذا هو الإصلاح النهائي --- */}
                        <Breadcrumb listProps={{ className: "bg-transparent p-0" }}>
                            <li className="breadcrumb-item">
                                <Link to="/teacher/my-classrooms">فصولي الدراسية</Link>
                            </li>
                            <Breadcrumb.Item active>بوابة إدارة الفصل</Breadcrumb.Item>
                        </Breadcrumb>
                        <h2 className="font-weight-bold mb-0">{classroom.name}</h2>
                        <p className="text-muted">{classroom.courseName} - {classroom.programName}</p>
                    </Col>
                </Row>
                <Row className="mt-3">
                    {statsCards.map((stat, index) => (<Col lg="4" sm="6" key={index}><Card className="card-stats"><Card.Body><Row><Col xs="5"><div className="icon-big text-center icon-warning"><i className={stat.icon}></i></div></Col><Col xs="7"><div className="numbers"><p className="card-category">{stat.title}</p><Card.Title as="h4">{stat.value}</Card.Title></div></Col></Row></Card.Body></Card></Col>))}
                </Row>
                <Row className="mt-3">
                    <Col md="8"><Card><Card.Header><Card.Title as="h4">مهام الإدارة الأساسية</Card.Title></Card.Header><Card.Body><Row>{managementLinks.map((link, index) => (<Col md="6" key={index} className="mb-3"><Link to={link.to} className="text-decoration-none"><div className="card-hover-2 p-4 border rounded text-center h-100 d-flex flex-column justify-content-center"><i className={`${link.icon} mb-3`} style={{ fontSize: '2.5rem' }}></i><h5 className="font-weight-bold mb-1">{link.title}</h5><p className="text-muted small">{link.description}</p></div></Link></Col>))}</Row></Card.Body></Card></Col>
                    <Col md="4"><Card className="card-tasks"><Card.Header><Card.Title as="h4">أحدث الإعلانات</Card.Title></Card.Header><Card.Body className="p-0"><ListGroup variant="flush" style={{ maxHeight: '300px', overflowY: 'auto' }}>{classroom.announcements && classroom.announcements.length > 0 ? (classroom.announcements.map(announce => (<ListGroup.Item key={announce.announcementId}><h6 className="font-weight-bold mb-1">{announce.title}</h6><p className="mb-1 small">{announce.content}</p><small className="text-muted">{new Date(announce.postedAt).toLocaleString('ar-EG')}</small></ListGroup.Item>))) : (<ListGroup.Item className="text-center text-muted">لا توجد إعلانات بعد.</ListGroup.Item>)}</ListGroup></Card.Body><Card.Footer><Button variant="primary" className="btn-fill w-100" onClick={handleShowAnnounceModal}><i className="fas fa-plus mr-2"></i> إنشاء إعلان</Button></Card.Footer></Card></Col>
                </Row>
            </Container>
            <Modal show={showAnnounceModal} onHide={handleCloseAnnounceModal} centered>
                <Modal.Header closeButton><Modal.Title>إنشاء إعلان جديد</Modal.Title></Modal.Header>
                <Form onSubmit={handleCreateAnnouncement}><Modal.Body><Form.Group><Form.Label>عنوان الإعلان</Form.Label><Form.Control type="text" name="title" placeholder="مثال: تذكير بموعد الاختبار" required /></Form.Group><Form.Group className="mt-3"><Form.Label>محتوى الإعلان</Form.Label><Form.Control as="textarea" rows={4} name="content" placeholder="اكتب إعلانك هنا..." required /></Form.Group></Modal.Body><Modal.Footer><Button variant="secondary" onClick={handleCloseAnnounceModal}>إلغاء</Button><Button variant="primary" type="submit" className="btn-fill">إرسال الإعلان</Button></Modal.Footer></Form>
            </Modal>
        </>
    );
}
export default ClassroomPortal;