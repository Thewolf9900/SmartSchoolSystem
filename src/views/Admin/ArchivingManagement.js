// src/views/ArchivingManagement.js

import React, { useState, useEffect, useMemo } from "react";
import { toast } from 'react-toastify';

import { getCompletedClassrooms } from "services/admin/classroomService";
import { archiveClassroom, getArchivedClassrooms } from "services/admin/archiveService";
import { getPrograms } from "services/admin/programService";

import {
    Button, Card, Container, Row, Col, Table, Tabs, Tab, Accordion, Form, Spinner
} from "react-bootstrap";

const ArchivingManagement = () => {
    const [activeTab, setActiveTab] = useState("readyToArchive");
    const [readyToArchive, setReadyToArchive] = useState([]);
    const [archived, setArchived] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isArchivingId, setIsArchivingId] = useState(null);

    // Fetch all necessary data on initial load
    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [programsRes, readyRes, archivedRes] = await Promise.all([
                getPrograms(),
                getCompletedClassrooms(),
                getArchivedClassrooms() // Fetch archived classrooms as well
            ]);
            setPrograms(programsRes.data);
            setReadyToArchive(readyRes.data);
            setArchived(archivedRes.data);
        } catch (error) {
            toast.error("فشل في جلب البيانات الأولية.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // Group ready-to-archive classrooms by program
    const groupedReadyToArchive = useMemo(() => {
        return readyToArchive.reduce((acc, classroom) => {
            const programName = classroom.academicProgramName || "برنامج غير محدد";
            if (!acc[programName]) {
                acc[programName] = [];
            }
            acc[programName].push(classroom);
            return acc;
        }, {});
    }, [readyToArchive]);

    // Handle archive click action
    const handleArchiveClick = async (classroomId) => {
        if (window.confirm("هل أنت متأكد من رغبتك في أرشفة هذا الفصل؟ سيتم حذفه من النظام النشط.")) {
            setIsArchivingId(classroomId);
            try {
                const response = await archiveClassroom(classroomId);
                toast.success(response.data.message);
                // Refresh all data to ensure consistency across tabs
                fetchAllData();
            } catch (error) {
                toast.error(error.response?.data?.message || "فشل في أرشفة الفصل.");
            } finally {
                setIsArchivingId(null);
            }
        }
    };

    return (
        <>
            <Container fluid>
                <Row>
                    <Col md="12">
                        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '15px' }}>
                            <Card.Header className="bg-white p-4 border-0" style={{ borderRadius: '15px 15px 0 0' }}>
                                <div className="mb-3">
                                    <h4 className="font-weight-bold mb-1" style={{ color: '#2c3e50' }}>إدارة أرشفة الفصول</h4>
                                    <p className="text-muted mb-0 small">إدارة الفصول المنتهية والأرشيف الأكاديمي</p>
                                </div>
                            </Card.Header>
                            <Card.Body className="px-0">
                                <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} id="archiving-tabs" className="mb-3 px-4 border-bottom-0 custom-tabs">
                                    {/* Tab 1: Ready to Archive */}
                                    <Tab eventKey="readyToArchive" title={<><i className="nc-icon nc-box ml-2"></i>جاهز للأرشفة ({readyToArchive.length})</>}>
                                        <div className="px-4">
                                            {loading ? <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div> : (
                                                <Accordion defaultActiveKey="0" className="shadow-sm rounded overflow-hidden mb-4">
                                                    {Object.entries(groupedReadyToArchive).map(([programName, classrooms], index) => (
                                                        <Accordion.Item eventKey={String(index)} key={programName} className="border-0 border-bottom">
                                                            <Accordion.Header className="bg-white">
                                                                <div className="d-flex w-100 justify-content-between align-items-center pr-3">
                                                                    <strong style={{ fontSize: '1.1em' }} className="text-dark">{programName}</strong>
                                                                    <span className="badge bg-light text-primary rounded-pill ml-3 px-3 py-2 border">{classrooms.length} فصول</span>
                                                                </div>
                                                            </Accordion.Header>
                                                            <Accordion.Body className="bg-light p-0">
                                                                {classrooms.length > 0 ? (
                                                                    <Table hover className="mb-0 table-borderless bg-white">
                                                                        <thead>
                                                                            <tr className="border-bottom text-muted small">
                                                                                <th className="py-3 px-4">اسم الفصل</th>
                                                                                <th className="py-3">الدورة</th>
                                                                                <th className="py-3 text-right px-4">الإجراء</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {classrooms.map(c => (
                                                                                <tr key={c.classroomId} className="border-bottom">
                                                                                    <td className="px-4 py-3 align-middle font-weight-bold text-dark">{c.name}</td>
                                                                                    <td className="py-3 align-middle text-muted">{c.courseName}</td>
                                                                                    <td className="py-3 align-middle text-right px-4">
                                                                                        <Button
                                                                                            variant="outline-primary"
                                                                                            size="sm"
                                                                                            className="rounded-pill shadow-sm px-3"
                                                                                            onClick={() => handleArchiveClick(c.classroomId)}
                                                                                            disabled={isArchivingId === c.classroomId}
                                                                                        >
                                                                                            {isArchivingId === c.classroomId ? <Spinner as="span" size="sm" /> : <><i className="nc-icon nc-archive-2 ml-2"></i> أرشفة</>}
                                                                                        </Button>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </Table>
                                                                ) : (
                                                                    <div className="text-center text-muted p-4">لا توجد فصول جاهزة في هذا البرنامج.</div>
                                                                )}
                                                            </Accordion.Body>
                                                        </Accordion.Item>
                                                    ))}
                                                </Accordion>
                                            )}
                                            {readyToArchive.length === 0 && !loading && (
                                                <div className="text-center py-5 text-muted bg-light rounded shadow-sm">
                                                    <i className="nc-icon nc-box display-4 mb-3 d-block opacity-50"></i>
                                                    <h5>لا توجد فصول جاهزة للأرشفة حالياً</h5>
                                                </div>
                                            )}
                                        </div>
                                    </Tab>

                                    {/* Tab 2: Archived Classrooms */}
                                    <Tab eventKey="archived" title={<><i className="nc-icon nc-book-bookmark ml-2"></i>الأرشيف ({archived.length})</>}>
                                        <div className="px-4">
                                            {loading ? <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div> : (
                                                <Accordion className="shadow-sm rounded overflow-hidden">
                                                    {archived.length > 0 ? (
                                                        archived.map((archive, index) => (
                                                            <Accordion.Item eventKey={String(index)} key={archive.archivedClassroomId} className="border-0 border-bottom">
                                                                <Accordion.Header>
                                                                    <Row className="w-100 align-items-center m-0">
                                                                        <Col md={4}>
                                                                            <strong className="text-dark">{archive.name}</strong>
                                                                            <span className="text-muted small d-block d-md-inline ml-md-2">({archive.courseName})</span>
                                                                        </Col>
                                                                        <Col md={4} className="text-center d-none d-md-block text-muted small">
                                                                            <i className="nc-icon nc-single-02 ml-1"></i> {archive.teacherName || "غير محدد"}
                                                                        </Col>
                                                                        <Col md={4} className="text-right text-muted small">
                                                                            <i className="far fa-clock ml-1"></i> {new Date(archive.archivedAt).toLocaleDateString()}
                                                                        </Col>
                                                                    </Row>
                                                                </Accordion.Header>
                                                                <Accordion.Body className="bg-white p-0">
                                                                    <div className="p-3 bg-light border-bottom">
                                                                        <h6 className="mb-0 text-primary font-weight-bold">سجل الطلاب ({archive.enrolledStudents.length} طلاب)</h6>
                                                                    </div>
                                                                    {archive.enrolledStudents.length > 0 ? (
                                                                        <Table striped hover size="sm" className="mb-0">
                                                                            <thead className="text-muted small">
                                                                                <tr>
                                                                                    <th className="border-0 py-2 px-4">الاسم</th>
                                                                                    <th className="border-0 py-2">الرقم الوطني</th>
                                                                                    <th className="border-0 py-2">الدرجة</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {archive.enrolledStudents.map((student, idx) => (
                                                                                    <tr key={idx}>
                                                                                        <td className="px-4 border-top-0">{student.studentName}</td>
                                                                                        <td className="border-top-0">{student.studentNationalId}</td>
                                                                                        <td className="border-top-0 font-weight-bold">{student.finalGrade}</td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </Table>
                                                                    ) : (
                                                                        <div className="text-center text-muted p-3">لم يتم العثور على سجلات طلاب لهذا الفصل.</div>
                                                                    )}
                                                                </Accordion.Body>
                                                            </Accordion.Item>
                                                        ))
                                                    ) : (
                                                        <div className="text-center py-5 text-muted bg-light rounded">
                                                            <i className="nc-icon nc-book-bookmark display-4 mb-3 d-block opacity-50"></i>
                                                            <h5>لا توجد فصول مؤرشفة لعرضها.</h5>
                                                        </div>
                                                    )}
                                                </Accordion>
                                            )}
                                        </div>
                                    </Tab>
                                </Tabs>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default ArchivingManagement;