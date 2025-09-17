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


    return (
        <>
            <Container fluid>
                <Row>
                    <Col md="12">
                        <Card>
                            <Card.Header><Card.Title as="h4">دليل الطلاب</Card.Title></Card.Header>
                            <Card.Body>
                                <div className="bg-light p-3 mb-4 rounded border">
                                    <Row className="align-items-center">
                                        <Col lg="4" md="12">
                                            <ButtonGroup className="w-100">
                                                <Button variant={activeView === 'active' ? 'primary' : 'outline-primary'} onClick={() => { setActiveView('active'); setSelectedProgram('all'); }}>
                                                    الطلاب المسجلين
                                                </Button>
                                                <Button variant={activeView === 'unassigned' ? 'primary' : 'outline-primary'} onClick={() => setActiveView('unassigned')}>
                                                    غير المسجلين
                                                </Button>
                                            </ButtonGroup>
                                        </Col>
                                        <Col lg="4" md={6} className="mt-2 mt-lg-0">
                                            <Form.Control
                                                placeholder="بحث في القائمة الحالية..."
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </Col>
                                        {activeView === 'active' && (
                                            <Col lg="4" md={6} className="mt-2 mt-lg-0">
                                                <Form.Select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)}>
                                                    <option value="all">فلترة حسب البرنامج: الكل</option>
                                                    {programs.map(program => (
                                                        <option key={program.academicProgramId} value={program.academicProgramId}>
                                                            {program.name}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Col>
                                        )}
                                    </Row>
                                </div>
                                <Table striped hover responsive>
                                    <thead className="thead-light">
                                        <tr>
                                            <th>الاسم الكامل</th>
                                            <th>البريد الإلكتروني</th>
                                            {activeView === 'active' && <th>البرنامج</th>}
                                            <th>الحالة</th>
                                            <th>الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="5" className="text-center"><Spinner animation="border" /></td></tr>
                                        ) : filteredStudents.length > 0 ? (
                                            filteredStudents.map((student) => (
                                                <tr key={student.userId}>
                                                    <td>{`${student.firstName} ${student.lastName}`}</td>
                                                    <td>{student.email}</td>
                                                    {activeView === 'active' && <td>{getProgramNameForStudent(student)}</td>}
                                                    <td><Badge bg={activeView === 'active' ? "success" : "danger"}>{activeView === 'active' ? "مسجل" : "غير مسجل"}</Badge></td>
                                                    <td>
                                                        {activeView === 'active' ? (
                                                            <Button variant="info" size="sm" onClick={() => handleProfileClick(student)} disabled={actionLoading === student.userId}>
                                                                {actionLoading === student.userId ? <Spinner as="span" size="sm" /> : "عرض الملف"}
                                                            </Button>
                                                        ) : (
                                                            <Button variant="success" size="sm" onClick={handleEnrollClick}>التحاق ببرنامج</Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="5" className="text-center">لا يوجد طلاب لعرضهم.</td></tr>
                                        )}
                                    </tbody>
                                </Table>
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