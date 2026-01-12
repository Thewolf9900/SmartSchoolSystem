// src/views/StudentDirectory.js

import { useHistory } from "react-router-dom";
import React, { useState, useEffect, useMemo } from "react";
import { getStudentProfile, getUnassignedStudents, getActiveStudents } from "../../services/admin/studentManagementService";
import { getPrograms, getStudentsForProgram } from "../../services/admin/programService";

import {
    Button,
    Card,
    Container,
    Row,
    Col,
    Form,
    Table,
    Modal,
    Spinner,
    Badge,
    ButtonGroup,
} from "react-bootstrap";

const StudentDirectory = () => {
    const history = useHistory();

    const [activeView, setActiveView] = useState("active");
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [actionLoading, setActionLoading] = useState(null);
    const [selectedProfile, setSelectedProfile] = useState(null);

    const [programs, setPrograms] = useState([]);
    const [selectedProgram, setSelectedProgram] = useState("all");

    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            try {
                let response;
                if (activeView === 'active') {
                    if (selectedProgram === 'all') {
                        response = await getActiveStudents();
                    } else {
                        response = await getStudentsForProgram(selectedProgram);
                    }
                } else {
                    response = await getUnassignedStudents();
                }
                setStudents(response.data);
            } catch (error) {
                console.error(`Failed to fetch students`, error);
                setStudents([]);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [activeView, selectedProgram]);

    useEffect(() => {
        const fetchPrograms = async () => {
            try {
                const response = await getPrograms();
                setPrograms(response.data);
            } catch (error) {
                console.error("Failed to fetch programs", error);
            }
        };
        fetchPrograms();
    }, []);

    const filteredStudents = useMemo(() => {
        if (!searchTerm) return students;
        return students.filter(student =>
            `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [students, searchTerm]);

    const getProgramNameForStudent = (student) => {
        if (student.programName) {
            return student.programName;
        }
        if (selectedProgram !== 'all') {
            const program = programs.find(p => p.academicProgramId == selectedProgram);
            return program ? program.name : '...';
        }
        return 'غير محدد';
    };


    const handleProfileClick = async (student) => {
        setActionLoading(student.userId);
        try {
            const response = await getStudentProfile(student.userId);
            setSelectedProfile(response.data);
        } catch (error) {
            console.error("Failed to get student profile", error);
            alert("حدث خطأ أثناء جلب بيانات الطالب.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleEnrollClick = () => {
        history.push("/admin/enrollments");
    };

    const navigateToClassroomEnrollment = () => {
        setSelectedProfile(null);
        history.push("/admin/classroom-enrollment");
    };

    const renderProfileModal = () => {
        if (!selectedProfile) return null;

        const { userInfo, programName, enrollments, missingCourses } = selectedProfile;
        const validEnrollments = enrollments.filter((e) => e.classroomId !== 0);

        const getGradeBadge = (grade) => {
            if (grade === null || grade === undefined) return <span className="text-muted">لم ترصد</span>;
            let variant = "secondary";
            if (grade >= 90) variant = "success";
            else if (grade >= 75) variant = "info";
            else if (grade >= 60) variant = "warning";
            else variant = "danger";
            return <Badge bg={variant}>{grade}</Badge>;
        };

        const avatarStyle = { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#007bff', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' };

        return (
            <Modal show={!!selectedProfile} onHide={() => setSelectedProfile(null)} size="xl" centered>
                <Modal.Header closeButton style={{ borderBottom: 'none' }}><Modal.Title as="h5">الملف الأكاديمي الشامل</Modal.Title></Modal.Header>
                <Modal.Body className="p-4" style={{ backgroundColor: '#f8f9fa' }}>
                    <div className="bg-primary text-white p-4 rounded shadow-sm mb-4"><Row className="align-items-center"><Col xs="auto"><div style={avatarStyle}>{userInfo.firstName.charAt(0)}{userInfo.lastName.charAt(0)}</div></Col><Col><h3 className="mb-0">{userInfo.firstName} {userInfo.lastName}</h3><p className="mb-1 opacity-75">{userInfo.email}</p><p className="mb-0 opacity-75">الرقم الوطني: {userInfo.nationalId}</p></Col><Col md={4} className="text-md-right text-left mt-3 mt-md-0"><small>البرنامج الأكاديمي</small><h4 className="mb-0">{programName}</h4></Col></Row></div>
                    <Card className="mb-4 shadow-sm"><Card.Header><Card.Title as="h5"><i className="nc-icon nc-paper-2 text-info mr-2"></i>السجل الأكاديمي</Card.Title></Card.Header><Card.Body>{validEnrollments.length > 0 ? (<Table striped hover responsive className="mb-0"><thead className="thead-light"><tr><th>الفصل الدراسي</th><th className="text-center">الدرجة العملية</th><th className="text-center">الدرجة النظرية</th><th className="text-center">الدرجة النهائية</th></tr></thead><tbody>{validEnrollments.map((e, i) => (<tr key={i}><td><strong>{e.classroomName}</strong></td><td className="text-center">{e.practicalGrade ?? <span className="text-muted">-</span>}</td><td className="text-center">{e.examGrade ?? <span className="text-muted">-</span>}</td><td className="text-center font-weight-bold">{getGradeBadge(e.finalGrade)}</td></tr>))}</tbody></Table>) : (<div className="text-center text-muted py-4"><p className="mb-0">لا يوجد فصول مسجلة حاليًا.</p></div>)}</Card.Body></Card>
                    {missingCourses && missingCourses.length > 0 && (<Card className="border-warning shadow-sm"><Card.Header className="bg-warning-light"><Card.Title as="h5" className="text-warning"><i className="nc-icon nc-alert-circle-i mr-2"></i>تنبيه: دورات مطلوبة لإكمال البرنامج</Card.Title></Card.Header><Card.Body><Table hover size="sm" className="mb-0"><tbody>{missingCourses.map((c) => (<tr key={c.courseId}><td><span className="text-danger font-weight-bold h6">{c.courseName}</span></td><td className="text-right"><Button variant="success" size="sm" onClick={navigateToClassroomEnrollment}><i className="nc-icon nc-simple-add mr-1"></i> تسجيل الطالب</Button></td></tr>))}</tbody></Table></Card.Body></Card>)}
                </Modal.Body>
            </Modal>
        );
    };


    const renderTableBody = () => {
        if (loading) return <tr><td colSpan="5" className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>;
        if (filteredStudents.length === 0) return <tr><td colSpan="5" className="text-center py-5 text-muted">لا يوجد طلاب لعرضهم.</td></tr>;

        return filteredStudents.map((student) => (
            <tr key={student.userId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td className="align-middle pl-4">
                    <div className="d-flex align-items-center">
                        <div className="rounded-circle d-flex align-items-center justify-content-center mr-3 flex-shrink-0 shadow-sm" style={{ width: '40px', height: '40px', backgroundColor: '#f8f9fa', color: '#6c757d' }}>
                            <span className="font-weight-bold">{student.firstName.charAt(0)}</span>
                        </div>
                        <div>
                            <span className="font-weight-bold text-dark d-block">{student.firstName} {student.lastName}</span>
                        </div>
                    </div>
                </td>
                <td className="align-middle text-muted">{student.email}</td>

                <td className="align-middle"><Badge bg={activeView === 'active' ? "success" : "warning"} className="px-3 py-2 font-weight-normal">{activeView === 'active' ? "مسجل" : "غير مسجل"}</Badge></td>
                <td className="align-middle text-right pr-4">
                    {activeView === 'active' ? (
                        <Button
                            variant="outline-info"
                            size="sm"
                            className="rounded mx-1"
                            onClick={() => handleProfileClick(student)}
                            disabled={actionLoading === student.userId}
                            title="عرض الملف الأكاديمي"
                            style={{ width: '35px', height: '35px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            {actionLoading === student.userId ? <Spinner as="span" size="sm" /> : <i className="fas fa-id-card"></i>}
                        </Button>
                    ) : (
                        <Button
                            variant="outline-success"
                            size="sm"
                            className="rounded mx-1"
                            onClick={handleEnrollClick}
                            title="التحاق ببرنامج"
                            style={{ width: '35px', height: '35px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <i className="fas fa-user-plus"></i>
                        </Button>
                    )}
                </td>
            </tr>
        ));
    };

    const renderMobileCards = () => {
        if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;
        if (filteredStudents.length === 0) return <div className="text-center py-5 text-muted">لا يوجد طلاب لعرضهم.</div>;

        return filteredStudents.map((student) => (
            <Card key={student.userId} className="mb-3 border shadow-sm">
                <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center">
                            <div className="rounded-circle d-flex align-items-center justify-content-center mr-2 shadow-sm" style={{ width: '40px', height: '40px', backgroundColor: '#e3f2fd', color: '#007bff' }}>
                                <span className="font-weight-bold">{student.firstName.charAt(0)}</span>
                            </div>
                            <div>
                                <h6 className="font-weight-bold mb-0 text-dark">{student.firstName} {student.lastName}</h6>
                                <small className="text-muted text-break">{student.email}</small>
                            </div>
                        </div>
                        <Badge bg={activeView === 'active' ? "success" : "warning"} className="px-2 py-1">{activeView === 'active' ? "مسجل" : "غير مسجل"}</Badge>
                    </div>



                    <div className="d-flex justify-content-end pt-2">
                        {activeView === 'active' ? (
                            <Button variant="outline-info" size="sm" className="rounded w-100" onClick={() => handleProfileClick(student)} disabled={actionLoading === student.userId}>
                                {actionLoading === student.userId ? <Spinner as="span" size="sm" /> : <><i className="fas fa-id-card mr-2"></i> عرض الملف الأكاديمي</>}
                            </Button>
                        ) : (
                            <Button variant="outline-success" size="sm" className="rounded w-100" onClick={handleEnrollClick}>
                                <i className="fas fa-user-plus mr-2"></i> التحاق ببرنامج
                            </Button>
                        )}
                    </div>
                </Card.Body>
            </Card>
        ));
    };

    return (
        <>
            <Container fluid>
                <Row>
                    <Col md="12">
                        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '15px' }}>
                            <Card.Header className="bg-white p-4 border-0" style={{ borderRadius: '15px 15px 0 0' }}>
                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
                                    <div>
                                        <h4 className="font-weight-bold mb-1" style={{ color: '#2c3e50' }}>دليل الطلاب</h4>
                                        <p className="text-muted mb-0 small">استعراض وإدارة ملفات الطلاب الأكاديمية</p>
                                    </div>
                                    <div className="mt-3 mt-md-0 bg-light rounded-pill p-1 d-inline-flex">
                                        <Button
                                            variant={activeView === 'active' ? 'white' : 'transparent'}
                                            className={`rounded-pill px-4 ${activeView === 'active' ? 'shadow-sm font-weight-bold text-primary' : 'text-muted border-0'}`}
                                            onClick={() => { setActiveView('active'); setSelectedProgram('all'); }}
                                        >
                                            الطلاب المسجلين
                                        </Button>
                                        <Button
                                            variant={activeView === 'unassigned' ? 'white' : 'transparent'}
                                            className={`rounded-pill px-4 ${activeView === 'unassigned' ? 'shadow-sm font-weight-bold text-primary' : 'text-muted border-0'}`}
                                            onClick={() => setActiveView('unassigned')}
                                        >
                                            غير المسجلين
                                        </Button>
                                    </div>
                                </div>

                                <Row className="bg-light p-3 rounded mx-0 align-items-center">
                                    <Col md={activeView === 'active' ? 8 : 12}>
                                        <div className="position-relative">
                                            <i className="fas fa-search position-absolute text-muted" style={{ top: '50%', right: '15px', transform: 'translateY(-50%)', zIndex: 10 }}></i>
                                            <Form.Control
                                                placeholder="بحث في القائمة الحالية..."
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-3 pr-5 shadow-sm border-0 rounded-pill"
                                                style={{ height: '45px' }}
                                            />
                                        </div>
                                    </Col>
                                    {activeView === 'active' && (
                                        <Col md={4} className="mt-2 mt-md-0">
                                            <Form.Select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)} className="shadow-sm border-0 rounded-pill" style={{ height: '45px' }}>
                                                <option value="all">كل البرامج</option>
                                                {programs.map(program => (
                                                    <option key={program.academicProgramId} value={program.academicProgramId}>
                                                        {program.name}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Col>
                                    )}
                                </Row>
                            </Card.Header>

                            <Card.Body className="px-0">
                                <div className="d-none d-md-block table-responsive">
                                    <Table className="table-hover mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="border-0 py-3 pl-4 text-muted small font-weight-bold align-middle">الاسم الكامل</th>
                                                <th className="border-0 py-3 text-muted small font-weight-bold align-middle">البريد الإلكتروني</th>

                                                <th className="border-0 py-3 text-muted small font-weight-bold align-middle">الحالة</th>
                                                <th className="border-0 py-3 text-muted small font-weight-bold text-right pr-4 align-middle">الإجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {renderTableBody()}
                                        </tbody>
                                    </Table>
                                </div>
                                <div className="d-md-none p-3 bg-light">
                                    {renderMobileCards()}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
            {renderProfileModal()}
        </>
    );
};

export default StudentDirectory;