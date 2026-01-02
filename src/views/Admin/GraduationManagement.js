// src/views/GraduationManagement.js

import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';

import { getPrograms } from "services/admin/programService";
import { processProgramGraduations, getGraduates, getFailures, uploadCertificate, deleteCertificate } from "services/admin/graduationService";
import apiClient from "services/apiConfig";

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

    const renderMobileCards = (list, isFailureList = false) => {
        return list.map((item) => (
            <Card key={isFailureList ? item.failureId : item.graduationId} className="mb-3 shadow-sm border-0">
                <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="font-weight-bold mb-0 text-truncate" style={{ maxWidth: '70%' }}>{`${item.firstName} ${item.lastName}`}</h6>
                        {isFailureList ?
                            <span className="badge bg-danger rounded-pill small px-2 py-1">GPA: {item.finalGpa.toFixed(2)}</span> :
                            (item.hasCertificate ? <span className="badge bg-success rounded-pill small px-2 py-1">مرفوعة</span> : <span className="badge bg-warning text-dark rounded-pill small px-2 py-1">غير مرفوعة</span>)
                        }
                    </div>
                    <div className="mb-2 text-muted small">
                        <i className="fas fa-graduation-cap mr-1"></i> {item.programName}
                    </div>
                    <div className="mb-3 text-muted small">
                        <i className="far fa-calendar-alt mr-1"></i> {new Date(isFailureList ? item.failureDate : item.graduationDate).toLocaleDateString()}
                    </div>
                    <hr className="my-2" />
                    {!isFailureList && (
                        <div className="d-flex justify-content-end">
                            {item.hasCertificate && (
                                <>
                                    <Button variant="outline-info" size="sm" className="rounded-circle shadow-sm mx-1" onClick={() => handleViewCertificate(item.graduationId)} style={{ width: '35px', height: '35px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><i className="nc-icon nc-image-02"></i></Button>
                                    <Button variant="outline-danger" size="sm" className="rounded-circle shadow-sm mx-1" onClick={() => handleDeleteCertificate(item.graduationId)} style={{ width: '35px', height: '35px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><i className="nc-icon nc-simple-remove"></i></Button>
                                </>
                            )}
                            <Button variant="outline-success" size="sm" className="rounded-circle shadow-sm" onClick={() => handleShowUploadModal(item)} style={{ width: '35px', height: '35px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><i className="nc-icon nc-cloud-upload-94"></i></Button>
                        </div>
                    )}
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
                                        <h4 className="font-weight-bold mb-1" style={{ color: '#2c3e50' }}>إدارة التخرج والشهادات</h4>
                                        <p className="text-muted mb-0 small">معالجة الخريجين، إدارة الشهادات، وعرض قوائم الناجحين والراسبين</p>
                                    </div>
                                    <Button
                                        variant="primary"
                                        className="btn-fill rounded-pill px-4 shadow-sm"
                                        onClick={handleProcessClick}
                                        disabled={isProcessing || selectedProgramId === 'all'}
                                        title="يجب اختيار برنامج محدد أولاً"
                                    >
                                        {isProcessing ? (<><Spinner as="span" size="sm" className="ml-2" /> جارٍ المعالجة...</>) : (<><i className="nc-icon nc-settings-gear-64 ml-2"></i> معالجة دفعة جديدة</>)}
                                    </Button>
                                </div>

                                <Card className="bg-light border-0 shadow-none mb-0">
                                    <Card.Body className="py-3 px-4">
                                        <Row className="align-items-end">
                                            <Col lg={4} md={12}>
                                                <Form.Group className="mb-md-0">
                                                    <label className="text-muted font-weight-bold small mb-2">البرنامج الأكاديمي</label>
                                                    {loadingPrograms ? <Spinner size="sm" /> : (
                                                        <Form.Select
                                                            value={selectedProgramId}
                                                            onChange={(e) => setSelectedProgramId(e.target.value)}
                                                            className="rounded-pill border-0 shadow-sm"
                                                            style={{ height: '45px' }}
                                                        >
                                                            <option value="all">كل البرامج</option>
                                                            {programs.map(p => (<option key={p.academicProgramId} value={p.academicProgramId}>{p.name}</option>))}
                                                        </Form.Select>
                                                    )}
                                                </Form.Group>
                                            </Col>
                                            <Col lg={3} md={6}>
                                                <Form.Group className="mb-md-0">
                                                    <label className="text-muted font-weight-bold small mb-2">السنة</label>
                                                    <Form.Select
                                                        value={filterYear}
                                                        onChange={e => setFilterYear(e.target.value)}
                                                        className="rounded-pill border-0 shadow-sm"
                                                        style={{ height: '45px' }}
                                                    >
                                                        <option value="">كل السنوات</option>
                                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col lg={3} md={6}>
                                                <Form.Group className="mb-md-0">
                                                    <label className="text-muted font-weight-bold small mb-2">الشهر (اختياري)</label>
                                                    <Form.Select
                                                        value={filterMonth}
                                                        onChange={e => setFilterMonth(e.target.value)}
                                                        disabled={!filterYear}
                                                        className="rounded-pill border-0 shadow-sm"
                                                        style={{ height: '45px' }}
                                                    >
                                                        <option value="">كل الشهور</option>
                                                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col lg={2} md={12} className="text-center mt-3 mt-lg-0">
                                                <Button
                                                    className="w-100 rounded-pill btn-fill shadow-sm"
                                                    variant="info"
                                                    onClick={fetchLists}
                                                    disabled={loadingLists}
                                                    style={{ height: '45px' }}
                                                >
                                                    {loadingLists ? <Spinner size="sm" /> : "بحث"}
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            </Card.Header>

                            <Card.Body className="px-0">
                                <Tabs defaultActiveKey="graduates" id="results-tabs" className="mb-3 px-4 border-bottom-0 custom-tabs">
                                    <Tab eventKey="graduates" title={<><i className="nc-icon nc-hat-3 ml-2"></i>الخريجون ({graduates.length})</>}>
                                        <div className="d-none d-md-block">
                                            {loadingLists ? <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div> : graduates.length > 0 ? (
                                                <Table className="table-hover mb-0" responsive>
                                                    <thead className="bg-light text-muted small"><tr><th className="border-0 font-weight-bold py-3 px-4">الاسم الكامل</th><th className="border-0 font-weight-bold py-3">البرنامج</th><th className="border-0 font-weight-bold py-3">تاريخ التخرج</th><th className="border-0 font-weight-bold py-3">الحالة</th><th className="border-0 font-weight-bold py-3 text-right px-4">الإجراءات</th></tr></thead>
                                                    <tbody>
                                                        {graduates.map(g => (
                                                            <tr key={g.graduationId}>
                                                                <td className="align-middle px-4 py-3 font-weight-bold">{`${g.firstName} ${g.lastName}`}</td>
                                                                <td className="align-middle py-3 text-muted">{g.programName}</td>
                                                                <td className="align-middle py-3 text-muted">{new Date(g.graduationDate).toLocaleDateString()}</td>
                                                                <td className="align-middle py-3">{g.hasCertificate ? <Badge className="rounded-pill px-3 py-2" bg="success">مرفوعة</Badge> : <Badge className="rounded-pill px-3 py-2" bg="warning" text="dark">غير مرفوعة</Badge>}</td>
                                                                <td className="align-middle py-3 text-right px-4">
                                                                    {g.hasCertificate && (
                                                                        <>
                                                                            <Button variant="outline-info" size="sm" className="rounded-circle shadow-sm mx-1" onClick={() => handleViewCertificate(g.graduationId)} title="عرض الشهادة" style={{ width: '35px', height: '35px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><i className="nc-icon nc-image-02"></i></Button>
                                                                            <Button variant="outline-danger" size="sm" className="rounded-circle shadow-sm mx-1" onClick={() => handleDeleteCertificate(g.graduationId)} title="حذف الشهادة" style={{ width: '35px', height: '35px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><i className="nc-icon nc-simple-remove"></i></Button>
                                                                        </>
                                                                    )}
                                                                    <Button variant="outline-success" size="sm" className="rounded-circle shadow-sm" onClick={() => handleShowUploadModal(g)} title="رفع أو تعديل الشهادة" style={{ width: '35px', height: '35px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><i className="nc-icon nc-cloud-upload-94"></i></Button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            ) : <div className="text-center text-muted p-5"><h5>لا يوجد خريجون يطابقون معايير البحث.</h5></div>}
                                        </div>
                                        {/* Mobile View */}
                                        <div className="d-md-none px-3">
                                            {loadingLists ? <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div> : (graduates.length > 0 ? renderMobileCards(graduates) : <div className="text-center text-muted p-5"><h5>لا يوجد خريجون.</h5></div>)}
                                        </div>
                                    </Tab>

                                    <Tab eventKey="failures" title={<><i className="nc-icon nc-simple-remove ml-2"></i>الراسبون ({failures.length})</>}>
                                        <div className="d-none d-md-block">
                                            {loadingLists ? <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div> : failures.length > 0 ? (
                                                <Table className="table-hover mb-0" responsive><thead className="bg-light text-muted small"><tr><th className="border-0 font-weight-bold py-3 px-4">الاسم الكامل</th><th className="border-0 font-weight-bold py-3">البرنامج</th><th className="border-0 font-weight-bold py-3">تاريخ الرسوب</th><th className="border-0 font-weight-bold py-3">المعدل</th></tr></thead><tbody>{failures.map(f => (<tr key={f.failureId}><td className="align-middle px-4 py-3 font-weight-bold">{`${f.firstName} ${f.lastName}`}</td><td className="align-middle py-3 text-muted">{f.programName}</td><td className="align-middle py-3 text-muted">{new Date(f.failureDate).toLocaleDateString()}</td><td className="align-middle py-3 font-weight-bold text-danger">{f.finalGpa.toFixed(2)}</td></tr>))}</tbody></Table>
                                            ) : <div className="text-center text-muted p-5"><h5>لا يوجد راسبون يطابقون معايير البحث.</h5></div>}
                                        </div>
                                        {/* Mobile View */}
                                        <div className="d-md-none px-3">
                                            {loadingLists ? <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div> : (failures.length > 0 ? renderMobileCards(failures, true) : <div className="text-center text-muted p-5"><h5>لا يوجد راسبون.</h5></div>)}
                                        </div>
                                    </Tab>
                                </Tabs>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>

            <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} centered>
                <Form onSubmit={handleUploadSubmit}>
                    <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="font-weight-bold">رفع شهادة</Modal.Title></Modal.Header>
                    <Modal.Body>
                        <p className="text-muted mb-3">رفع شهادة للطالب: <strong>{selectedGraduate?.firstName} {selectedGraduate?.lastName}</strong></p>
                        <Form.Group>
                            <Form.Control type="file" required onChange={e => setCertificateFile(e.target.files[0])} accept="image/*,.pdf" className="rounded-pill shadow-sm border-light p-1" style={{ lineHeight: '30px' }} />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="border-0">
                        <Button variant="light" onClick={() => setShowUploadModal(false)} className="rounded-pill px-4">إلغاء</Button>
                        <Button variant="primary" type="submit" disabled={isUploading} className="btn-fill rounded-pill px-4 shadow-sm">{isUploading ? <Spinner as="span" size="sm" /> : "حفظ ورفع"}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Modal show={showReportModal} onHide={() => setShowReportModal(false)} size="lg" centered>
                <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="font-weight-bold">تقرير عملية المعالجة</Modal.Title></Modal.Header>
                <Modal.Body className="pt-3">
                    {processingReport ? (
                        <>
                            <div className={`alert ${processingReport.success ? 'alert-success' : 'alert-info'} border-0 shadow-sm rounded-pill px-4`}>
                                <i className="nc-icon nc-bell-55 ml-2"></i> {processingReport.message}
                            </div>
                            {processingReport.report && processingReport.report.length > 0 && (
                                <Table striped bordered hover size="sm" className="mt-3">
                                    <thead className="bg-light"><tr><th>اسم الطالب</th><th>الحالة</th><th>المعدل النهائي</th></tr></thead>
                                    <tbody>{processingReport.report.map(item => (<tr key={item.studentId}><td>{item.studentName}</td><td>{item.status === 'Graduated' ? <Badge bg="success" className="rounded-pill">ناجح</Badge> : <Badge bg="danger" className="rounded-pill">راسب</Badge>}</td><td>{item.finalGpa.toFixed(2)}</td></tr>))}</tbody>
                                </Table>
                            )}
                        </>
                    ) : <div className="text-center p-4"><Spinner /></div>}
                </Modal.Body>
                <Modal.Footer className="border-0"><Button variant="secondary" onClick={() => setShowReportModal(false)} className="rounded-pill px-4">إغلاق</Button></Modal.Footer>
            </Modal>
        </>
    );
};

export default GraduationManagement;