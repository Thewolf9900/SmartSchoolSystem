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
                        <Card>
                            <Card.Header><Card.Title as="h4">إدارة أرشفة الفصول</Card.Title></Card.Header>
                            <Card.Body>
                                <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} id="archiving-tabs" className="mb-3">

                                    {/* Tab 1: Ready to Archive */}
                                    <Tab eventKey="readyToArchive" title={<><i className="nc-icon nc-box mr-2"></i>جاهز للأرشفة ({readyToArchive.length})</>}>
                                        {loading ? <div className="text-center p-5"><Spinner /></div> : (
                                            <Accordion defaultActiveKey="0">
                                                {Object.entries(groupedReadyToArchive).map(([programName, classrooms], index) => (
                                                    <Accordion.Item eventKey={String(index)} key={programName}>
                                                        <Accordion.Header>
                                                            <strong>{programName}</strong>
                                                            <span className="badge bg-primary ml-2">{classrooms.length} فصول</span>
                                                        </Accordion.Header>
                                                        <Accordion.Body>
                                                            {classrooms.length > 0 ? (
                                                                <Table striped hover responsive>
                                                                    <thead className="thead-light">
                                                                        <tr><th>اسم الفصل</th><th>الدورة</th><th className="text-right">الإجراء</th></tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {classrooms.map(c => (
                                                                            <tr key={c.classroomId}>
                                                                                <td><strong>{c.name}</strong></td>
                                                                                <td>{c.courseName}</td>
                                                                                <td className="text-right">
                                                                                    <Button variant="primary" onClick={() => handleArchiveClick(c.classroomId)} disabled={isArchivingId === c.classroomId}>
                                                                                        {isArchivingId === c.classroomId ? <Spinner as="span" size="sm" /> : <><i className="nc-icon nc-archive-2 mr-1"></i> أرشفة</>}
                                                                                    </Button>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </Table>
                                                            ) : (
                                                                <div className="text-center text-muted p-3">لا توجد فصول جاهزة في هذا البرنامج.</div>
                                                            )}
                                                        </Accordion.Body>
                                                    </Accordion.Item>
                                                ))}
                                            </Accordion>
                                        )}
                                    </Tab>

                                    {/* Tab 2: Archived Classrooms (New Design) */}
                                    <Tab eventKey="archived" title={<><i className="nc-icon nc-book-bookmark mr-2"></i>الأرشيف ({archived.length})</>}>
                                        {loading ? <div className="text-center p-5"><Spinner /></div> : (
                                            <Accordion>
                                                {archived.length > 0 ? (
                                                    archived.map((archive, index) => (
                                                        <Accordion.Item eventKey={String(index)} key={archive.archivedClassroomId}>
                                                            <Accordion.Header>
                                                                <Row className="w-100 align-items-center">
                                                                    <Col><strong>{archive.name}</strong> <small className="text-muted">({archive.courseName})</small></Col>
                                                                    <Col className="text-center d-none d-lg-block"><small>المدرس:</small> {archive.teacherName || "غير محدد"}</Col>
                                                                    <Col className="text-right"><small>تاريخ الأرشفة:</small> {new Date(archive.archivedAt).toLocaleDateString()}</Col>
                                                                </Row>
                                                            </Accordion.Header>
                                                            <Accordion.Body>
                                                                <h6>سجل الطلاب في هذا الفصل ({archive.enrolledStudents.length} طلاب)</h6>
                                                                {archive.enrolledStudents.length > 0 ? (
                                                                    <Table striped bordered hover size="sm">
                                                                        <thead>
                                                                            <tr>
                                                                                <th>اسم الطالب</th>
                                                                                <th>الرقم الوطني للطالب</th>
                                                                                <th>الدرجة النهائية</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {archive.enrolledStudents.map((student, idx) => (
                                                                                <tr key={idx}>
                                                                                    <td>{student.studentName}</td>
                                                                                    <td>{student.studentNationalId}</td>
                                                                                    <td>{student.finalGrade}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </Table>
                                                                ) : (
                                                                    <p className="text-muted">لم يتم العثور على سجلات طلاب لهذا الفصل.</p>
                                                                )}
                                                            </Accordion.Body>
                                                        </Accordion.Item>
                                                    ))
                                                ) : (
                                                    <div className="text-center text-muted p-5"><h5>لا توجد فصول مؤرشفة لعرضها.</h5></div>
                                                )}
                                            </Accordion>
                                        )}
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