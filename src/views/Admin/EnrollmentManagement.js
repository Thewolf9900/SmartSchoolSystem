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
    InputGroup,
    Modal, // استيراد مكون النافذة المنبثقة
} from 'react-bootstrap';
import { toast } from 'react-toastify';

import * as programService from 'services/admin/programService.js';
import * as enrollmentService from 'services/admin/enrollmentService.js';
import * as studentManagementService from 'services/admin/studentManagementService';

// دالة مساعدة لتوحيد شكل بيانات الطالب
const normalizeStudent = (student) => ({
    ...student,
    id: student.userId,
    fullName: `${student.firstName} ${student.lastName}`,
});

function EnrollmentManagement() {
    // --- قسم الحالات (State Management) ---
    const [programs, setPrograms] = useState([]);
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [unassignedStudents, setUnassignedStudents] = useState([]);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [loadingPrograms, setLoadingPrograms] = useState(true);
    const [loadingEnrolled, setLoadingEnrolled] = useState(false);
    const [loadingUnassigned, setLoadingUnassigned] = useState(true);
    const [programSearch, setProgramSearch] = useState('');
    const [enrolledSearch, setEnrolledSearch] = useState('');
    const [unassignedSearch, setUnassignedSearch] = useState('');

    // حالات جديدة لنافذة التأكيد
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [studentToUnenroll, setStudentToUnenroll] = useState(null);

    // --- جلب البيانات ---
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoadingPrograms(true);
            setLoadingUnassigned(true);
            try {
                const unassignedRes = await studentManagementService.getUnassignedStudents();
                setUnassignedStudents(unassignedRes.data.map(normalizeStudent));

                const programsRes = await programService.getPrograms();
                const initialPrograms = programsRes.data;

                const studentCountPromises = initialPrograms.map(p =>
                    programService.getStudentsForProgram(p.academicProgramId)
                );
                const studentLists = await Promise.all(studentCountPromises);

                const programsWithCounts = initialPrograms.map((program, index) => ({
                    ...program,
                    studentCount: studentLists[index].data.length,
                }));

                setPrograms(programsWithCounts);

            } catch (error) {
                toast.error("فشل تحميل البيانات الأولية.");
            } finally {
                setLoadingPrograms(false);
                setLoadingUnassigned(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleProgramSelect = async (program) => {
        setSelectedProgram(program);
        setLoadingEnrolled(true);
        setEnrolledSearch('');
        try {
            const res = await programService.getStudentsForProgram(program.academicProgramId);
            setEnrolledStudents(res.data.map(normalizeStudent));
        } catch (error) {
            toast.error("فشل تحميل الطلاب الملتحقين.");
            setEnrolledStudents([]);
        } finally {
            setLoadingEnrolled(false);
        }
    };

    const handleEnroll = async (studentToEnroll) => {
        try {
            await studentManagementService.assignStudentToProgram(studentToEnroll.id, selectedProgram.academicProgramId);
            toast.success(`تم إلحاق ${studentToEnroll.fullName}`);
            setUnassignedStudents(prev => prev.filter(s => s.id !== studentToEnroll.id));
            setEnrolledStudents(prev => [...prev, studentToEnroll].sort((a, b) => a.fullName.localeCompare(b.fullName)));
            setPrograms(programs => programs.map(p =>
                p.academicProgramId === selectedProgram.academicProgramId
                    ? { ...p, studentCount: p.studentCount + 1 }
                    : p
            ));
        } catch (error) {
            toast.error("فشل عملية الإلحاق." + error.response.data);
        }
    };

    // --- دوال إدارة نافذة التأكيد ---
    const handleShowConfirmModal = (student) => {
        setStudentToUnenroll(student);
        setShowConfirmModal(true);
    };

    const handleCloseConfirmModal = () => {
        setStudentToUnenroll(null);
        setShowConfirmModal(false);
    };

    const handleConfirmUnenroll = async () => {
        if (!studentToUnenroll) return;

        try {
            await studentManagementService.unassignStudentFromProgram(studentToUnenroll.id);
            toast.warn(`تم إلغاء إلحاق ${studentToUnenroll.fullName}`);
            setEnrolledStudents(prev => prev.filter(s => s.id !== studentToUnenroll.id));
            setUnassignedStudents(prev => [studentToUnenroll, ...prev].sort((a, b) => a.fullName.localeCompare(b.fullName)));
            setPrograms(programs => programs.map(p =>
                p.academicProgramId === selectedProgram.academicProgramId
                    ? { ...p, studentCount: p.studentCount - 1 }
                    : p
            ));
        } catch (error) {
            toast.error("فشل إلغاء الإلحاق." + error.response.data);
        } finally {
            handleCloseConfirmModal();
        }
    };

    // --- دوال الفلترة ---
    const filteredPrograms = programs.filter(p => (p.name || '').toLowerCase().includes(programSearch.toLowerCase()));
    const filteredEnrolled = enrolledStudents.filter(s => (s.fullName || '').toLowerCase().includes(enrolledSearch.toLowerCase()));
    const filteredUnassigned = unassignedStudents.filter(s => (s.fullName || '').toLowerCase().includes(unassignedSearch.toLowerCase()));

    return (
        <>
            <Container fluid>
                <Row>
                    <Col md="12">
                        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '15px' }}>
                            <Card.Header className="bg-white p-4 border-0" style={{ borderRadius: '15px 15px 0 0' }}>
                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
                                    <div>
                                        <h4 className="font-weight-bold mb-1" style={{ color: '#2c3e50' }}>تسجيل البرامج</h4>
                                        <p className="text-muted mb-0 small">إدارة التحاق الطلاب بالبرامج الأكاديمية</p>
                                    </div>
                                    <div className="mt-3 mt-md-0">
                                        {/* Placeholder for future actions if needed */}
                                    </div>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-4 bg-light">
                                <Row>
                                    {/* Left Pane: Programs List */}
                                    <Col md={4} className="mb-4 mb-md-0">
                                        <div className="bg-white p-3 rounded shadow-sm h-100 border">
                                            <h6 className="font-weight-bold mb-3 text-dark border-bottom pb-2">1. اختر برنامجًا</h6>
                                            <div className="position-relative mb-3">
                                                <i className="fas fa-search position-absolute text-muted" style={{ top: '50%', right: '15px', transform: 'translateY(-50%)', zIndex: 10 }}></i>
                                                <FormControl
                                                    placeholder="ابحث عن برنامج..."
                                                    value={programSearch}
                                                    onChange={e => setProgramSearch(e.target.value)}
                                                    className="rounded-pill border-0 bg-light pl-3 pr-5"
                                                    style={{ height: '40px' }}
                                                />
                                            </div>

                                            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                                {loadingPrograms ? <div className="text-center p-3"><Spinner animation="border" variant="primary" size="sm" /></div> :
                                                    <ListGroup variant="flush">
                                                        {filteredPrograms.map(p => (
                                                            <ListGroup.Item
                                                                key={p.academicProgramId}
                                                                action
                                                                active={selectedProgram?.academicProgramId === p.academicProgramId}
                                                                onClick={() => handleProgramSelect(p)}
                                                                className={`d-flex justify-content-between align-items-center rounded mb-1 border-0 ${selectedProgram?.academicProgramId === p.academicProgramId ? 'bg-primary text-white shadow-sm' : 'bg-transparent text-dark'}`}
                                                                style={{ transition: 'all 0.2s' }}
                                                            >
                                                                <span className="font-weight-bold">{p.name}</span>
                                                                <span className={`badge rounded-pill ${selectedProgram?.academicProgramId === p.academicProgramId ? 'bg-white text-primary' : 'bg-light text-muted'}`}>{p.studentCount}</span>
                                                            </ListGroup.Item>
                                                        ))}
                                                    </ListGroup>
                                                }
                                            </div>
                                        </div>
                                    </Col>

                                    {/* Right Pane: Student Management */}
                                    <Col md={8}>
                                        <div className="bg-white p-3 rounded shadow-sm h-100 border">
                                            <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                                                <h6 className="font-weight-bold mb-0 text-dark">2. إدارة الطلاب</h6>
                                                {selectedProgram && <span className="badge badge-primary rounded-pill px-3 py-2">{selectedProgram.name}</span>}
                                            </div>

                                            {!selectedProgram ? (
                                                <div className="text-center text-muted py-5">
                                                    <i className="fas fa-arrow-right fa-3x mb-3 text-muted opacity-25 d-none d-md-inline-block"></i>
                                                    <p>يرجى اختيار برنامج من القائمة للبدء في إدارة الطلاب.</p>
                                                </div>
                                            ) : (
                                                <Row>
                                                    {/* Available Students */}
                                                    <Col md={6} className="d-flex flex-column mb-3 mb-md-0" style={{ maxHeight: '600px' }}>
                                                        <div className="mb-2 d-flex align-items-center justify-content-between">
                                                            <span className="text-success font-weight-bold text-sm"><i className="fas fa-users mr-1"></i> متاح ({filteredUnassigned.length})</span>
                                                        </div>
                                                        <div className="position-relative mb-2">
                                                            <FormControl
                                                                placeholder="بحث طلاب..."
                                                                value={unassignedSearch}
                                                                onChange={e => setUnassignedSearch(e.target.value)}
                                                                className="rounded-pill border-light bg-light"
                                                                size="sm"
                                                            />
                                                        </div>
                                                        <div className="flex-grow-1 border rounded bg-light p-2" style={{ overflowY: 'auto' }}>
                                                            {loadingUnassigned ? <div className="text-center p-3"><Spinner animation="border" size="sm" /></div> :
                                                                <ListGroup variant="flush">
                                                                    {filteredUnassigned.map(student => (
                                                                        <ListGroup.Item key={student.id} className="d-flex justify-content-between align-items-center bg-white rounded mb-1 shadow-sm border-0 p-2">
                                                                            <span className="text-truncate small" style={{ maxWidth: '150px' }} title={student.fullName}>{student.fullName}</span>
                                                                            <Button
                                                                                variant="outline-success"
                                                                                size="sm"
                                                                                className="rounded-circle shadow-sm"
                                                                                onClick={() => handleEnroll(student)}
                                                                                disabled={!selectedProgram}
                                                                                title="إلحاق"
                                                                                style={{ width: '30px', height: '30px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                            >
                                                                                <i className="fas fa-plus"></i>
                                                                            </Button>
                                                                        </ListGroup.Item>
                                                                    ))}
                                                                    {filteredUnassigned.length === 0 && <div className="text-center text-muted small py-4">لا توجد نتائج</div>}
                                                                </ListGroup>
                                                            }
                                                        </div>
                                                    </Col>

                                                    {/* Enrolled Students */}
                                                    <Col md={6} className="d-flex flex-column" style={{ maxHeight: '600px' }}>
                                                        <div className="mb-2 d-flex align-items-center justify-content-between">
                                                            <span className="text-info font-weight-bold text-sm"><i className="fas fa-check-circle mr-1"></i> مسجل ({filteredEnrolled.length})</span>
                                                        </div>
                                                        <div className="position-relative mb-2">
                                                            <FormControl
                                                                placeholder="بحث مسجلين..."
                                                                value={enrolledSearch}
                                                                onChange={e => setEnrolledSearch(e.target.value)}
                                                                className="rounded-pill border-light bg-light"
                                                                size="sm"
                                                            />
                                                        </div>
                                                        <div className="flex-grow-1 border rounded bg-light p-2" style={{ overflowY: 'auto' }}>
                                                            {loadingEnrolled ? <div className="text-center p-3"><Spinner animation="border" size="sm" /></div> :
                                                                <ListGroup variant="flush">
                                                                    {filteredEnrolled.map(student => (
                                                                        <ListGroup.Item key={student.id} className="d-flex justify-content-between align-items-center bg-white rounded mb-1 shadow-sm border-0 p-2">
                                                                            <span className="text-truncate small" style={{ maxWidth: '150px' }} title={student.fullName}>{student.fullName}</span>
                                                                            <Button
                                                                                variant="outline-danger"
                                                                                size="sm"
                                                                                className="rounded-circle shadow-sm"
                                                                                onClick={() => handleShowConfirmModal(student)}
                                                                                title="إلغاء الإلحاق"
                                                                                style={{ width: '30px', height: '30px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                            >
                                                                                <i className="fas fa-times"></i>
                                                                            </Button>
                                                                        </ListGroup.Item>
                                                                    ))}
                                                                    {filteredEnrolled.length === 0 && <div className="text-center text-muted small py-4">لا توجد نتائج</div>}
                                                                </ListGroup>
                                                            }
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

            {/* نافذة تأكيد الحذف */}
            <Modal show={showConfirmModal} onHide={handleCloseConfirmModal} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="text-danger font-weight-bold">
                        <i className="fas fa-exclamation-triangle mr-2"></i> تأكيد إلغاء الإلحاق
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-0">
                    <p className="text-muted mb-3">أنت على وشك إلغاء إلحاق الطالب التالي من البرنامج، هل أنت متأكد؟</p>
                    {studentToUnenroll && (
                        <div className="bg-light p-3 rounded">
                            <div className="d-flex align-items-center mb-2">
                                <strong className="mr-2" style={{ minWidth: '100px' }}>الاسم الكامل:</strong> <span>{studentToUnenroll.fullName}</span>
                            </div>
                            <div className="d-flex align-items-center mb-2">
                                <strong className="mr-2" style={{ minWidth: '100px' }}>البريد:</strong> <span className="text-muted small">{studentToUnenroll.email}</span>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="light" onClick={handleCloseConfirmModal} className="rounded-pill px-4">
                        تراجع
                    </Button>
                    <Button variant="danger" onClick={handleConfirmUnenroll} className="rounded-pill px-4 shadow-sm btn-fill">
                        تأكيد الإلغاء
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default EnrollmentManagement;