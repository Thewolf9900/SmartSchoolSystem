import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { useLocation, Link } from "react-router-dom";
import {
    Card, Table, Container, Row, Col, Button,
    Spinner, Form, Modal, InputGroup, Badge
} from "react-bootstrap";
import {
    getCourses, createCourse, updateCourse, deleteCourse,
    getClassroomsForCourse, assignCoordinatorToCourse, unassignCoordinatorFromCourse
} from "services/admin/courseService";
import { getPrograms } from "services/admin/programService";
import { getTeachers } from "services/admin/userService";

// Hook مخصص لقراءة Query Parameters من الـ URL
function useQuery() {
    return new URLSearchParams(useLocation().search);
}

function CourseManagement() {
    const query = useQuery();
    const location = useLocation();
    const initialProgramId = query.get("programId") || "";

    // State Management
    const [courses, setCourses] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProgramId, setSelectedProgramId] = useState(initialProgramId);
    const [classroomCounts, setClassroomCounts] = useState({});

    // Modals State
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCoordinatorModal, setShowCoordinatorModal] = useState(false);

    // Forms State
    const [newCourse, setNewCourse] = useState({ name: "", academicProgramId: "", price: 0 });
    const [editingCourse, setEditingCourse] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedTeacherId, setSelectedTeacherId] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Data Fetching
    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [coursesRes, programsRes, teachersRes] = await Promise.all([
                getCourses(), getPrograms(), getTeachers()
            ]);
            const fetchedCourses = coursesRes.data || [];
            setCourses(fetchedCourses);
            setPrograms(programsRes.data || []);
            setTeachers(teachersRes.data || []);

            if (fetchedCourses.length > 0) {
                const countPromises = fetchedCourses.map(c =>
                    getClassroomsForCourse(c.courseId).catch(() => ({ data: [] }))
                );
                const responses = await Promise.all(countPromises);
                const counts = {};
                responses.forEach((res, i) => { counts[fetchedCourses[i].courseId] = res.data.length; });
                setClassroomCounts(counts);
            }
        } catch (error) {
            toast.error("فشل في جلب البيانات الأساسية.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const programIdFromUrl = params.get('programId') || "";
        setSelectedProgramId(programIdFromUrl);
    }, [location.search]);

    // Handlers
    const handleInputChange = (e, setStateFunc) => {
        const { name, value } = e.target;
        setStateFunc(prevState => ({ ...prevState, [name]: value }));
    };

    const handleShowAddModal = () => {
        setNewCourse({ name: "", academicProgramId: selectedProgramId, price: "" });
        setShowAddModal(true);
    };

    const handleAddFormSubmit = async (e) => {
        e.preventDefault();
        if (!newCourse.name || !newCourse.academicProgramId) {
            toast.warn("يرجى تعبئة اسم الدورة واختيار البرنامج.");
            return;
        }
        try {
            await createCourse({ ...newCourse, price: parseFloat(newCourse.price) || 0 });
            toast.success("تم إنشاء الدورة بنجاح!");
            setShowAddModal(false);
            fetchInitialData();
        } catch (error) {
            toast.error(error.response?.data?.message || "فشل إنشاء الدورة.");
        }
    };

    const handleShowEditModal = (course) => {
        setEditingCourse(course);
        setShowEditModal(true);
    };

    const handleEditFormSubmit = async (e) => {
        e.preventDefault();
        if (!editingCourse?.name) return;
        try {
            const dataToUpdate = { name: editingCourse.name, price: parseFloat(editingCourse.price) || 0 };
            await updateCourse(editingCourse.courseId, dataToUpdate);
            toast.success("تم تحديث الدورة بنجاح!");
            setShowEditModal(false);
            fetchInitialData();
        } catch (error) {
            toast.error(error.response?.data?.message || "فشل تحديث الدورة.");
        }
    };

    const handleDeleteCourse = async (courseId) => {
        if (window.confirm("هل أنت متأكد من حذف هذه الدورة؟ سيتم حذف كل الفصول التابعة لها.")) {
            try {
                await deleteCourse(courseId);
                toast.success("تم حذف الدورة بنجاح!");
                fetchInitialData();
            } catch (error) {
                toast.error(error.response?.data?.message || "فشل حذف الدورة.");
            }
        }
    };

    const handleShowCoordinatorModal = (course) => {
        setSelectedCourse(course);
        setSelectedTeacherId(course.coordinatorId || "");
        setShowCoordinatorModal(true);
    };

    const handleAssignCoordinator = async () => {
        if (!selectedTeacherId) { toast.error("الرجاء اختيار مدرس."); return; }
        setSubmitting(true);
        try {
            await assignCoordinatorToCourse(selectedCourse.courseId, parseInt(selectedTeacherId));
            toast.success("تم تعيين المنسق بنجاح!");
            setShowCoordinatorModal(false);
            fetchInitialData();
        } catch (error) { toast.error(error.response?.data?.message || "فشل في تعيين المنسق."); }
        finally { setSubmitting(false); }
    };

    const handleUnassignCoordinator = async () => {
        if (!selectedCourse || !window.confirm(`هل أنت متأكد من إلغاء تعيين المنسق؟`)) return;
        setSubmitting(true);
        try {
            await unassignCoordinatorFromCourse(selectedCourse.courseId);
            toast.success("تم إلغاء تعيين المنسق بنجاح.");
            setShowCoordinatorModal(false);
            fetchInitialData();
        } catch (error) { toast.error(error.response?.data?.message || "فشل في إلغاء التعيين."); }
        finally { setSubmitting(false); }
    };

    // Rendering Logic
    const filteredCourses = selectedProgramId ? courses.filter(course => course.academicProgramId === parseInt(selectedProgramId)) : courses;
    const selectedProgramName = programs.find(p => p.academicProgramId === parseInt(selectedProgramId))?.name;

    const renderTableBody = () => {
        if (loading) { return (<tr><td colSpan="7" className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>); }
        if (filteredCourses.length === 0) { return (<tr><td colSpan="7" className="text-center py-5"><div className="text-muted"><i className="fas fa-layer-group fa-2x mb-3 d-block"></i>لا توجد دورات لعرضها.</div></td></tr>); }

        return filteredCourses.map((course) => (
            <tr key={course.courseId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td className="align-middle pl-4 font-weight-bold text-muted">#{course.courseId}</td>
                <td className="align-middle"><span className="font-weight-bold text-dark">{course.name}</span></td>
                <td className="align-middle font-weight-bold text-success">{(course.price || 0).toLocaleString()} ل.س</td>
                <td className="align-middle text-muted">{course.academicProgramName || "-"}</td>
                <td className="align-middle text-center"><Link to={`/admin/classrooms?courseId=${course.courseId}`} className="text-primary font-weight-bold">{classroomCounts[course.courseId] ?? <Spinner animation="border" size="sm" />}</Link></td>
                <td className="align-middle">{course.coordinatorName || <Badge bg="secondary">غير معين</Badge>}</td>
                <td className="text-right pr-4 align-middle">
                    <Button
                        variant="outline-warning"
                        size="sm"
                        className="mx-1 rounded"
                        onClick={() => handleShowCoordinatorModal(course)}
                        title="تعيين منسق"
                        style={{ width: '35px', height: '35px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <i className="fas fa-user-tie"></i>
                    </Button>
                    <Button
                        variant="outline-info"
                        size="sm"
                        className="mx-1 rounded"
                        onClick={() => handleShowEditModal(course)}
                        title="تعديل"
                        style={{ width: '35px', height: '35px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <i className="fas fa-pen"></i>
                    </Button>
                    <Button
                        variant="outline-danger"
                        size="sm"
                        className="mx-1 rounded"
                        onClick={() => handleDeleteCourse(course.courseId)}
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
        if (filteredCourses.length === 0) { return (<div className="text-center py-5 text-muted">لا توجد دورات لعرضها.</div>); }

        return filteredCourses.map((course) => (
            <Card key={course.courseId} className="mb-3 border shadow-sm">
                <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center">
                            <div className="rounded-circle d-flex align-items-center justify-content-center mr-2" style={{ width: '40px', height: '40px', backgroundColor: '#e3f2fd', color: '#007bff' }}>
                                <i className="fas fa-book-open"></i>
                            </div>
                            <div>
                                <h6 className="font-weight-bold mb-0 text-dark">{course.name}</h6>
                                <small className="text-muted">#{course.courseId}</small>
                            </div>
                        </div>
                        <Badge bg="info" className="px-2 py-1">{course.academicProgramName}</Badge>
                    </div>

                    <div className="mb-3">
                        <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                            <span className="text-muted small">السعر</span>
                            <span className="font-weight-bold text-success">{(course.price || 0).toLocaleString()} ل.س</span>
                        </div>
                        <div className="d-flex justify-content-between pb-2 mb-2">
                            <span className="text-muted small">المنسق</span>
                            <span>{course.coordinatorName || <Badge bg="secondary">غير معين</Badge>}</span>
                        </div>
                    </div>

                    <div className="d-flex justify-content-between mb-3 text-center border-top pt-3">
                        <div className="w-100">
                            <div className="text-muted small">الفصول الدراسية</div>
                            <Link to={`/admin/classrooms?courseId=${course.courseId}`} className="font-weight-bold h5 mb-0 d-block text-primary">
                                {classroomCounts[course.courseId] ?? '-'}
                            </Link>
                        </div>
                    </div>

                    <div className="d-flex justify-content-end pt-2">
                        <Button variant="outline-warning" size="sm" className="ml-2 rounded" onClick={() => handleShowCoordinatorModal(course)}>
                            <i className="fas fa-user-tie mr-1"></i> المنسق
                        </Button>
                        <Button variant="outline-info" size="sm" className="ml-2 rounded" onClick={() => handleShowEditModal(course)}>
                            <i className="fas fa-pen mr-1"></i> تعديل
                        </Button>
                        <Button variant="outline-danger" size="sm" className="rounded" onClick={() => handleDeleteCourse(course.courseId)}>
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
                                <div className="d-flex flex-column flex-md-row justify-content-between mb-4">
                                    <div>
                                        <h4 className="font-weight-bold mb-1" style={{ color: '#2c3e50' }}>إدارة الدورات الدراسية</h4>
                                        <p className="text-muted mb-0 small">
                                            {selectedProgramName ?
                                                <span>عرض الدورات لـ: <strong>{selectedProgramName}</strong> <Link to="/admin/courses" onClick={() => setSelectedProgramId("")} className="text-primary small">(عرض الكل)</Link></span>
                                                : "عرض وإضافة وتعديل جميع الدورات في النظام"}
                                        </p>
                                    </div>
                                    <div className="mt-3 mt-md-0 d-flex flex-column flex-md-row align-items-stretch align-items-md-center">
                                        <Form.Group className="mb-2 mb-md-0 ml-md-3" style={{ minWidth: '200px' }}>
                                            <Form.Control as="select" value={selectedProgramId} onChange={(e) => setSelectedProgramId(e.target.value)} className="shadow-sm py-2 rounded-pill" style={{ height: 'auto' }}>
                                                <option value="">-- كل البرامج --</option>
                                                {programs.map(p => (<option key={p.academicProgramId} value={p.academicProgramId}>{p.name}</option>))}
                                            </Form.Control>
                                        </Form.Group>
                                        <Button variant="success" className="shadow-sm btn-fill rounded-pill px-4 py-2 ml-md-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'auto', whiteSpace: 'nowrap' }} onClick={handleShowAddModal}>
                                            <i className="fas fa-plus ml-2"></i> إضافة دورة
                                        </Button>
                                    </div>
                                </div>
                            </Card.Header>
                            <Card.Body className="px-0">
                                <div className="d-none d-md-block table-responsive">
                                    <Table className="table-hover mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="border-0 py-3 pl-4 text-muted small font-weight-bold align-middle">#</th>
                                                <th className="border-0 py-3 text-muted small font-weight-bold align-middle">اسم الدورة</th>
                                                <th className="border-0 py-3 text-muted small font-weight-bold align-middle">السعر</th>
                                                <th className="border-0 py-3 text-muted small font-weight-bold align-middle">البرنامج</th>
                                                <th className="border-0 py-3 text-muted small font-weight-bold text-center align-middle">الفصول</th>
                                                <th className="border-0 py-3 text-muted small font-weight-bold align-middle">المنسق</th>
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

            {/* Add Course Modal */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>إنشاء دورة جديدة</Modal.Title></Modal.Header>
                <Form onSubmit={handleAddFormSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>اسم الدورة <span className="text-danger">*</span></Form.Label>
                            <Form.Control type="text" name="name" value={newCourse.name} onChange={(e) => handleInputChange(e, setNewCourse)} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>البرنامج الأكاديمي <span className="text-danger">*</span></Form.Label>
                            <Form.Control as="select" name="academicProgramId" value={newCourse.academicProgramId} onChange={(e) => handleInputChange(e, setNewCourse)} required>
                                <option value="">-- اختر برنامج --</option>
                                {programs.map(p => (<option key={p.academicProgramId} value={p.academicProgramId}>{p.name}</option>))}
                            </Form.Control>
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>السعر</Form.Label>
                            <InputGroup>
                                <Form.Control type="number" name="price" value={newCourse.price} onChange={(e) => handleInputChange(e, setNewCourse)} placeholder="0" min="0" />
                                <InputGroup.Text>ل.س</InputGroup.Text>
                            </InputGroup>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowAddModal(false)}>إلغاء</Button>
                        <Button variant="primary" type="submit">حفظ الدورة</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Edit Course Modal */}
            {editingCourse && (
                <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                    <Modal.Header closeButton><Modal.Title>تعديل دورة: {editingCourse.name}</Modal.Title></Modal.Header>
                    <Form onSubmit={handleEditFormSubmit}>
                        <Modal.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>اسم الدورة <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="text" name="name" value={editingCourse.name} onChange={(e) => handleInputChange(e, setEditingCourse)} required />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>البرنامج</Form.Label>
                                <Form.Control type="text" value={editingCourse.academicProgramName} readOnly disabled />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>السعر</Form.Label>
                                <InputGroup>
                                    <Form.Control type="number" name="price" value={editingCourse.price} onChange={(e) => handleInputChange(e, setEditingCourse)} placeholder="0" min="0" />
                                    <InputGroup.Text>ل.س</InputGroup.Text>
                                </InputGroup>
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowEditModal(false)}>إلغاء</Button>
                            <Button variant="primary" type="submit">حفظ التعديلات</Button>
                        </Modal.Footer>
                    </Form>
                </Modal>
            )}

            {/* Assign Coordinator Modal */}
            {selectedCourse && (
                <Modal show={showCoordinatorModal} onHide={() => setShowCoordinatorModal(false)} centered>
                    <Modal.Header closeButton><Modal.Title>تعيين منسق لدورة: {selectedCourse.name}</Modal.Title></Modal.Header>
                    <Modal.Body>
                        <Form.Group>
                            <Form.Label>اختر المدرس المسؤول</Form.Label>
                            <Form.Select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)}>
                                <option value="">-- الرجاء اختيار مدرس --</option>
                                {teachers.map(teacher => (
                                    <option key={teacher.userId} value={teacher.userId}>
                                        {teacher.firstName} {teacher.lastName}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="justify-content-between">
                        <div>
                            {selectedCourse.coordinatorId && (
                                <Button variant="danger" onClick={handleUnassignCoordinator} disabled={submitting}>
                                    <i className="fas fa-times me-1"></i> إلغاء التعيين
                                </Button>
                            )}
                        </div>
                        <div>
                            <Button variant="secondary" onClick={() => setShowCoordinatorModal(false)} disabled={submitting}>إغلاق</Button>
                            <Button variant="primary" onClick={handleAssignCoordinator} disabled={submitting} className="ms-2">
                                {submitting ? <Spinner as="span" size="sm" /> : "حفظ التعيين"}
                            </Button>
                        </div>
                    </Modal.Footer>
                </Modal>
            )}
        </>
    );
}

export default CourseManagement;