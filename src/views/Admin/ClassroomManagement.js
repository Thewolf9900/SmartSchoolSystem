import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { useLocation } from "react-router-dom";

import { Card, Table, Container, Row, Col, Button, Spinner, ButtonGroup, Form, Modal } from "react-bootstrap";

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
        if (loading) { return (<tr><td colSpan="6" className="text-center"><Spinner animation="border" /></td></tr>); }
        if (filteredClassrooms.length === 0) { return (<tr><td colSpan="6" className="text-center">لا توجد فصول تطابق البحث.</td></tr>); }
        return filteredClassrooms.map((c) => (
            <tr key={c.classroomId}>
                <td>{c.classroomId}</td>
                <td>{c.name}</td>
                <td>{c.courseName}</td>
                <td>{c.teacherName || <span className="text-muted">لم يتم التعيين</span>}</td>
                <td>{c.enrolledStudentsCount} / {c.capacity}</td>
                <td>
                    {/* ======== بداية التعديل: تلوين الأزرار ======== */}
                    <Button
                        variant={c.teacherId ? "danger" : "primary"}
                        size="sm"
                        className="me-2"
                        onClick={() => handleTeacherButtonClick(c)}
                    >
                        <i className="fas fa-chalkboard-teacher"></i>
                    </Button>
                    <Button variant="warning" size="sm" className="me-2" onClick={() => handleShowEditModal(c)}>
                        <i className="fas fa-edit"></i>
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteClassroom(c.classroomId)}>
                        <i className="fas fa-trash"></i>
                    </Button>
                    {/* ======== نهاية التعديل ======== */}
                </td>
            </tr>
        ));
    };

    return (
        <>
            <Container fluid>
                <Row>
                    <Col md="12">
                        <Card className="str-table-with-hover">
                            <Card.Header>
                                <Row className="align-items-center">
                                    <Col md={8}><Card.Title as="h4">إدارة الفصول الدراسية</Card.Title><p className="card-category">عرض وإضافة وتعديل الفصول</p></Col>
                                    <Col md={4} className="d-flex justify-content-end"><Button variant="success" onClick={handleShowAddModal}><i className="fas fa-plus mr-1"></i> إضافة فصل</Button></Col>
                                </Row>
                                <Row className="mt-3 align-items-end">
                                    <Col md={4}><Form.Group><Form.Label>البرنامج</Form.Label><Form.Control as="select" value={selectedProgramId} onChange={(e) => { setSelectedProgramId(e.target.value); setSelectedCourseId(""); }}><option value="">-- الكل --</option>{programs.map(p => (<option key={p.academicProgramId} value={p.academicProgramId}>{p.name}</option>))}</Form.Control></Form.Group></Col>
                                    <Col md={4}><Form.Group><Form.Label>الدورة</Form.Label><Form.Control as="select" value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}><option value="">-- الكل --</option>{availableCoursesForFilter.map(c => (<option key={c.courseId} value={c.courseId}>{c.name}</option>))}</Form.Control></Form.Group></Col>
                                    <Col md={4}><ButtonGroup><Button variant={statusFilter === 'ACTIVE' ? 'primary' : 'outline-primary'} onClick={() => setStatusFilter("ACTIVE")}>النشطة</Button><Button variant={statusFilter === 'COMPLETED' ? 'primary' : 'outline-primary'} onClick={() => setStatusFilter("COMPLETED")}>المكتملة</Button><Button variant={statusFilter === 'ALL' ? 'primary' : 'outline-primary'} onClick={() => setStatusFilter("ALL")}>الكل</Button></ButtonGroup></Col>
                                </Row>
                            </Card.Header>
                            <Card.Body className="table-full-width table-responsive px-0">
                                <Table className="table-hover">
                                    <thead><tr><th className="border-0">#</th><th className="border-0">اسم الفصل</th><th className="border-0">الدورة</th><th className="border-0">المدرس</th><th className="border-0">الطلاب/السعة</th><th className="border-0">إجراءات</th></tr></thead>
                                    <tbody>{renderTableBody()}</tbody>
                                </Table>
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
}

export default ClassroomManagement;