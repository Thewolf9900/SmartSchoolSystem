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

    return (
        <>
            <Container fluid>
                <Row>
                    <Col md="12">
                        <Card>
                            <Card.Header><Card.Title as="h4">إدارة المواد المرجعية للدورات</Card.Title></Card.Header>
                            <Card.Body>
                                {loading ? <div className="text-center"><Spinner animation="border" /></div> : (<Row className="mb-3"><Col md={6}><Form.Group><label className="font-weight-bold">اختر البرنامج</label><Form.Select value={selectedProgramId} onChange={(e) => setSelectedProgramId(e.target.value)}>{programs.map(p => (<option key={p.academicProgramId} value={p.academicProgramId}>{p.name}</option>))}</Form.Select></Form.Group></Col><Col md={6}><Form.Group><label className="font-weight-bold">اختر الدورة</label><Form.Select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} disabled={filteredCourses.length === 0}>{filteredCourses.length > 0 ? filteredCourses.map(c => (<option key={c.courseId} value={c.courseId}>{c.name}</option>)) : <option>لا توجد دورات</option>}</Form.Select></Form.Group></Col></Row>)}
                                <hr />
                                <Card className="border shadow-sm"><Card.Header className="bg-light"><Row className="align-items-center"><Col><h5 className="mb-0">المواد لدورة: <span className="text-primary">{currentCourse?.name}</span></h5></Col><Col className="text-right"><Button variant="primary" onClick={handleShowAddModal} disabled={!selectedCourseId}><i className="fas fa-plus mr-1"></i> إضافة مادة</Button></Col></Row></Card.Header>
                                    <Card.Body>
                                        {loadingMaterials ? <div className="text-center p-5"><Spinner animation="border" /></div> : materials.length > 0 ? (
                                            <Table striped hover responsive>
                                                <thead className="thead-light"><tr><th>العنوان</th><th>النوع</th><th>تاريخ الإضافة</th><th className="text-right">الإجراءات</th></tr></thead>
                                                <tbody>{materials.map(material => (<tr key={material.materialId}><td><strong>{material.title}</strong><br /><small className="text-muted">{material.description}</small></td><td>{material.materialType === 'File' ? <Badge bg="info">ملف</Badge> : <Badge bg="success">رابط</Badge>}</td><td>{new Date(material.uploadedAt).toLocaleDateString()}</td><td className="text-right"><Button variant="link" className="p-1 text-info" onClick={() => handleDownload(material)} title={material.materialType === 'File' ? 'تحميل الملف' : 'فتح الرابط'}><i className="fas fa-download"></i></Button><Button variant="link" className="p-1 text-warning" onClick={() => handleShowEditModal(material)} title="تعديل"><i className="fas fa-edit"></i></Button><Button variant="link" className="p-1 text-danger" onClick={() => handleDelete(material.materialId)} title="حذف"><i className="fas fa-trash"></i></Button></td></tr>))}</tbody>
                                            </Table>
                                        ) : (<div className="text-center text-muted p-5"><h5>لا توجد مواد مرجعية.</h5></div>)}
                                    </Card.Body>
                                </Card>
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