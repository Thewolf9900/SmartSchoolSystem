// src/views/GraduationManagement.js

import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';

import { getPrograms } from "services/admin/programService";
import { processProgramGraduations, getGraduates, getFailures, uploadCertificate, deleteCertificate } from "services/admin/graduationService";
import  apiClient   from "services/apiConfig";

import {
    Button, Card, Container, Row, Col, Form, Table, Spinner, Modal, Badge, Tabs, Tab, Alert
} from "react-bootstrap";

const GraduationManagement = () => {
    // States
    const [programs, setPrograms] = useState([]);
    const [graduates, setGraduates] = useState([]);
    const [failures, setFailures] = useState([]);

    const [selectedProgramId, setSelectedProgramId] = useState("all");
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());
    const [filterMonth, setFilterMonth] = useState("");

    const [loadingPrograms, setLoadingPrograms] = useState(true);
    const [loadingLists, setLoadingLists] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const [showReportModal, setShowReportModal] = useState(false);
    const [processingReport, setProcessingReport] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedGraduate, setSelectedGraduate] = useState(null);
    const [certificateFile, setCertificateFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const fetchPrograms = async () => {
            try {
                const response = await getPrograms();
                setPrograms(response.data);
            } catch (error) {
                toast.error("فشل في جلب البرامج.");
            } finally {
                setLoadingPrograms(false);
            }
        };
        fetchPrograms();
        fetchLists(); // Initial fetch
    }, []);

    const fetchLists = async () => {
        setLoadingLists(true);
        try {
            const filters = {
                programId: selectedProgramId !== "all" ? parseInt(selectedProgramId, 10) : null,
                year: filterYear ? parseInt(filterYear, 10) : null,
                month: filterMonth ? parseInt(filterMonth, 10) : null,
            };
            const [graduatesRes, failuresRes] = await Promise.all([
                getGraduates(filters),
                getFailures(filters)
            ]);
            setGraduates(graduatesRes.data);
            setFailures(failuresRes.data);
        } catch (error) {
            toast.error("فشل في جلب القوائم.");
        } finally {
            setLoadingLists(false);
        }
    };

    const handleProcessClick = async () => {
        if (selectedProgramId === "all") {
            toast.warn("الرجاء اختيار برنامج محدد.");
            return;
        }
        if (window.confirm(`تأكيد معالجة الطلاب في برنامج "${currentProgram?.name}"؟`)) {
            setIsProcessing(true);
            try {
                const programIdAsNumber = parseInt(selectedProgramId, 10);
                const response = await processProgramGraduations(programIdAsNumber);
                setProcessingReport(response.data);
                setShowReportModal(true);
                fetchLists();
            } catch (error) {
                toast.error("فشل في عملية المعالجة.");
            } finally {
                setIsProcessing(false);
            }
        }
    };

    // --- START: THE FIX IS HERE ---

    // --- START: THE FIX IS HERE ---
    const handleViewCertificate = async (graduationId) => {
        try {
            // 1. اطلب الملف من الخادم باستخدام apiClient المصادق عليه
            const response = await apiClient.get(`/api/admin/graduation/${graduationId}/certificate`, {
                responseType: 'blob', // اطلب الاستجابة كبيانات خام
            });

            // 2. أنشئ رابطًا مؤقتًا في الذاكرة لهذه البيانات
            const file = new Blob([response.data], { type: response.headers['content-type'] });
            const fileURL = URL.createObjectURL(file);

            // 3. افتح هذا الرابط المؤقت في تبويب جديد
            window.open(fileURL, '_blank', 'noopener,noreferrer');

        } catch (error) {
            console.error("Failed to get certificate:", error);
            toast.error("فشل في عرض الشهادة. قد تكون غير موجودة.");
        }
    };
    // --- END: THE FIX ---

    const handleDeleteCertificate = async (graduationId) => {
        if (window.confirm("هل أنت متأكد من رغبتك في حذف هذه الشهادة؟")) {
            try {
                await deleteCertificate(graduationId);
                toast.success("تم حذف الشهادة بنجاح.");
                fetchLists();
            } catch (error) {
                toast.error("فشل في حذف الشهادة.");
            }
        }
    };

    const handleShowUploadModal = (graduate) => {
        setSelectedGraduate(graduate);
        setCertificateFile(null);
        setShowUploadModal(true);
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!certificateFile) { toast.warn("الرجاء اختيار ملف."); return; }
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', certificateFile);
            await uploadCertificate(selectedGraduate.graduationId, formData);
            toast.success("تم رفع الشهادة بنجاح!");
            fetchLists();
            setShowUploadModal(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "فشل في رفع الشهادة.");
        } finally {
            setIsUploading(false);
        }
    };

    const currentProgram = programs.find(p => p.academicProgramId == selectedProgramId);
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <>
            <Container fluid>
                <Row>
                    <Col md="12">
                        <Card>
                            <Card.Header><Card.Title as="h4">إدارة معالجة الطلاب</Card.Title></Card.Header>
                            <Card.Body>
                                <Card className="border shadow-sm mb-4">
                                    <Card.Header className="bg-light"><h5 className="mb-0"><i className="nc-icon nc-zoom-split mr-2"></i>فلاتر البحث</h5></Card.Header>
                                    <Card.Body>
                                        <Row className="align-items-end">
                                            <Col lg={5} md={12}><Form.Group><label>البرنامج الأكاديمي</label>{loadingPrograms ? <Spinner size="sm" /> : (<Form.Select value={selectedProgramId} onChange={(e) => setSelectedProgramId(e.target.value)}><option value="all">كل البرامج</option>{programs.map(p => (<option key={p.academicProgramId} value={p.academicProgramId}>{p.name}</option>))}</Form.Select>)}</Form.Group></Col>
                                            <Col lg={3} md={6}><Form.Group><label>السنة</label><Form.Select value={filterYear} onChange={e => setFilterYear(e.target.value)}><option value="">كل السنوات</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</Form.Select></Form.Group></Col>
                                            <Col lg={2} md={6}><Form.Group><label>الشهر (اختياري)</label><Form.Select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} disabled={!filterYear}><option value="">كل الشهور</option>{months.map(m => <option key={m} value={m}>{m}</option>)}</Form.Select></Form.Group></Col>
                                            <Col lg={2} md={12} className="text-center mt-3 mt-lg-0"><Button className="w-100" variant="primary" onClick={fetchLists} disabled={loadingLists}>بحث</Button></Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                                <Card className="border-primary mb-4">
                                    <Card.Header className="bg-primary text-white"><Card.Title as="h5" className="mb-0"><i className="nc-icon nc-settings-gear-64 mr-2"></i>معالجة دفعة جديدة</Card.Title></Card.Header>
                                    <Card.Body className="text-center">
                                        <p>معالجة الطلاب المستحقين في برنامج <strong>"{selectedProgramId !== 'all' ? currentProgram?.name : 'محدد'}"</strong>.</p>
                                        <Alert variant="warning"><i className="nc-icon nc-alert-circle-i mr-2"></i><strong>تنبيه:</strong> يجب اختيار برنامج محدد لتنفيذ عملية المعالجة.</Alert>
                                        <Button variant="primary" size="lg" onClick={handleProcessClick} disabled={isProcessing || selectedProgramId === 'all'}>{isProcessing ? (<><Spinner as="span" size="sm" /> ...</>) : (<><i className="nc-icon nc-check-2 mr-1"></i> بدء المعالجة</>)}</Button>
                                    </Card.Body>
                                </Card>
                                <Tabs defaultActiveKey="graduates" id="results-tabs" className="mb-3">
                                    <Tab eventKey="graduates" title={<><i className="nc-icon nc-hat-3 mr-2"></i>الخريجون ({graduates.length})</>}>
                                        {loadingLists ? <div className="text-center p-5"><Spinner /></div> : graduates.length > 0 ? (
                                            <Table striped hover responsive>
                                                <thead className="thead-light"><tr><th>الاسم الكامل</th><th>البرنامج</th><th>تاريخ التخرج</th><th>الحالة</th><th className="text-right">الإجراءات</th></tr></thead>
                                                <tbody>
                                                    {graduates.map(g => (
                                                        <tr key={g.graduationId}>
                                                            <td>{`${g.firstName} ${g.lastName}`}</td><td>{g.programName}</td><td>{new Date(g.graduationDate).toLocaleDateString()}</td>
                                                            <td>{g.hasCertificate ? <Badge bg="success">مرفوعة</Badge> : <Badge bg="warning">غير مرفوعة</Badge>}</td>
                                                            <td className="text-right">
                                                                {g.hasCertificate && (
                                                                    <>
                                                                        <Button variant="info" size="sm" className="ml-1" onClick={() => handleViewCertificate(g.graduationId)} title="عرض الشهادة"><i className="nc-icon nc-image-02"></i></Button>
                                                                        <Button variant="danger" size="sm" className="ml-1" onClick={() => handleDeleteCertificate(g.graduationId)} title="حذف الشهادة"><i className="nc-icon nc-simple-remove"></i></Button>
                                                                    </>
                                                                )}
                                                                <Button variant="success" size="sm" onClick={() => handleShowUploadModal(g)} title="رفع أو تعديل الشهادة"><i className="nc-icon nc-cloud-upload-94"></i></Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        ) : <div className="text-center text-muted p-5"><h5>لا يوجد خريجون يطابقون معايير البحث.</h5></div>}
                                    </Tab>
                                    <Tab eventKey="failures" title={<><i className="nc-icon nc-simple-remove mr-2"></i>الراسبون ({failures.length})</>}>
                                        {loadingLists ? <div className="text-center p-5"><Spinner /></div> : failures.length > 0 ? (
                                            <Table striped hover responsive><thead className="thead-light"><tr><th>الاسم الكامل</th><th>البرنامج</th><th>تاريخ الرسوب</th><th>المعدل</th></tr></thead><tbody>{failures.map(f => (<tr key={f.failureId}><td>{`${f.firstName} ${f.lastName}`}</td><td>{f.programName}</td><td>{new Date(f.failureDate).toLocaleDateString()}</td><td>{f.finalGpa.toFixed(2)}</td></tr>))}</tbody></Table>
                                        ) : <div className="text-center text-muted p-5"><h5>لا يوجد راسبون يطابقون معايير البحث.</h5></div>}
                                    </Tab>
                                </Tabs>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
            <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} centered>
                <Form onSubmit={handleUploadSubmit}><Modal.Header closeButton><Modal.Title>رفع شهادة لـ: {selectedGraduate?.firstName}</Modal.Title></Modal.Header><Modal.Body><p>الرجاء اختيار ملف الشهادة (صورة أو PDF).</p><Form.Group><Form.Control type="file" required onChange={e => setCertificateFile(e.target.files[0])} accept="image/*,.pdf" /></Form.Group></Modal.Body><Modal.Footer><Button variant="secondary" onClick={() => setShowUploadModal(false)}>إلغاء</Button><Button variant="primary" type="submit" disabled={isUploading}>{isUploading ? <Spinner as="span" size="sm" /> : "حفظ ورفع"}</Button></Modal.Footer></Form>
            </Modal>
            <Modal show={showReportModal} onHide={() => setShowReportModal(false)} size="lg" centered>
                <Modal.Header closeButton><Modal.Title>تقرير عملية المعالجة</Modal.Title></Modal.Header><Modal.Body>{processingReport ? (<><Alert variant="info">{processingReport.message}</Alert>{processingReport.report && processingReport.report.length > 0 && (<Table striped bordered hover size="sm"><thead><tr><th>اسم الطالب</th><th>الحالة</th><th>المعدل النهائي</th></tr></thead><tbody>{processingReport.report.map(item => (<tr key={item.studentId}><td>{item.studentName}</td><td>{item.status === 'Graduated' ? <Badge bg="success">ناجح</Badge> : <Badge bg="danger">راسب</Badge>}</td><td>{item.finalGpa.toFixed(2)}</td></tr>))}</tbody></Table>)}</>) : <Spinner />}</Modal.Body><Modal.Footer><Button variant="secondary" onClick={() => setShowReportModal(false)}>إغلاق</Button></Modal.Footer>
            </Modal>
        </>
    );
};

export default GraduationManagement;