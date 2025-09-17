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

    return (
        <>
            <Container fluid>
                <Row>
                    <Col md="12">
                        <Card className="strpied-tabled-with-hover">
                            <Card.Header>
                                <Row className="align-items-center">
                                    <Col md={8}><Card.Title as="h4">إدارة الإعلانات</Card.Title><p className="card-category">عرض وإنشاء وحذف الإعلانات</p></Col>
                                    <Col md={4} className="text-end"><Button variant="primary" onClick={handleShowAddModal}><i className="fas fa-plus me-2"></i> إضافة إعلان</Button></Col>
                                </Row>
                                <Row className="mt-3">
                                    <Col><Form.Group><Form.Label>بحث حسب العنوان</Form.Label><InputGroup><FormControl placeholder="ابحث..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /><Button variant="outline-secondary" onClick={() => setSearchTerm('')}>مسح</Button></InputGroup></Form.Group></Col>
                                </Row>
                            </Card.Header>
                            <Card.Body className="table-full-width table-responsive px-0">
                                {loading ? (<div className="text-center my-4"><Spinner /></div>) : (
                                    <Table className="table-hover table-striped">
                                        <thead><tr><th>العنوان</th><th>الجهة المستهدفة</th><th>اسم الهدف</th><th>تاريخ النشر</th><th>الإجراءات</th></tr></thead>
                                        <tbody>
                                            {filteredAnnouncements.map((ann) => (
                                                <tr key={ann.announcementId}>
                                                    <td>{ann.title}</td>
                                                    <td>{ann.targetScope}</td>
                                                    <td>{ann.targetName || '-'}</td>
                                                    <td>{new Date(ann.postedAt).toLocaleDateString('ar-EG')}</td>
                                                    <td>
                                                        <Button variant="info" size="sm" className="me-2" onClick={() => handleShowViewModal(ann)}><i className="fas fa-eye"></i></Button>
                                                        <Button variant="danger" size="sm" onClick={() => handleDelete(ann.announcementId)}><i className="fas fa-trash"></i></Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
            <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
                <Modal.Header closeButton><Modal.Title>{isReadOnly ? 'عرض الإعلان' : 'إنشاء إعلان جديد'}</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3"><Form.Label>العنوان</Form.Label><Form.Control type="text" name="title" value={formData.title} onChange={handleInputChange} readOnly={isReadOnly} /></Form.Group>
                        <Form.Group className="mb-3"><Form.Label>المحتوى</Form.Label><Form.Control as="textarea" rows={5} name="content" value={formData.content} onChange={handleInputChange} readOnly={isReadOnly} /></Form.Group>
                        {!isReadOnly && (
                            <Row className="align-items-end">
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>توجيه الإعلان إلى</Form.Label>
                                        <Form.Select name="targetScope" value={formData.targetScope} onChange={handleInputChange}>
                                            {availableScopes.map((scope, index) => (<option key={index} value={scope}>{scope}</option>))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                {renderTargetDropdown()}
                            </Row>
                        )}
                        {isReadOnly && formData.targetScope !== 'GLOBAL' && (
                            <p><strong>موجه إلى:</strong> {formData.targetScope} - {formData.targetName}</p>
                        )}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>إغلاق</Button>
                    {!isReadOnly && <Button variant="primary" onClick={handleSubmit}>نشر الإعلان</Button>}
                    {isReadOnly && <Button variant="danger" onClick={() => handleDelete(formData.announcementId)}>حذف الإعلان</Button>}
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default AnnouncementManagement;