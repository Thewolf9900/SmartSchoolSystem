import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { useLocation } from "react-router-dom";

import { Card, Table, Container, Row, Col, Button, Spinner, ButtonGroup, Form, Modal, Badge } from "react-bootstrap";

// استيراد الخدمات المطلوبة
import { getClassrooms, createClassroom, updateClassroom, deleteClassroom, assignTeacherToClassroom, unassignTeacherFromClassroom } from "services/admin/classroomService";
import { getPrograms } from "services/admin/programService";
import { getCourses } from "services/admin/courseService";
import { getTeachers } from "services/admin/userService";

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

function ClassroomManagement() {
    const query = useQuery();
    const initialCourseId = query.get("courseId") || "";
    const initialStatusFilter = query.get("status") || "ACTIVE";

    const [classrooms, setClassrooms] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
    const [selectedProgramId, setSelectedProgramId] = useState("");
    const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId);

    const [showAddModal, setShowAddModal] = useState(false);
    const [newClassroom, setNewClassroom] = useState({ name: "", courseId: "", capacity: "30" });
    const [addModalProgramId, setAddModalProgramId] = useState("");

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingClassroom, setEditingClassroom] = useState(null);
    const [editModalProgramId, setEditModalProgramId] = useState("");

    const location = useLocation();

    const [teachers, setTeachers] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [classroomToManage, setClassroomToManage] = useState(null);
    const [selectedTeacherId, setSelectedTeacherId] = useState("");

    const fetchBaseData = async () => {
        try {
            const [programsRes, coursesRes, teachersRes] = await Promise.all([
                getPrograms(),
                getCourses(),
                getTeachers(),
            ]);
            setPrograms(programsRes.data || []);
            setCourses(coursesRes.data || []);
            setTeachers(teachersRes.data || []);
        } catch (error) {
            toast.error("فشل في جلب البيانات الأساسية.");
        }
    };

    const refetchClassrooms = async () => {
        try {
            const statusToFetch = statusFilter === "ALL" ? "" : statusFilter;
            const response = await getClassrooms(statusToFetch);
            setClassrooms(response.data || []);
        } catch (error) {
            toast.error("فشل في تحديث قائمة الفصول.");
        }
    };

    useEffect(() => {
        fetchBaseData();
    }, []);

    useEffect(() => {
        const fetchClassrooms = async () => {
            setLoading(true);
            try {
                const statusToFetch = statusFilter === "ALL" ? "" : statusFilter;
                const response = await getClassrooms(statusToFetch);
                setClassrooms(response.data || []);
            } catch (error) {
                toast.error("فشل في جلب الفصول الدراسية.");
            } finally {
                setLoading(false);
            }
        };
        fetchClassrooms();
    }, [statusFilter]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const courseIdParam = params.get('courseId') || "";
        const statusParam = params.get('status') || "ACTIVE";
        setSelectedCourseId(courseIdParam);
        setStatusFilter(statusParam);
        if (courseIdParam && courses.length > 0) {
            const course = courses.find(c => c.courseId === parseInt(courseIdParam));
            if (course) {
                setSelectedProgramId(course.academicProgramId);
            }
        } else if (!courseIdParam) {
            setSelectedProgramId("");
        }
    }, [location.search, courses]);

    const handleShowAddModal = () => {
        setNewClassroom({ name: "", courseId: "", capacity: "30" });
        setAddModalProgramId("");
        setShowAddModal(true);
    };
    const handleCloseAddModal = () => setShowAddModal(false);
    const handleNewClassroomInputChange = (e) => {
        setNewClassroom({ ...newClassroom, [e.target.name]: e.target.value });
    };
    const handleAddFormSubmit = async () => {
        if (!newClassroom.name || !newClassroom.courseId || !newClassroom.capacity) {
            toast.error("يرجى ملء جميع الحقول.");
            return;
        }
        try {
            await createClassroom({ ...newClassroom, capacity: parseInt(newClassroom.capacity) });
            toast.success("تم إنشاء الفصل بنجاح!");
            handleCloseAddModal();
            refetchClassrooms();
        } catch (error) { toast.error("فشل في إنشاء الفصل." + error.response.data); }
    };

    const handleShowEditModal = (classroom) => {
        setEditingClassroom(classroom);
        const course = courses.find(c => c.courseId === classroom.courseId);
        if (course) { setEditModalProgramId(course.academicProgramId); }
        else { setEditModalProgramId(""); }
        setShowEditModal(true);
    };
    const handleCloseEditModal = () => setShowEditModal(false);
    const handleEditClassroomInputChange = (e) => {
        setEditingClassroom({ ...editingClassroom, [e.target.name]: e.target.value });
    };
    const handleEditFormSubmit = async () => {
        if (!editingClassroom.name || !editingClassroom.courseId || !editingClassroom.capacity) {
            toast.error("يرجى ملء جميع الحقول.");
            return;
        }
        try {
            await updateClassroom(editingClassroom.classroomId, { ...editingClassroom, capacity: parseInt(editingClassroom.capacity) });
            toast.success("تم تحديث الفصل بنجاح!");
            handleCloseEditModal();
            refetchClassrooms();
        } catch (error) { toast.error("فشل في تحديث الفصل." + error.response.data); }
    };

    const handleDeleteClassroom = async (classroomId) => {
        if (window.confirm("هل أنت متأكد من حذف هذا الفصل؟")) {
            try {
                await deleteClassroom(classroomId);
                toast.success("تم حذف الفصل بنجاح!");
                refetchClassrooms();
            } catch (error) { toast.error("فشل في حذف الفصل." + error.response.data); }
        }
    };

    const handleTeacherButtonClick = (classroom) => {
        setClassroomToManage(classroom);
        if (classroom.teacherId) {
            if (window.confirm(`هل أنت متأكد من إلغاء تعيين المدرس "${classroom.teacherName}" من هذا الفصل؟`)) {
                handleUnassignTeacher(classroom.classroomId);
            }
        } else {
            setSelectedTeacherId("");
            setShowAssignModal(true);
        }
    };

    const handleCloseAssignModal = () => {
        setShowAssignModal(false);
        setClassroomToManage(null);
        setSelectedTeacherId("");
    };

    const handleAssignTeacherSubmit = async () => {
        if (!selectedTeacherId) {
            return toast.warn("يرجى اختيار مدرس أولاً.");
        }
        try {
            await assignTeacherToClassroom(classroomToManage.classroomId, selectedTeacherId);
            toast.success("تم تعيين المدرس بنجاح!");
            handleCloseAssignModal();
            refetchClassrooms();
        } catch (error) { toast.error("فشل في تعيين المدرس." + error.response.data); }
    };

    const handleUnassignTeacher = async (classroomId) => {
        try {
            await unassignTeacherFromClassroom(classroomId);
            toast.success("تم إلغاء تعيين المدرس بنجاح!");
            refetchClassrooms();
        } catch (error) { toast.error("فشل في إلغاء تعيين المدرس." + error.response.data); }
    };

    const availableCoursesForFilter = selectedProgramId ? courses.filter(c => c.academicProgramId === parseInt(selectedProgramId)) : courses;
    const filteredClassrooms = classrooms.filter(c => {
        const courseMatch = !selectedCourseId || c.courseId === parseInt(selectedCourseId);
        const selectedCourse = courses.find(course => course.courseId === c.courseId);
        const programMatch = !selectedProgramId || (selectedCourse && selectedCourse.academicProgramId === parseInt(selectedProgramId));
        return courseMatch && programMatch;
    });

    const availableCoursesForAddModal = addModalProgramId ? courses.filter(c => c.academicProgramId === parseInt(addModalProgramId)) : [];
    const availableCoursesForEditModal = editModalProgramId ? courses.filter(c => c.academicProgramId === parseInt(editModalProgramId)) : [];

    const renderTableBody = () => {
        if (loading) { return (<tr><td colSpan="6" className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>); }
        if (filteredClassrooms.length === 0) { return (<tr><td colSpan="6" className="text-center py-5"><div className="text-muted"><i className="fas fa-layer-group fa-2x mb-3 d-block"></i>لا توجد فصول تطابق البحث.</div></td></tr>); }

        return filteredClassrooms.map((c) => (
            <tr key={c.classroomId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td className="align-middle pl-4 font-weight-bold text-muted">#{c.classroomId}</td>
                <td className="align-middle"><span className="font-weight-bold text-dark">{c.name}</span></td>
                <td className="align-middle text-muted">{c.courseName}</td>
                <td className="align-middle">{c.teacherName || <Badge bg="secondary">لم يتم التعيين</Badge>}</td>
                <td className="align-middle text-center"><Badge bg="info" className="px-3 py-1">{c.enrolledStudentsCount} / {c.capacity}</Badge></td>
                <td className="text-right pr-4 align-middle">
                    <Button
                        variant={c.teacherId ? "outline-danger" : "outline-primary"}
                        size="sm"
                        className="mx-1 rounded"
                        onClick={() => handleTeacherButtonClick(c)}
                        title={c.teacherId ? "إلغاء تعيين المدرس" : "تعيين مدرس"}
                        style={{ width: '35px', height: '35px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <i className="fas fa-chalkboard-teacher"></i>
                    </Button>
                    <Button
                        variant="outline-warning"
                        size="sm"
                        className="mx-1 rounded"
                        onClick={() => handleShowEditModal(c)}
                        title="تعديل"
                        style={{ width: '35px', height: '35px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <i className="fas fa-pen"></i>
                    </Button>
                    <Button
                        variant="outline-danger"
                        size="sm"
                        className="mx-1 rounded"
                        onClick={() => handleDeleteClassroom(c.classroomId)}
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
        if (loading) { return (<div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>); }
        if (filteredClassrooms.length === 0) { return (<div className="text-center py-5 text-muted">لا توجد فصول تطابق البحث.</div>); }

        return filteredClassrooms.map((c) => (
            <Card key={c.classroomId} className="mb-3 border shadow-sm">
                <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center">
                            <div className="rounded-circle d-flex align-items-center justify-content-center mr-2" style={{ width: '40px', height: '40px', backgroundColor: '#e3f2fd', color: '#007bff' }}>
                                <i className="fas fa-chalkboard"></i>
                            </div>
                            <div>
                                <h6 className="font-weight-bold mb-0 text-dark">{c.name}</h6>
                                <small className="text-muted">#{c.classroomId}</small>
                            </div>
                        </div>
                        <Badge bg="info" className="px-2 py-1">{c.courseName}</Badge>
                    </div>

                    <div className="mb-3">
                        <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                            <span className="text-muted small">المدرس</span>
                            <span>{c.teacherName || <Badge bg="secondary">لم يتم التعيين</Badge>}</span>
                        </div>
                        <div className="d-flex justify-content-between pb-2 mb-2">
                            <span className="text-muted small">الطلاب / السعة</span>
                            <span className="font-weight-bold text-dark">{c.enrolledStudentsCount} / {c.capacity}</span>
                        </div>
                    </div>

                    <div className="d-flex justify-content-end border-top pt-2">
                        <Button
                            variant={c.teacherId ? "outline-danger" : "outline-primary"}
                            size="sm"
                            className="ml-2 rounded"
                            onClick={() => handleTeacherButtonClick(c)}
                        >
                            <i className="fas fa-chalkboard-teacher mr-1"></i> {c.teacherId ? "إلغاء المدرس" : "تعيين مدرس"}
                        </Button>
                        <Button variant="outline-warning" size="sm" className="ml-2 rounded" onClick={() => handleShowEditModal(c)}>
                            <i className="fas fa-pen mr-1"></i> تعديل
                        </Button>
                        <Button variant="outline-danger" size="sm" className="rounded" onClick={() => handleDeleteClassroom(c.classroomId)}>
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
                        <Card className="str-table-with-hover">
                            <Card.Header className="bg-white p-4 border-0" style={{ borderRadius: '15px 15px 0 0' }}>
                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
                                    <div>
                                        <h4 className="font-weight-bold mb-1" style={{ color: '#2c3e50' }}>إدارة الفصول الدراسية</h4>
                                        <p className="text-muted mb-0 small">عرض وإضافة وتعديل جميع الفصول في النظام</p>
                                    </div>
                                    <div className="mt-3 mt-md-0 d-flex flex-column flex-md-row align-items-stretch align-items-md-center">
                                        <Button variant="success" className="shadow-sm btn-fill rounded-pill px-4 py-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'auto', whiteSpace: 'nowrap' }} onClick={handleShowAddModal}>
                                            <i className="fas fa-plus ml-2"></i> إضافة فصل
                                        </Button>
                                    </div>
                                </div>

                                <Row className="bg-light p-3 rounded mx-0 align-items-end">
                                    <Col md={4} className="mb-3 mb-md-0">
                                        <Form.Group className="mb-0">
                                            <Form.Label className="small font-weight-bold text-muted">البرنامج</Form.Label>
                                            <Form.Control as="select" value={selectedProgramId} onChange={(e) => { setSelectedProgramId(e.target.value); setSelectedCourseId(""); }} className="shadow-sm py-2 rounded-pill" style={{ height: 'auto' }}>
                                                <option value="">-- الكل --</option>
                                                {programs.map(p => (<option key={p.academicProgramId} value={p.academicProgramId}>{p.name}</option>))}
                                            </Form.Control>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4} className="mb-3 mb-md-0">
                                        <Form.Group className="mb-0">
                                            <Form.Label className="small font-weight-bold text-muted">الدورة</Form.Label>
                                            <Form.Control as="select" value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} className="shadow-sm py-2 rounded-pill" style={{ height: 'auto' }}>
                                                <option value="">-- الكل --</option>
                                                {availableCoursesForFilter.map(c => (<option key={c.courseId} value={c.courseId}>{c.name}</option>))}
                                            </Form.Control>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-0">
                                            <Form.Label className="small font-weight-bold text-muted d-block">الحالة</Form.Label>
                                            <ButtonGroup className="w-100 shadow-sm rounded-pill overflow-hidden">
                                                <Button variant={statusFilter === 'ACTIVE' ? 'primary' : 'light'} className={`border-0 py-2 ${statusFilter === 'ACTIVE' ? 'font-weight-bold' : 'text-muted'}`} onClick={() => setStatusFilter("ACTIVE")}>النشطة</Button>
                                                <Button variant={statusFilter === 'COMPLETED' ? 'primary' : 'light'} className={`border-0 py-2 ${statusFilter === 'COMPLETED' ? 'font-weight-bold' : 'text-muted'}`} onClick={() => setStatusFilter("COMPLETED")}>المكتملة</Button>
                                                <Button variant={statusFilter === 'ALL' ? 'primary' : 'light'} className={`border-0 py-2 ${statusFilter === 'ALL' ? 'font-weight-bold' : 'text-muted'}`} onClick={() => setStatusFilter("ALL")}>الكل</Button>
                                            </ButtonGroup>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Header>
                            <Card.Body className="px-0">
                                <div className="d-none d-md-block table-responsive">
                                    <Table className="table-hover mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="border-0 py-3 pl-4 text-muted small font-weight-bold align-middle">#</th>
                                                <th className="border-0 py-3 text-muted small font-weight-bold align-middle">اسم الفصل</th>
                                                <th className="border-0 py-3 text-muted small font-weight-bold align-middle">الدورة</th>
                                                <th className="border-0 py-3 text-muted small font-weight-bold align-middle">المدرس</th>
                                                <th className="border-0 py-3 text-muted small font-weight-bold text-center align-middle">الطلاب/السعة</th>
                                                <th className="border-0 py-3 text-muted small font-weight-bold text-right pr-4 align-middle">إجراءات</th>
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

            <Modal show={showAddModal} onHide={handleCloseAddModal} centered>
                <Modal.Header closeButton><Modal.Title>إنشاء فصل جديد</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3"><Form.Label>اسم الفصل (الشعبة) <span className="text-danger">*</span></Form.Label><Form.Control type="text" name="name" value={newClassroom.name} onChange={handleNewClassroomInputChange} required /></Form.Group>
                        <Form.Group className="mb-3"><Form.Label>البرنامج الأكاديمي <span className="text-danger">*</span></Form.Label><Form.Control as="select" value={addModalProgramId} onChange={(e) => setAddModalProgramId(e.target.value)} required><option value="">-- اختر برنامجًا --</option>{programs.map(p => (<option key={p.academicProgramId} value={p.academicProgramId}>{p.name}</option>))}</Form.Control></Form.Group>
                        <Form.Group className="mb-3"><Form.Label>الدورة الدراسية <span className="text-danger">*</span></Form.Label><Form.Control as="select" name="courseId" value={newClassroom.courseId} onChange={handleNewClassroomInputChange} disabled={!addModalProgramId} required><option value="">-- اختر دورة --</option>{availableCoursesForAddModal.map(c => (<option key={c.courseId} value={c.courseId}>{c.name}</option>))}</Form.Control></Form.Group>
                        <Form.Group><Form.Label>السعة الطلابية <span className="text-danger">*</span></Form.Label><Form.Control type="number" name="capacity" value={newClassroom.capacity} onChange={handleNewClassroomInputChange} required /></Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={handleCloseAddModal}>إلغاء</Button><Button variant="primary" onClick={handleAddFormSubmit}>حفظ</Button></Modal.Footer>
            </Modal>

            {editingClassroom && (
                <Modal show={showEditModal} onHide={handleCloseEditModal} centered>
                    <Modal.Header closeButton><Modal.Title>تعديل فصل: {editingClassroom.name}</Modal.Title></Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group className="mb-3"><Form.Label>اسم الفصل (الشعبة) <span className="text-danger">*</span></Form.Label><Form.Control type="text" name="name" value={editingClassroom.name} onChange={handleEditClassroomInputChange} required /></Form.Group>
                            <Form.Group className="mb-3"><Form.Label>البرنامج الأكاديمي <span className="text-danger">*</span></Form.Label><Form.Control as="select" value={editModalProgramId} onChange={(e) => setEditModalProgramId(e.target.value)} required><option value="">-- اختر برنامجًا --</option>{programs.map(p => (<option key={p.academicProgramId} value={p.academicProgramId}>{p.name}</option>))}</Form.Control></Form.Group>
                            <Form.Group className="mb-3"><Form.Label>الدورة الدراسية <span className="text-danger">*</span></Form.Label><Form.Control as="select" name="courseId" value={editingClassroom.courseId} onChange={handleEditClassroomInputChange} disabled={!editModalProgramId} required><option value="">-- اختر دورة --</option>{availableCoursesForEditModal.map(c => (<option key={c.courseId} value={c.courseId}>{c.name}</option>))}</Form.Control></Form.Group>
                            <Form.Group><Form.Label>السعة الطلابية <span className="text-danger">*</span></Form.Label><Form.Control type="number" name="capacity" value={editingClassroom.capacity} onChange={handleEditClassroomInputChange} required /></Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer><Button variant="secondary" onClick={handleCloseEditModal}>إلغاء</Button><Button variant="primary" onClick={handleEditFormSubmit}>حفظ التعديلات</Button></Modal.Footer>
                </Modal>
            )}

            {classroomToManage && (
                <Modal show={showAssignModal} onHide={handleCloseAssignModal} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>تعيين مدرس للفصل: {classroomToManage.name}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group>
                            <Form.Label>اختر المدرس</Form.Label>
                            <Form.Select value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)}>
                                <option value="">-- اختر مدرسًا --</option>
                                {teachers.map((teacher) => (
                                    <option key={teacher.userId} value={teacher.userId}>
                                        {teacher.firstName} {teacher.lastName}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseAssignModal}>إلغاء</Button>
                        <Button variant="primary" onClick={handleAssignTeacherSubmit}>حفظ التعيين</Button>
                    </Modal.Footer>
                </Modal>
            )}
        </>
    );
};

export default ClassroomManagement;