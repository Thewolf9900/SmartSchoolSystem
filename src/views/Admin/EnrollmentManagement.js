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
                    {/* اللوح الأيسر: قائمة البرامج */}
                    <Col md={4}>
                        <Card className="h-100">
                            <Card.Header>
                                <Card.Title as="h4">1. اختر برنامجًا</Card.Title>
                                <InputGroup><FormControl placeholder="ابحث..." value={programSearch} onChange={e => setProgramSearch(e.target.value)} /></InputGroup>
                            </Card.Header>
                            <Card.Body className="p-0" style={{ overflowY: 'auto' }}>
                                {loadingPrograms ? <div className="text-center p-3"><Spinner /></div> :
                                    <ListGroup variant="flush">
                                        {filteredPrograms.map(p => (
                                            <ListGroup.Item key={p.academicProgramId} action active={selectedProgram?.academicProgramId === p.academicProgramId} onClick={() => handleProgramSelect(p)} className="d-flex justify-content-between align-items-center">
                                                {p.name}
                                                <span className="badge bg-primary rounded-pill">{p.studentCount}</span>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                }
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* اللوح الأيمن: إدارة الطلاب */}
                    <Col md={8}>
                        <Card className="h-100">
                            <Card.Header>
                                <Card.Title as="h4">2. إدارة الطلاب</Card.Title>
                                <p className="card-category">
                                    {selectedProgram ? `في برنامج: ${selectedProgram.name}` : 'يرجى اختيار برنامج للبدء'}
                                </p>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    {/* عمود الطلاب المتاحون */}
                                    <Col md={6} style={{ maxHeight: '65vh', display: 'flex', flexDirection: 'column' }}>
                                        <h5><i className="fas fa-users text-success"></i> الطلاب المتاحون ({filteredUnassigned.length})</h5>
                                        <InputGroup className="mb-2"><FormControl placeholder="ابحث..." value={unassignedSearch} onChange={e => setUnassignedSearch(e.target.value)} /></InputGroup>
                                        <div style={{ flex: 1, overflowY: 'auto' }}>
                                            {loadingUnassigned ? <div className="text-center p-3"><Spinner /></div> :
                                                <ListGroup variant="flush">
                                                    {filteredUnassigned.map(student => (
                                                        <ListGroup.Item key={student.id} className="d-flex justify-content-between align-items-center">
                                                            <span>{student.fullName}</span>
                                                            <Button variant="success" size="sm" onClick={() => handleEnroll(student)} disabled={!selectedProgram}>
                                                                إلحاق <i className="fas fa-arrow-right"></i>
                                                            </Button>
                                                        </ListGroup.Item>
                                                    ))}
                                                </ListGroup>
                                            }
                                        </div>
                                    </Col>
                                    {/* عمود الطلاب الملتحقون */}
                                    <Col md={6} style={{ maxHeight: '65vh', display: 'flex', flexDirection: 'column' }}>
                                        <h5><i className="fas fa-user-check text-info"></i> الطلاب الملتحقون ({filteredEnrolled.length})</h5>
                                        <InputGroup className="mb-2"><FormControl placeholder="ابحث..." value={enrolledSearch} onChange={e => setEnrolledSearch(e.target.value)} /></InputGroup>
                                        <div style={{ flex: 1, overflowY: 'auto' }}>
                                            {!selectedProgram ? <div className="text-center text-muted mt-4">اختر برنامجًا لعرض الطلاب</div> :
                                                loadingEnrolled ? <div className="text-center p-4"><Spinner /></div> :
                                                    <ListGroup variant="flush">
                                                        {filteredEnrolled.map(student => (
                                                            <ListGroup.Item key={student.id} className="d-flex justify-content-between align-items-center">
                                                                <span>{student.fullName}</span>
                                                                <Button variant="outline-danger" size="sm" onClick={() => handleShowConfirmModal(student)}>
                                                                    <i className="fas fa-arrow-left"></i> إلغاء
                                                                </Button>
                                                            </ListGroup.Item>
                                                        ))}
                                                    </ListGroup>
                                            }
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
                <Modal.Header closeButton>
                    <Modal.Title className="text-danger">
                        <i className="fas fa-exclamation-triangle me-2"></i> تأكيد إلغاء الإلحاق
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>أنت على وشك إلغاء إلحاق الطالب التالي من البرنامج:</p>
                    {studentToUnenroll && (
                        <Card>
                            <ListGroup variant="flush">
                                <ListGroup.Item><strong>الاسم الكامل:</strong> {studentToUnenroll.fullName}</ListGroup.Item>
                                <ListGroup.Item><strong> معرف الطالب  :</strong> {studentToUnenroll.id}</ListGroup.Item>
                                <ListGroup.Item><strong>البريد الإلكتروني:</strong> {studentToUnenroll.email}</ListGroup.Item>
                                <ListGroup.Item><strong>الرقم الوطني:</strong> {studentToUnenroll.nationalId}</ListGroup.Item>
                            </ListGroup>
                        </Card>
                    )}
                    <p className="mt-3"><strong>هل أنت متأكد من رغبتك في المتابعة؟</strong></p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseConfirmModal}>
                        تراجع
                    </Button>
                    <Button variant="danger" onClick={handleConfirmUnenroll}>
                        نعم، قم بالإلغاء
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default EnrollmentManagement;