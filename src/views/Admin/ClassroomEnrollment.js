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

    const capacityPercentage = selectedClassroom && selectedClassroom.capacity > 0
        ? (enrolledStudents.length / selectedClassroom.capacity) * 100
        : 0;

    return (
        <>
            <Container fluid>
                <Row>
                    <Col md="12">
                        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '15px' }}>
                            <Card.Header className="bg-white p-4 border-0" style={{ borderRadius: '15px 15px 0 0' }}>
                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
                                    <div>
                                        <h4 className="font-weight-bold mb-1" style={{ color: '#2c3e50' }}>تسجيل الفصول</h4>
                                        <p className="text-muted mb-0 small">توزيع الطلاب على الفصول الدراسية وإدارة تنقلاتهم</p>
                                    </div>
                                    <div className="mt-3 mt-md-0 d-flex align-items-center">
                                        <Form.Select
                                            value={selectedTeacherId}
                                            onChange={e => setSelectedTeacherId(e.target.value)}
                                            className="rounded-pill shadow-sm border-light mr-2"
                                            style={{ width: '200px' }}
                                            disabled={loading.teachers}
                                        >
                                            <option value="">-- كل المدرسين --</option>
                                            {teachers.map(t => <option key={t.userId} value={t.userId}>{t.firstName} {t.lastName}</option>)}
                                        </Form.Select>
                                    </div>
                                </div>

                                <Row className="bg-light p-3 rounded mx-0 align-items-center">
                                    <Col md={6} className="mb-2 mb-md-0">
                                        <Form.Select
                                            value={selectedProgramId || ''}
                                            onChange={e => handleProgramSelect(e.target.value)}
                                            className="rounded-pill border-0 shadow-sm py-2"
                                            disabled={loading.programs}
                                        >
                                            <option value="">1. اختر البرنامج الأكاديمي</option>
                                            {programs.map(p => <option key={p.academicProgramId} value={p.academicProgramId}>{p.name}</option>)}
                                        </Form.Select>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Select
                                            value={selectedCourseId || ''}
                                            onChange={e => handleCourseSelect(e.target.value)}
                                            className="rounded-pill border-0 shadow-sm py-2"
                                            disabled={!selectedProgramId || loading.courses}
                                        >
                                            <option value="">2. اختر الدورة/المادة</option>
                                            {courses.map(c => <option key={c.courseId} value={c.courseId}>{c.name}</option>)}
                                        </Form.Select>
                                    </Col>
                                </Row>
                            </Card.Header>

                            <Card.Body className="p-4 bg-light">
                                <Row>
                                    {/* Left Pane: Classrooms List */}
                                    <Col md={4} className="mb-4 mb-md-0">
                                        <div className="bg-white p-3 rounded shadow-sm h-100 border">
                                            <h6 className="font-weight-bold mb-3 text-dark border-bottom pb-2">3. اختر الفصل الدراسي</h6>

                                            {!selectedCourseId ? (
                                                <div className="text-center text-muted py-5 small">
                                                    يرجى اختيار دورة أولاً
                                                </div>
                                            ) : loading.classrooms ? (
                                                <div className="text-center p-3"><Spinner animation="border" size="sm" /></div>
                                            ) : (
                                                <ListGroup variant="flush" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                                    {filteredClassrooms.length > 0 ? filteredClassrooms.map(cl => (
                                                        <ListGroup.Item
                                                            key={cl.classroomId}
                                                            action
                                                            active={selectedClassroomId === cl.classroomId}
                                                            onClick={() => handleClassroomSelect(cl.classroomId)}
                                                            className={`rounded mb-2 border-0 p-3 ${selectedClassroomId === cl.classroomId ? 'bg-primary text-white shadow-sm' : 'bg-light text-dark'}`}
                                                        >
                                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                                <span className="font-weight-bold">{cl.name}</span>
                                                                {selectedClassroomId === cl.classroomId && <i className="fas fa-check-circle"></i>}
                                                            </div>
                                                            <small className={selectedClassroomId === cl.classroomId ? 'text-white-50' : 'text-muted'}>
                                                                <i className="fas fa-chalkboard-teacher mr-1"></i> {cl.teacherName}
                                                            </small>
                                                        </ListGroup.Item>
                                                    )) : <div className="text-center text-muted py-3">لا توجد فصول متاحة</div>}
                                                </ListGroup>
                                            )}
                                        </div>
                                    </Col>

                                    {/* Right Pane: Enrollment Management */}
                                    <Col md={8}>
                                        <div className="bg-white p-3 rounded shadow-sm h-100 border">
                                            <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                                                <h6 className="font-weight-bold mb-0 text-dark">4. إدارة الطلاب في الفصل</h6>
                                                {selectedClassroom && (
                                                    <div className="d-flex align-items-center" style={{ width: '200px' }}>
                                                        <small className="text-muted mr-2 whitespace-nowrap">السعة:</small>
                                                        <ProgressBar
                                                            now={capacityPercentage}
                                                            variant={capacityPercentage >= 100 ? 'danger' : 'success'}
                                                            className="flex-grow-1"
                                                            style={{ height: '8px' }}
                                                        />
                                                        <small className="ml-2 font-weight-bold">{enrolledStudents.length}/{selectedClassroom.capacity}</small>
                                                    </div>
                                                )}
                                            </div>

                                            {!selectedClassroom ? (
                                                <div className="text-center text-muted py-5">
                                                    <i className="fas fa-chalkboard fa-3x mb-3 text-muted opacity-25"></i>
                                                    <p>اختر فصلاً من القائمة الجانبية للبدء.</p>
                                                </div>
                                            ) : loading.enrollment ? (
                                                <div className="text-center p-5"><Spinner animation="border" /></div>
                                            ) : (
                                                <Row>
                                                    {/* Available Students */}
                                                    <Col md={6} className="d-flex flex-column mb-3 mb-md-0" style={{ maxHeight: '550px' }}>
                                                        <div className="mb-2 d-flex align-items-center justify-content-between">
                                                            <span className="text-success font-weight-bold text-sm"><i className="fas fa-users mr-1"></i> متاح ({availableStudents.length})</span>
                                                        </div>
                                                        <div className="flex-grow-1 border rounded bg-light p-2" style={{ overflowY: 'auto' }}>
                                                            {availableStudents.length > 0 ? (
                                                                <ListGroup variant="flush">
                                                                    {availableStudents.map(s => (
                                                                        <ListGroup.Item key={s.userId} className="d-flex justify-content-between align-items-center bg-white rounded mb-1 shadow-sm border-0 p-2">
                                                                            <span className="text-truncate small" title={`${s.firstName} ${s.lastName}`}>{s.firstName} {s.lastName}</span>
                                                                            <Button
                                                                                variant="outline-success"
                                                                                size="sm"
                                                                                className="rounded-circle shadow-sm"
                                                                                onClick={() => handleEnroll(s)}
                                                                                title="تسجيل في الفصل"
                                                                                style={{ width: '30px', height: '30px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                            >
                                                                                <i className="fas fa-plus"></i>
                                                                            </Button>
                                                                        </ListGroup.Item>
                                                                    ))}
                                                                </ListGroup>
                                                            ) : <div className="text-center text-muted small py-4">لا يوجد طلاب متاحين</div>}
                                                        </div>
                                                    </Col>

                                                    {/* Enrolled Students */}
                                                    <Col md={6} className="d-flex flex-column" style={{ maxHeight: '550px' }}>
                                                        <div className="mb-2 d-flex align-items-center justify-content-between">
                                                            <span className="text-info font-weight-bold text-sm"><i className="fas fa-check-circle mr-1"></i> مسجل ({enrolledStudents.length})</span>
                                                        </div>
                                                        <div className="flex-grow-1 border rounded bg-light p-2" style={{ overflowY: 'auto' }}>
                                                            {enrolledStudents.length > 0 ? (
                                                                <ListGroup variant="flush">
                                                                    {enrolledStudents.map(enrollment => (
                                                                        <ListGroup.Item key={enrollment.enrollmentId} className="d-flex justify-content-between align-items-center bg-white rounded mb-1 shadow-sm border-0 p-2">
                                                                            <span className="text-truncate small" title={enrollment.studentName}>{enrollment.studentName}</span>
                                                                            <div>
                                                                                <Button
                                                                                    variant="outline-info"
                                                                                    size="sm"
                                                                                    className="rounded-circle shadow-sm mx-1"
                                                                                    onClick={() => handleShowTransferModal(enrollment)}
                                                                                    title="نقل لفصل آخر"
                                                                                    style={{ width: '30px', height: '30px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                                                                >
                                                                                    <i className="fas fa-exchange-alt"></i>
                                                                                </Button>
                                                                                <Button
                                                                                    variant="outline-danger"
                                                                                    size="sm"
                                                                                    className="rounded-circle shadow-sm"
                                                                                    onClick={() => handleUnenroll(enrollment)}
                                                                                    title="إلغاء التسجيل"
                                                                                    style={{ width: '30px', height: '30px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                                                                >
                                                                                    <i className="fas fa-times"></i>
                                                                                </Button>
                                                                            </div>
                                                                        </ListGroup.Item>
                                                                    ))}
                                                                </ListGroup>
                                                            ) : <div className="text-center text-muted small py-4">لا يوجد طلاب مسجلين</div>}
                                                        </div>
                                                    </Col>
                                                </Row>
                                            )}
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>

            <Modal show={showTransferModal} onHide={handleCloseTransferModal} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="font-weight-bold"><i className="fas fa-exchange-alt mr-2 text-info"></i> نقل الطالب</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-0">
                    <div className="bg-light p-3 rounded mb-3 mt-3">
                        <h6 className="font-weight-bold text-dark mb-1">{studentToTransfer?.studentName}</h6>
                        <small className="text-muted">من الفصل الحالي: {selectedClassroom?.name}</small>
                    </div>
                    {transferOptions.length > 0 ? (
                        <Form.Group>
                            <Form.Label className="font-weight-bold small">اختر الفصل الجديد</Form.Label>
                            <Form.Select
                                value={newClassroomId}
                                onChange={e => setNewClassroomId(e.target.value)}
                                className="rounded-pill shadow-sm border-light"
                            >
                                <option value="">-- اختر فصلاً --</option>
                                {transferOptions.map(cl => (<option key={cl.classroomId} value={cl.classroomId}>{cl.name} (المدرس: {cl.teacherName})</option>))}
                            </Form.Select>
                            <Form.Text className="text-muted small">يجب أن يكون الفصل الجديد تابعاً لنفس المادة الدراسي.</Form.Text>
                        </Form.Group>
                    ) : (<Alert variant="warning" className="rounded-lg shadow-sm">لا توجد فصول أخرى متاحة للنقل إليها لهذه المادة.</Alert>)}
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="light" onClick={handleCloseTransferModal} className="rounded-pill px-4">إلغاء</Button>
                    <Button variant="primary" onClick={handleConfirmTransfer} disabled={transferOptions.length === 0} className="rounded-pill px-4 shadow-sm btn-fill">
                        تأكيد النقل
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default ClassroomEnrollment;