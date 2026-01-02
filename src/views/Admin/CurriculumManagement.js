// src/views/CurriculumManagement.js

import React, { useState, useEffect, useMemo } from "react";
import { toast } from 'react-toastify';
import { getCourses } from "../../services/admin/courseService";
import { getPrograms as getAllPrograms } from "../../services/admin/programService";
import {
    getCourseMaterials,
    addCourseMaterial,
    updateMaterial,
    deleteMaterial,
    downloadAdminMaterial
} from "../../services/admin/materialService";

import { Button, Card, Container, Row, Col, Form, Table, Modal, Badge, Spinner } from "react-bootstrap";

const CurriculumManagement = () => {
    const [programs, setPrograms] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedProgramId, setSelectedProgramId] = useState("");
    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMaterials, setLoadingMaterials] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [currentMaterial, setCurrentMaterial] = useState(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [materialType, setMaterialType] = useState('File');
    const [file, setFile] = useState(null);
    const [url, setUrl] = useState("");

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [programsRes, coursesRes] = await Promise.all([getAllPrograms(), getCourses()]);
                setPrograms(programsRes.data);
                setCourses(coursesRes.data);
                if (programsRes.data.length > 0) setSelectedProgramId(programsRes.data[0].academicProgramId);
            } catch (error) {
                toast.error("فشل في جلب البيانات الأساسية.");
            } finally { setLoading(false); }
        };
        fetchInitialData();
    }, []);

    const filteredCourses = useMemo(() => {
        if (!selectedProgramId) return [];
        return courses.filter(c => c.academicProgramId == selectedProgramId);
    }, [selectedProgramId, courses]);

    useEffect(() => {
        if (filteredCourses.length > 0) setSelectedCourseId(filteredCourses[0].courseId);
        else setSelectedCourseId("");
    }, [filteredCourses]);

    useEffect(() => {
        if (!selectedCourseId) { setMaterials([]); return; }
        const fetchMaterials = async () => {
            setLoadingMaterials(true);
            try {
                const response = await getCourseMaterials(selectedCourseId);
                setMaterials(response.data);
            } catch (error) {
                toast.error("فشل في جلب مواد الدورة.");
            } finally { setLoadingMaterials(false); }
        };
        fetchMaterials();
    }, [selectedCourseId]);

    const handleDownload = async (material) => {
        // بالنسبة للروابط، يبقى السلوك كما هو
        if (material.materialType === 'Link') {
            window.open(material.url, '_blank', 'noopener,noreferrer');
            return;
        }

        // بالنسبة للملفات، نستدعي دالة الخدمة الجديدة والآمنة
        if (material.materialType === 'File') {
            try {
                toast.info("جاري تجهيز الملف للتحميل...");
                await downloadAdminMaterial(material.materialId, material.originalFilename);
            } catch (error) {
                // رسالة الخطأ يتم التعامل معها الآن داخل الخدمة نفسها (alert)
                console.error("Download failed from component:", error);
            }
        }
    };

    const handleDelete = async (materialId) => {
        if (window.confirm("هل أنت متأكد من حذف هذه المادة؟")) {
            try {
                await deleteMaterial(materialId);
                setMaterials(materials.filter(m => m.materialId !== materialId));
                toast.success("تم حذف المادة بنجاح.");
            } catch (error) { toast.error("فشل في حذف المادة." + (error.response?.data || "")); }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (isEditMode) {
                await updateMaterial(currentMaterial.materialId, { title, description });
                setMaterials(materials.map(m => m.materialId === currentMaterial.materialId ? { ...m, title, description } : m));
                toast.success("تم تعديل المادة بنجاح.");
            } else {
                const formData = new FormData();
                formData.append('Title', title);
                formData.append('Description', description);
                if (materialType === 'File' && file) formData.append('File', file);
                else if (materialType === 'Link' && url) formData.append('Url', url);
                await addCourseMaterial(selectedCourseId, formData);
                const response = await getCourseMaterials(selectedCourseId);
                setMaterials(response.data);
                toast.success("تمت إضافة المادة بنجاح.");
            }
            setShowModal(false);
        } catch (error) {
            toast.error("فشل في حفظ التغييرات." + (error.response?.data || ""));
        } finally { setSubmitting(false); }
    };

    const resetForm = () => { setTitle(""); setDescription(""); setMaterialType("File"); setFile(null); setUrl(""); setCurrentMaterial(null); };
    const handleShowAddModal = () => { resetForm(); setIsEditMode(false); setShowModal(true); };
    const handleShowEditModal = (material) => { resetForm(); setIsEditMode(true); setCurrentMaterial(material); setTitle(material.title); setDescription(material.description || ""); setShowModal(true); };
    const currentCourse = courses.find(c => c.courseId == selectedCourseId);

    const renderTableBody = () => {
        if (loadingMaterials) { return (<tr><td colSpan="4" className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>); }
        if (materials.length === 0) { return (<tr><td colSpan="4" className="text-center py-5"><div className="text-muted"><i className="fas fa-folder-open fa-2x mb-3 d-block"></i>لا توجد مواد مرجعية لهذه الدورة.</div></td></tr>); }

        return materials.map((material) => (
            <tr key={material.materialId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td className="align-middle pl-4">
                    <span className="font-weight-bold text-dark d-block">{material.title}</span>
                    <small className="text-muted">{material.description || '-'}</small>
                </td>
                <td className="align-middle">
                    {material.materialType === 'File' ?
                        <Badge bg="info" className="px-2 py-1"><i className="fas fa-file-alt mr-1"></i> ملف</Badge> :
                        <Badge bg="success" className="px-2 py-1"><i className="fas fa-link mr-1"></i> رابط</Badge>
                    }
                </td>
                <td className="align-middle text-muted small">{new Date(material.uploadedAt).toLocaleDateString()}</td>
                <td className="text-right pr-4 align-middle">
                    <Button
                        variant="outline-info"
                        size="sm"
                        className="mx-1 rounded"
                        onClick={() => handleDownload(material)}
                        title={material.materialType === 'File' ? 'تحميل الملف' : 'فتح الرابط'}
                        style={{ width: '35px', height: '35px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <i className={material.materialType === 'File' ? "fas fa-download" : "fas fa-external-link-alt"}></i>
                    </Button>
                    <Button
                        variant="outline-warning"
                        size="sm"
                        className="mx-1 rounded"
                        onClick={() => handleShowEditModal(material)}
                        title="تعديل"
                        style={{ width: '35px', height: '35px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <i className="fas fa-pen"></i>
                    </Button>
                    <Button
                        variant="outline-danger"
                        size="sm"
                        className="mx-1 rounded"
                        onClick={() => handleDelete(material.materialId)}
                        title="حذف"
                        style={{ width: '35px', height: '35px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <i className="fas fa-trash"></i>
                    </Button>
                </td>
            </tr>
        ));
    };

    const renderMobileCards = () => {
        if (loadingMaterials) { return (<div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>); }
        if (materials.length === 0) { return (<div className="text-center py-5 text-muted">لا توجد مواد مرجعية.</div>); }

        return materials.map((material) => (
            <Card key={material.materialId} className="mb-3 border shadow-sm">
                <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center">
                            <div className="rounded-circle d-flex align-items-center justify-content-center mr-2" style={{ width: '40px', height: '40px', backgroundColor: material.materialType === 'File' ? '#e3f2fd' : '#d4edda', color: material.materialType === 'File' ? '#007bff' : '#28a745' }}>
                                <i className={material.materialType === 'File' ? "fas fa-file-alt" : "fas fa-link"}></i>
                            </div>
                            <div>
                                <h6 className="font-weight-bold mb-0 text-dark">{material.title}</h6>
                                <small className="text-muted">{new Date(material.uploadedAt).toLocaleDateString()}</small>
                            </div>
                        </div>
                        {material.materialType === 'File' ? <Badge bg="info">ملف</Badge> : <Badge bg="success">رابط</Badge>}
                    </div>
                    {material.description && <div className="mb-3 text-muted small border-bottom pb-2">{material.description}</div>}

                    <div className="d-flex justify-content-end pt-2">
                        <Button variant="outline-info" size="sm" className="ml-2 rounded" onClick={() => handleDownload(material)}>
                            <i className={material.materialType === 'File' ? "fas fa-download mr-1" : "fas fa-external-link-alt mr-1"}></i> {material.materialType === 'File' ? 'تحميل' : 'فتح'}
                        </Button>
                        <Button variant="outline-warning" size="sm" className="ml-2 rounded" onClick={() => handleShowEditModal(material)}>
                            <i className="fas fa-pen mr-1"></i> تعديل
                        </Button>
                        <Button variant="outline-danger" size="sm" className="rounded" onClick={() => handleDelete(material.materialId)}>
                            <i className="fas fa-trash mr-1"></i> حذف
                        </Button>
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
                                        <h4 className="font-weight-bold mb-1" style={{ color: '#2c3e50' }}>إدارة المناهج الأكاديمية</h4>
                                        <p className="text-muted mb-0 small">إدارة الملفات والروابط المرجعية للدورات</p>
                                    </div>
                                    <div className="mt-3 mt-md-0 d-flex flex-column flex-md-row align-items-stretch align-items-md-center">
                                        <Button variant="primary" className="shadow-sm btn-fill rounded-pill px-4 py-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'auto', whiteSpace: 'nowrap' }} onClick={handleShowAddModal} disabled={!selectedCourseId}>
                                            <i className="fas fa-plus ml-2"></i> إضافة مادة جديدة
                                        </Button>
                                    </div>
                                </div>

                                <Row className="bg-light p-3 rounded mx-0">
                                    <Col md={6} className="mb-3 mb-md-0">
                                        <Form.Group className="mb-0">
                                            <Form.Label className="small font-weight-bold text-muted">البرنامج الأكاديمي</Form.Label>
                                            <Form.Select value={selectedProgramId} onChange={(e) => setSelectedProgramId(e.target.value)} className="shadow-sm py-2 rounded-pill" style={{ height: 'auto' }}>
                                                {programs.map(p => (<option key={p.academicProgramId} value={p.academicProgramId}>{p.name}</option>))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-0">
                                            <Form.Label className="small font-weight-bold text-muted">الدورة الدراسية</Form.Label>
                                            <Form.Select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} disabled={filteredCourses.length === 0} className="shadow-sm py-2 rounded-pill" style={{ height: 'auto' }}>
                                                {filteredCourses.length > 0 ? filteredCourses.map(c => (<option key={c.courseId} value={c.courseId}>{c.name}</option>)) : <option>لا توجد دورات</option>}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Header>

                            <Card.Body className="px-0">
                                {selectedCourseId ? (
                                    <>
                                        <div className="d-none d-md-block table-responsive">
                                            <Table className="table-hover mb-0">
                                                <thead className="bg-light">
                                                    <tr>
                                                        <th className="border-0 py-3 pl-4 text-muted small font-weight-bold align-middle">العنوان / الوصف</th>
                                                        <th className="border-0 py-3 text-muted small font-weight-bold align-middle">النوع</th>
                                                        <th className="border-0 py-3 text-muted small font-weight-bold align-middle">تاريخ الإضافة</th>
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
                                    </>
                                ) : (
                                    <div className="text-center py-5 text-muted">يرجى اختيار دورة لعرض المواد</div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Form onSubmit={handleSubmit}><Modal.Header closeButton><Modal.Title>{isEditMode ? "تعديل مادة" : "إضافة مادة"}</Modal.Title></Modal.Header><Modal.Body><Form.Group className="mb-3"><Form.Label>عنوان المادة</Form.Label><Form.Control type="text" value={title} onChange={e => setTitle(e.target.value)} required /></Form.Group><Form.Group className="mb-3"><Form.Label>وصف (اختياري)</Form.Label><Form.Control as="textarea" rows={2} value={description} onChange={e => setDescription(e.target.value)} /></Form.Group>{!isEditMode && (<><hr /><Form.Group className="mb-3"><Form.Label>نوع المادة</Form.Label><div><Form.Check inline type="radio" label="ملف" name="materialType" checked={materialType === 'File'} onChange={() => setMaterialType('File')} /><Form.Check inline type="radio" label="رابط" name="materialType" checked={materialType === 'Link'} onChange={() => setMaterialType('Link')} /></div></Form.Group>{materialType === 'File' ? (<Form.Group><Form.Label>اختر الملف</Form.Label><Form.Control type="file" required onChange={e => setFile(e.target.files[0])} accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx" /></Form.Group>) : (<Form.Group><Form.Label>أدخل الرابط</Form.Label><Form.Control type="url" value={url} onChange={e => setUrl(e.target.value)} required /></Form.Group>)}</>)}</Modal.Body><Modal.Footer><Button variant="secondary" onClick={() => setShowModal(false)}>إلغاء</Button><Button variant="primary" type="submit" disabled={submitting}>{submitting ? <Spinner as="span" size="sm" /> : "حفظ"}</Button></Modal.Footer></Form>
            </Modal>
        </>
    );
};

export default CurriculumManagement;