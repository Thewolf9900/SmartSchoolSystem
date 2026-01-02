import React, { useState, useEffect } from 'react';
import {
    Container, Row, Col, Card, Table, Button, Modal, Form, Spinner, InputGroup, FormControl,
} from 'react-bootstrap';
import { toast } from 'react-toastify';

import * as announcementService from 'services/admin/announcementService.js';
import * as programService from 'services/admin/programService.js';
import * as courseService from 'services/admin/courseService.js';
import * as classroomService from 'services/admin/classroomService.js';

const SCOPE_MAP = { GLOBAL: 0, PROGRAM: 1, COURSE: 2, CLASSROOM: 3 };
const INITIAL_FORM_STATE = { title: '', content: '', targetScope: 'GLOBAL', targetId: '' };

function AnnouncementManagement() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);

    const [availableScopes, setAvailableScopes] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [courses, setCourses] = useState([]);
    const [classrooms, setClassrooms] = useState([]);

    // حالات للتحكم في القوائم المترابطة داخل النافذة
    const [selectedModalProgram, setSelectedModalProgram] = useState('');
    const [selectedModalCourse, setSelectedModalCourse] = useState('');

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [annRes, progRes, courseRes, classRes, scopeRes] = await Promise.all([
                announcementService.getAnnouncements(),
                programService.getPrograms(),
                courseService.getCourses(),
                classroomService.getClassrooms(),
                announcementService.getAvailableAnnouncementScopes(),
            ]);
            setAnnouncements(annRes.data || []);
            setPrograms(progRes.data || []);
            setCourses(courseRes.data || []);
            setClassrooms(classRes.data || []);
            setAvailableScopes(scopeRes.data || []);
        } catch (error) {
            toast.error("فشل تحميل البيانات. يرجى تحديث الصفحة.");
        } finally {
            setLoading(false);
        }
    };

    const refetchAnnouncements = async () => {
        try {
            const res = await announcementService.getAnnouncements();
            setAnnouncements(res.data || []);
        } catch (error) { toast.error("فشل تحديث قائمة الإعلانات."); }
    };

    const handleShowAddModal = () => {
        setIsReadOnly(false);
        const defaultScope = availableScopes.includes("GLOBAL") ? "GLOBAL" : (availableScopes[0] || '');
        setFormData({ ...INITIAL_FORM_STATE, targetScope: defaultScope });
        setSelectedModalProgram('');
        setSelectedModalCourse('');
        setShowModal(true);
    };

    const handleShowViewModal = (announcement) => {
        setIsReadOnly(true);
        setFormData({ ...announcement, targetId: announcement.targetId || '' });
        setShowModal(true);
    };

    const handleCloseModal = () => setShowModal(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };
        if (name === 'targetScope') {
            newFormData.targetId = '';
            setSelectedModalProgram('');
            setSelectedModalCourse('');
        }
        setFormData(newFormData);
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.content) {
            return toast.warn("يرجى ملء العنوان والمحتوى.");
        }

        const payload = {
            title: formData.title,
            content: formData.content,
            targetScope: SCOPE_MAP[formData.targetScope],
            targetId: null
        };

        if (formData.targetScope !== 'GLOBAL') {
            if (!formData.targetId) {
                return toast.warn("يرجى تحديد هدف للإعلان المخصص.");
            }
            payload.targetId = parseInt(formData.targetId, 10);
        }

        try {
            await announcementService.createAnnouncement(payload);
            toast.success('تم إنشاء الإعلان بنجاح!');
            handleCloseModal();
            refetchAnnouncements();
        } catch (error) {
            toast.error(error.response?.data?.message || "فشل إنشاء الإعلان.");
        }
    };

    const handleDelete = async (announcementId) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
            try {
                await announcementService.deleteAnnouncement(announcementId);
                toast.warn('تم حذف الإعلان.');
                refetchAnnouncements();
                if (showModal) handleCloseModal();
            } catch (error) { toast.error(error.response?.data?.message || "فشل حذف الإعلان."); }
        }
    };

    const filteredAnnouncements = announcements.filter(ann =>
        (ann.title || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const coursesForModal = selectedModalProgram ? courses.filter(c => c.academicProgramId == selectedModalProgram) : [];
    const classroomsForModal = selectedModalCourse ? classrooms.filter(c => c.courseId == selectedModalCourse) : [];

    const renderTargetDropdown = () => {
        if (isReadOnly || formData.targetScope === 'GLOBAL') return null;

        switch (formData.targetScope) {
            case 'PROGRAM':
                return <Col md={8}><Form.Group><Form.Label>اختر البرنامج</Form.Label><Form.Select name="targetId" value={formData.targetId} onChange={handleInputChange}><option value="">-- اختر --</option>{programs.map(p => <option key={p.academicProgramId} value={p.academicProgramId}>{p.name}</option>)}</Form.Select></Form.Group></Col>;

            case 'COURSE':
                return (
                    <>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>1. اختر البرنامج</Form.Label>
                                <Form.Select value={selectedModalProgram} onChange={(e) => {
                                    setSelectedModalProgram(e.target.value);
                                    setFormData(prev => ({ ...prev, targetId: '' }));
                                }}>
                                    <option value="">-- اختر --</option>
                                    {programs.map(p => <option key={p.academicProgramId} value={p.academicProgramId}>{p.name}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>2. اختر الدورة</Form.Label>
                                <Form.Select name="targetId" value={formData.targetId} onChange={handleInputChange} disabled={!selectedModalProgram}>
                                    <option value="">-- اختر --</option>
                                    {coursesForModal.map(c => <option key={c.courseId} value={c.courseId}>{c.name}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </>
                );
            case 'CLASSROOM':
                return (
                    <>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>1. اختر البرنامج</Form.Label>
                                <Form.Select value={selectedModalProgram} onChange={(e) => {
                                    setSelectedModalProgram(e.target.value);
                                    setSelectedModalCourse('');
                                    setFormData(prev => ({ ...prev, targetId: '' }));
                                }}>
                                    <option value="">-- اختر --</option>
                                    {programs.map(p => <option key={p.academicProgramId} value={p.academicProgramId}>{p.name}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>2. اختر الدورة</Form.Label>
                                <Form.Select value={selectedModalCourse} onChange={(e) => {
                                    setSelectedModalCourse(e.target.value);
                                    setFormData(prev => ({ ...prev, targetId: '' }));
                                }} disabled={!selectedModalProgram}>
                                    <option value="">-- اختر --</option>
                                    {coursesForModal.map(c => <option key={c.courseId} value={c.courseId}>{c.name}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>3. اختر الفصل</Form.Label>
                                <Form.Select name="targetId" value={formData.targetId} onChange={handleInputChange} disabled={!selectedModalCourse}>
                                    <option value="">-- اختر --</option>
                                    {classroomsForModal.map(c =>
                                        <option key={c.classroomId} value={c.classroomId}>
                                            {c.name}
                                        </option>
                                    )}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </>
                );
            default:
                return null;
        }
    };

    const renderMobileCards = () => {
        return (
            <div className="d-md-none">
                {filteredAnnouncements.map((ann) => (
                    <Card key={ann.announcementId} className="mb-3 shadow-sm border-0">
                        <Card.Body className="p-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <h6 className="font-weight-bold mb-0 text-truncate" style={{ maxWidth: '70%' }}>{ann.title}</h6>
                                <span className="badge badge-primary rounded-pill small px-2 py-1">{ann.targetScope}</span>
                            </div>
                            <div className="mb-2 text-muted small">
                                <i className="far fa-calendar-alt mr-1"></i> {new Date(ann.postedAt).toLocaleDateString('ar-EG')}
                            </div>
                            {ann.targetName && (
                                <div className="mb-3 small">
                                    <span className="text-dark font-weight-bold">موجه لـ: </span>
                                    <span className="text-secondary">{ann.targetName}</span>
                                </div>
                            )}
                            <hr className="my-2" />
                            <div className="d-flex justify-content-end">
                                <Button
                                    variant="outline-info"
                                    size="sm"
                                    className="rounded-circle shadow-sm mx-1"
                                    onClick={() => handleShowViewModal(ann)}
                                    style={{ width: '35px', height: '35px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <i className="fas fa-eye"></i>
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="rounded-circle shadow-sm"
                                    onClick={() => handleDelete(ann.announcementId)}
                                    style={{ width: '35px', height: '35px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <i className="fas fa-trash"></i>
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                ))}
            </div>
        );
    };

    return (
        <>
            <Container fluid>
                <Row>
                    <Col md="12">
                        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '15px' }}>
                            <Card.Header className="bg-white p-4 border-0" style={{ borderRadius: '15px 15px 0 0' }}>
                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
                                    <div className="mb-3 mb-md-0">
                                        <h4 className="font-weight-bold mb-1" style={{ color: '#2c3e50' }}>إدارة الإعلانات</h4>
                                        <p className="text-muted mb-0 small">عرض وإنشاء وتوجيه الإعلانات للأقسام المختلفة</p>
                                    </div>
                                    <Button
                                        variant="primary"
                                        className="btn-fill rounded-pill px-4 shadow-sm"
                                        onClick={handleShowAddModal}
                                    >
                                        <i className="fas fa-plus ml-2"></i> إضافة إعلان
                                    </Button>
                                </div>

                                <Row className="mt-4">
                                    <Col md={12}>
                                        <div className="position-relative">
                                            <i className="fas fa-search position-absolute text-muted" style={{ top: '50%', right: '15px', transform: 'translateY(-50%)', zIndex: 10 }}></i>
                                            <FormControl
                                                placeholder="ابحث عن إعلان..."
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                                className="rounded-pill border-0 bg-light pl-3 pr-5 shadow-sm"
                                                style={{ height: '45px' }}
                                            />
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Header>
                            <Card.Body className="p-0">
                                {loading ? (<div className="text-center my-5"><Spinner animation="border" variant="primary" /></div>) : (
                                    <>
                                        {/* Desktop View */}
                                        <div className="d-none d-md-block">
                                            <Table className="table-hover mb-0" responsive>
                                                <thead className="bg-light text-muted small">
                                                    <tr>
                                                        <th className="border-0 font-weight-bold py-3 px-4">العنوان</th>
                                                        <th className="border-0 font-weight-bold py-3">النطاق</th>
                                                        <th className="border-0 font-weight-bold py-3">الهدف</th>
                                                        <th className="border-0 font-weight-bold py-3">التاريخ</th>
                                                        <th className="border-0 font-weight-bold py-3 text-right px-4">الإجراءات</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredAnnouncements.length > 0 ? filteredAnnouncements.map((ann) => (
                                                        <tr key={ann.announcementId} style={{ transition: 'background 0.2s' }}>
                                                            <td className="align-middle px-4 py-3 font-weight-bold">{ann.title}</td>
                                                            <td className="align-middle py-3">
                                                                <span className={`badge rounded-pill px-3 py-2 ${ann.targetScope === 'GLOBAL' ? 'bg-success' : 'bg-info'}`}>
                                                                    {ann.targetScope}
                                                                </span>
                                                            </td>
                                                            <td className="align-middle py-3 text-muted">{ann.targetName || '-'}</td>
                                                            <td className="align-middle py-3 text-muted small">{new Date(ann.postedAt).toLocaleDateString('ar-EG')}</td>
                                                            <td className="align-middle py-3 text-right px-4">
                                                                <Button
                                                                    variant="outline-info"
                                                                    size="sm"
                                                                    className="rounded-circle shadow-sm mx-1"
                                                                    onClick={() => handleShowViewModal(ann)}
                                                                    title="عرض التفاصيل"
                                                                    style={{ width: '35px', height: '35px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                                                >
                                                                    <i className="fas fa-eye"></i>
                                                                </Button>
                                                                <Button
                                                                    variant="outline-danger"
                                                                    size="sm"
                                                                    className="rounded-circle shadow-sm"
                                                                    onClick={() => handleDelete(ann.announcementId)}
                                                                    title="حذف"
                                                                    style={{ width: '35px', height: '35px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                                                >
                                                                    <i className="fas fa-trash"></i>
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    )) : (
                                                        <tr><td colSpan="5" className="text-center py-5 text-muted">لا توجد إعلانات مطابقة</td></tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </div>

                                        {/* Mobile View */}
                                        {renderMobileCards()}
                                    </>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>

            <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="font-weight-bold" style={{ color: '#2c3e50' }}>{isReadOnly ? 'تفاصيل الإعلان' : 'إعلان جديد'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3">
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label className="font-weight-bold text-muted small">العنوان</Form.Label>
                            <Form.Control type="text" name="title" value={formData.title} onChange={handleInputChange} readOnly={isReadOnly} className="rounded-pill shadow-sm border-light" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="font-weight-bold text-muted small">المحتوى</Form.Label>
                            <Form.Control as="textarea" rows={6} name="content" value={formData.content} onChange={handleInputChange} readOnly={isReadOnly} className="shadow-sm border-light rounded" style={{ padding: '15px' }} />
                        </Form.Group>

                        {!isReadOnly && (
                            <div className="bg-light p-3 rounded mb-3">
                                <h6 className="font-weight-bold mb-3 text-dark border-bottom pb-2">إعدادات النشر</h6>
                                <Row>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small font-weight-bold">توجيه الإعلان إلى</Form.Label>
                                            <Form.Select name="targetScope" value={formData.targetScope} onChange={handleInputChange} className="rounded-pill shadow-sm border-0">
                                                {availableScopes.map((scope, index) => (<option key={index} value={scope}>{scope}</option>))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    {renderTargetDropdown()}
                                </Row>
                            </div>
                        )}

                        {isReadOnly && formData.targetScope !== 'GLOBAL' && (
                            <div className="alert alert-info shadow-sm border-0 rounded-pill py-2 px-3 small d-inline-block">
                                <i className="fas fa-bullhorn mr-2"></i> <strong>موجه إلى:</strong> {formData.targetScope} - {formData.targetName}
                            </div>
                        )}
                    </Form>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="light" onClick={handleCloseModal} className="rounded-pill px-4">إغلاق</Button>
                    {!isReadOnly && <Button variant="primary" onClick={handleSubmit} className="rounded-pill px-4 shadow-sm btn-fill">نشر الإعلان</Button>}
                    {isReadOnly && <Button variant="danger" onClick={() => handleDelete(formData.announcementId)} className="rounded-pill px-4 shadow-sm">حذف الإعلان</Button>}
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default AnnouncementManagement;