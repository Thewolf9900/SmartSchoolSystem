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
        const programIdFromUrl = query.get('programId') || "";
        setSelectedProgramId(programIdFromUrl);
    }, [location.search, query]);

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
        if (loading) {
            return (<tr><td colSpan="7" className="text-center"><Spinner animation="border" /></td></tr>);
        }
        if (filteredCourses.length === 0) {
            return (<tr><td colSpan="7" className="text-center">لا توجد دورات لعرضها.</td></tr>);
        }
        return filteredCourses.map((course) => (
            <tr key={course.courseId}>
                <td>{course.courseId}</td>
                <td>{course.name}</td>
                <td>{(course.price || 0).toLocaleString()} ل.س</td>
                <td>{course.academicProgramName || "-"}</td>
                <td><Link to={`/admin/classrooms?courseId=${course.courseId}`}>{classroomCounts[course.courseId] ?? '...'}</Link></td>
                <td>{course.coordinatorName || <Badge bg="secondary">غير معين</Badge>}</td>
                <td>
                    <Button variant="warning" size="sm" onClick={() => handleShowCoordinatorModal(course)} title="تعيين منسق" className="me-1"><i className="fas fa-user-tie"></i></Button>
                    <Button variant="info" size="sm" onClick={() => handleShowEditModal(course)} className="me-1"><i className="fas fa-edit"></i></Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteCourse(course.courseId)}><i className="fas fa-trash"></i></Button>
                </td>
            </tr>
        ));
    };

    return (
        <>
            <Container fluid>
                <Card className="str-table-with-hover">
                    <Card.Header>
                        <Card.Title as="h4">إدارة الدورات الدراسية</Card.Title>
                        {selectedProgramName ? (
                            <p className="card-category">
                                عرض الدورات للبرنامج: <span className="font-weight-bold">{selectedProgramName}</span>.
                                <Link to="/admin/courses" onClick={() => setSelectedProgramId("")} className="ms-2"> (عرض كل الدورات)</Link>
                            </p>
                        ) : (
                            <p className="card-category">عرض وإضافة وتعديل جميع الدورات في النظام</p>
                        )}
                        <Row className="mt-3 align-items-end">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>فلترة حسب البرنامج</Form.Label>
                                    <Form.Control as="select" value={selectedProgramId} onChange={(e) => setSelectedProgramId(e.target.value)}>
                                        <option value="">-- عرض الكل --</option>
                                        {programs.map(p => (<option key={p.academicProgramId} value={p.academicProgramId}>{p.name}</option>))}
                                    </Form.Control>
                                </Form.Group>
                            </Col>
                            <Col className="text-end">
                                <Button variant="success" onClick={handleShowAddModal}>
                                    <i className="fas fa-plus me-2"></i> إضافة دورة جديدة
                                </Button>
                            </Col>
                        </Row>
                    </Card.Header>
                    <Card.Body className="table-full-width table-responsive px-0">
                        <Table className="table-hover">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>اسم الدورة</th>
                                    <th>السعر</th>
                                    <th>البرنامج</th>
                                    <th>الفصول</th>
                                    <th>المنسق</th>
                                    <th>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>{renderTableBody()}</tbody>
                        </Table>
                    </Card.Body>
                </Card>
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