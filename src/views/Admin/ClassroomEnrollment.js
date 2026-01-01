import React, { useState, useEffect } from 'react';
import {
    Container,
    Row,
    Col,
    Card,
    ListGroup,
    FormControl,
    Button,
    Spinner,
    Modal,
    Form,
    Alert,
    ProgressBar, // <-- التأكد من استيراد ProgressBar
} from 'react-bootstrap';
import { toast } from 'react-toastify';

// استيراد جميع الخدمات المطلوبة
import * as programService from 'services/admin/programService.js';
import * as courseService from 'services/admin/courseService.js';
import * as userService from 'services/admin/userService.js';
import * as enrollmentService from 'services/admin/enrollmentService.js';

function ClassroomEnrollment() {
    const [programs, setPrograms] = useState([]);
    const [courses, setCourses] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [selectedProgramId, setSelectedProgramId] = useState(null);
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [selectedClassroomId, setSelectedClassroomId] = useState(null);
    const [selectedTeacherId, setSelectedTeacherId] = useState('');
    const [loading, setLoading] = useState({ programs: true, courses: false, classrooms: false, enrollment: false, teachers: true });
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [studentToTransfer, setStudentToTransfer] = useState(null);
    const [newClassroomId, setNewClassroomId] = useState('');

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [programsRes, teachersRes] = await Promise.all([programService.getPrograms(), userService.getTeachers()]);
                setPrograms(programsRes.data);
                setTeachers(teachersRes.data);
            } catch (error) { toast.error("فشل تحميل البيانات الأولية."); }
            finally { setLoading(prev => ({ ...prev, programs: false, teachers: false })); }
        };
        fetchInitialData();
    }, []);

    const handleProgramSelect = async (programId) => {
        setSelectedProgramId(programId);
        setSelectedCourseId(null); setSelectedClassroomId(null);
        setClassrooms([]); setCourses([]);
        setLoading(prev => ({ ...prev, courses: true }));
        try {
            const res = await programService.getCoursesForProgram(programId);
            setCourses(res.data);
        } catch { toast.error("فشل جلب الدورات."); }
        finally { setLoading(prev => ({ ...prev, courses: false })); }
    };

    const handleCourseSelect = async (courseId) => {
        setSelectedCourseId(courseId);
        setSelectedClassroomId(null);
        setLoading(prev => ({ ...prev, classrooms: true }));
        try {
            const res = await courseService.getClassroomsForCourse(courseId);
            setClassrooms(res.data);
        } catch { toast.error("فشل جلب الفصول."); }
        finally { setLoading(prev => ({ ...prev, classrooms: false })); }
    };

    const handleClassroomSelect = async (classroomId) => {
        setSelectedClassroomId(classroomId);
        setLoading(prev => ({ ...prev, enrollment: true }));
        try {
            const [enrolledRes, availableRes] = await Promise.all([
                enrollmentService.getEnrolledStudentsForClassroom(classroomId),
                courseService.getAvailableStudentsForCourse(selectedCourseId)
            ]);
            setEnrolledStudents(enrolledRes.data);
            setAvailableStudents(availableRes.data);
        } catch (error) {
            toast.error("فشل جلب بيانات التسجيل.");
            console.error(error);
        } finally {
            setLoading(prev => ({ ...prev, enrollment: false }));
        }
    };

    const handleEnroll = async (student) => {
        try {
            await enrollmentService.enrollStudentInClassroom({ studentId: student.userId, classroomId: selectedClassroomId });
            toast.success(`تم تسجيل ${student.firstName}`);
            handleClassroomSelect(selectedClassroomId);
        } catch (error) { toast.error(error.response?.data?.message || "فشل التسجيل."); }
    };

    const handleUnenroll = async (enrollment) => {
        try {
            await enrollmentService.unenrollStudentFromClassroom(enrollment.enrollmentId);
            toast.warn(`تم إلغاء تسجيل ${enrollment.studentName}`);
            handleClassroomSelect(selectedClassroomId);
        } catch (error) { toast.error("فشل إلغاء التسجيل." + error.response.data); }
    };

    const handleShowTransferModal = (enrollment) => {
        setStudentToTransfer(enrollment);
        setShowTransferModal(true);
    };
    const handleCloseTransferModal = () => {
        setShowTransferModal(false);
        setStudentToTransfer(null);
        setNewClassroomId('');
    };

    const handleConfirmTransfer = async () => {
        if (!newClassroomId) return toast.warn("يرجى اختيار فصل جديد.");
        try {
            await enrollmentService.transferStudent(studentToTransfer.enrollmentId, newClassroomId);
            toast.success(`تم نقل الطالب ${studentToTransfer.studentName} بنجاح`);
            handleCloseTransferModal();
            handleClassroomSelect(selectedClassroomId);
        } catch (error) { toast.error(error.response?.data?.message || "فشل عملية النقل."); }
    };

    const filteredClassrooms = classrooms.filter(c => !selectedTeacherId || c.teacherId == selectedTeacherId);
    const selectedClassroom = classrooms.find(c => c.classroomId === selectedClassroomId);
    const transferOptions = classrooms.filter(cl => cl.classroomId !== selectedClassroomId && cl.teacherId !== selectedClassroom?.teacherId);

    // حساب النسبة المئوية بأمان
    const capacityPercentage = selectedClassroom && selectedClassroom.capacity > 0
        ? (enrolledStudents.length / selectedClassroom.capacity) * 100
        : 0;

    return (
        <>
            <Row>
                <Col md={12} className="mb-4">
                    <Card>
                        <Card.Header><Card.Title as="h4">1. اختر الفصل الدراسي</Card.Title></Card.Header>
                        <Card.Body>
                            <Row className="mb-3">
                                <Col md={12}><Form.Group><Form.Label>فلترة حسب المدرس (اختياري)</Form.Label><Form.Select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)} disabled={loading.teachers}><option value="">-- جميع المدرسين --</option>{teachers.map(t => <option key={t.userId} value={t.userId}>{t.firstName} {t.lastName}</option>)}</Form.Select></Form.Group></Col>
                            </Row>
                            <Row>
                                <Col md={4} style={{ maxHeight: '250px', overflowY: 'auto' }}><h6>البرامج {loading.programs && <Spinner size="sm" />}</h6><ListGroup>{programs.map(p => (<ListGroup.Item key={p.academicProgramId} action active={selectedProgramId === p.academicProgramId} onClick={() => handleProgramSelect(p.academicProgramId)}>{p.name}</ListGroup.Item>))}</ListGroup></Col>
                                <Col md={4} style={{ maxHeight: '250px', overflowY: 'auto' }}><h6>الدورات {loading.courses && <Spinner size="sm" />}</h6>{selectedProgramId && <ListGroup>{courses.map(c => (<ListGroup.Item key={c.courseId} action active={selectedCourseId === c.courseId} onClick={() => handleCourseSelect(c.courseId)}>{c.name}</ListGroup.Item>))}</ListGroup>}</Col>
                                <Col md={4} style={{ maxHeight: '250px', overflowY: 'auto' }}><h6>الفصول {loading.classrooms && <Spinner size="sm" />}</h6>{selectedCourseId && <ListGroup>{filteredClassrooms.map(cl => (<ListGroup.Item key={cl.classroomId} action active={selectedClassroomId === cl.classroomId} onClick={() => handleClassroomSelect(cl.classroomId)}>{cl.name} <small className="text-muted">({cl.teacherName})</small></ListGroup.Item>))}</ListGroup>}</Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={12}>
                    <Card>
                        {/* ======== بداية التعديل هنا ======== */}
                        <Card.Header>
                            <Card.Title as="h4">2. إدارة التسجيل</Card.Title>
                            {selectedClassroom ? (
                                <>
                                    <p className="card-category mb-2">
                                        الفصل المحدد: <strong>{selectedClassroom.name}</strong> (المدرس: {selectedClassroom.teacherName})
                                    </p>
                                    <div className="d-flex align-items-center mt-2">
                                        <strong className="me-3">السعة: {enrolledStudents.length} / {selectedClassroom.capacity}</strong>
                                        <ProgressBar
                                            now={capacityPercentage}
                                            label={`${Math.round(capacityPercentage)}%`}
                                            variant={capacityPercentage >= 100 ? 'danger' : 'success'}
                                            style={{ flex: 1 }}
                                        />
                                    </div>
                                </>
                            ) : (
                                <p className="card-category">يرجى اختيار فصل من المستكشف أعلاه.</p>
                            )}
                        </Card.Header>
                        {/* ======== نهاية التعديل هنا ======== */}
                        <Card.Body>
                            {!selectedClassroom ? (<div className="text-center text-muted p-5"><i className="fas fa-arrow-up fa-3x mb-3"></i><p>ابدأ باختيار فصل.</p></div>
                            ) : loading.enrollment ? (<div className="text-center p-5"><Spinner /></div>
                            ) : (
                                <Row>
                                    <Col md={6} className="d-flex flex-column" style={{ maxHeight: '50vh' }}>
                                        <h5><i className="fas fa-users text-primary"></i> طلاب متاحون ({availableStudents.length})</h5>
                                        <div className="flex-grow-1" style={{ overflowY: 'auto' }}>
                                            <ListGroup variant="flush">
                                                {availableStudents.map(s => (
                                                    <ListGroup.Item key={s.userId} className="d-flex justify-content-between align-items-center">
                                                        <span>{s.firstName} {s.lastName}</span>
                                                        <Button variant="primary" size="sm" onClick={() => handleEnroll(s)}>تسجيل <i className="fas fa-arrow-right"></i></Button>
                                                    </ListGroup.Item>
                                                ))}
                                            </ListGroup>
                                        </div>
                                    </Col>
                                    <Col md={6} className="d-flex flex-column" style={{ maxHeight: '50vh' }}>
                                        <h5><i className="fas fa-user-check text-success"></i> طلاب مسجلون ({enrolledStudents.length})</h5>
                                        <div className="flex-grow-1" style={{ overflowY: 'auto' }}>
                                            <ListGroup variant="flush">
                                                {enrolledStudents.map(enrollment => (
                                                    <ListGroup.Item key={enrollment.enrollmentId} className="d-flex justify-content-between align-items-center">
                                                        <span>{enrollment.studentName}</span>
                                                        <div>
                                                            <Button variant="outline-danger" size="sm" className="ms-2" onClick={() => handleUnenroll(enrollment)}><i className="fas fa-times"></i></Button>
                                                            <Button variant="outline-info" size="sm" onClick={() => handleShowTransferModal(enrollment)}>نقل...</Button>
                                                        </div>
                                                    </ListGroup.Item>
                                                ))}
                                            </ListGroup>
                                        </div>
                                    </Col>
                                </Row>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <Modal show={showTransferModal} onHide={handleCloseTransferModal} centered>
                <Modal.Header closeButton><Modal.Title>نقل الطالب: {studentToTransfer?.studentName}</Modal.Title></Modal.Header>
                <Modal.Body>
                    <p>من الفصل: {selectedClassroom?.name} (المدرس: {selectedClassroom?.teacherName})</p>
                    <hr />
                    {transferOptions.length > 0 ? (
                        <Form.Group>
                            <Form.Label>اختر الفصل الجديد (يجب أن يكون المدرس مختلفًا)</Form.Label>
                            <Form.Select value={newClassroomId} onChange={e => setNewClassroomId(e.target.value)}>
                                <option value="">-- اختر فصلاً --</option>
                                {transferOptions.map(cl => (<option key={cl.classroomId} value={cl.classroomId}>{cl.name} (المدرس: {cl.teacherName})</option>))}
                            </Form.Select>
                        </Form.Group>
                    ) : (<Alert variant="warning">لا توجد فصول أخرى متاحة للنقل إليها.</Alert>)}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseTransferModal}>إلغاء</Button>
                    <Button variant="primary" onClick={handleConfirmTransfer} disabled={transferOptions.length === 0}>
                        تأكيد النقل
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default ClassroomEnrollment;