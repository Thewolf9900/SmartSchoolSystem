import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { useLocation, Link } from "react-router-dom";
import { Card, Table, Container, Row, Col, Button, Spinner, Form, Modal } from "react-bootstrap";
import { getCourses, createCourse, updateCourse, deleteCourse, getClassroomsForCourse, assignCoordinatorToCourse, unassignCoordinatorFromCourse } from "services/admin/courseService";
import { getPrograms } from "services/admin/programService";
import { getTeachers } from "services/admin/userService";

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

function CourseManagement() {
    const query = useQuery();
    const initialProgramId = query.get("programId") || "";

    const [courses, setCourses] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProgramId, setSelectedProgramId] = useState(initialProgramId);
    const [classroomCounts, setClassroomCounts] = useState({});

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newCourse, setNewCourse] = useState({ name: "", academicProgramId: "" });
    const [editingCourse, setEditingCourse] = useState(null);

    const [teachers, setTeachers] = useState([]);
    const [showCoordinatorModal, setShowCoordinatorModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedTeacherId, setSelectedTeacherId] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const location = useLocation();

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [coursesResponse, programsResponse, teachersResponse] = await Promise.all([
                getCourses(),
                getPrograms(),
                getTeachers()
            ]);
            const fetchedCourses = coursesResponse.data || [];
            setCourses(fetchedCourses);
            setPrograms(programsResponse.data || []);
            setTeachers(teachersResponse.data || []);

            if (fetchedCourses.length > 0) {
                const countPromises = fetchedCourses.map(course => getClassroomsForCourse(course.courseId));
                const responses = await Promise.all(countPromises);
                const counts = {};
                responses.forEach((response, index) => {
                    counts[fetchedCourses[index].courseId] = response.data.length;
                });
                setClassroomCounts(counts);
            } else {
                setClassroomCounts({});
            }
        } catch (error) { toast.error("فشل في جلب البيانات."); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchInitialData(); }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const programIdFromUrl = params.get('programId') || "";
        setSelectedProgramId(programIdFromUrl);
    }, [location.search]);


    const handleShowAddModal = () => {
        setNewCourse({ name: "", academicProgramId: "" });
        setShowAddModal(true);
    };
    const handleCloseAddModal = () => setShowAddModal(false);
    const handleNewCourseInputChange = (e) => {
        setNewCourse({ ...newCourse, [e.target.name]: e.target.value });
    };
    const handleAddFormSubmit = async () => {
        if (!newCourse.name || !newCourse.academicProgramId) {
            toast.error("يرجى تعبئة الحقول المطلوبة.");
            return;
        } try {
            await createCourse(newCourse);

            toast.success("تم إنشاء الدورة!");
            handleCloseAddModal();
            fetchInitialData();
        } catch (error) {
            toast.error("فشل إنشاء الدورة.");
        }
    };

    const handleShowEditModal = (course) => {
        setEditingCourse(course);
        setShowEditModal(true);
    };
    const handleCloseEditModal = () => setShowEditModal(false);
    const handleEditCourseInputChange = (e) => {
        setEditingCourse({ ...editingCourse, [e.target.name]: e.target.value });
    };
    const handleEditFormSubmit = async () => {
        if (!editingCourse || !editingCourse.name) {
            toast.error("اسم الدورة مطلوب.");
            return;
        }
        try {
            await updateCourse(editingCourse.courseId, { name: editingCourse.name });
            toast.success("تم تحديث الدورة!");
            handleCloseEditModal();
            fetchInitialData();
        } catch (error) { toast.error("فشل تحديث الدورة."); }
    };

    const handleDeleteCourse = async (courseId) => {
        if (window.confirm("هل أنت متأكد من حذف هذه الدورة؟")) {
            try {
                await deleteCourse(courseId);
                toast.success("تم حذف الدورة!");
                fetchInitialData();
            }
            catch (error) {
                toast.error("فشل حذف الدورة." + error.response.data);
            }
        }
    };

    const handleShowCoordinatorModal = (course) => {
        setSelectedCourse(course);
        setSelectedTeacherId(course.coordinatorId || "");
        setShowCoordinatorModal(true);
    };

    const handleCloseCoordinatorModal = () => setShowCoordinatorModal(false);

    const handleAssignCoordinator = async () => {
        if (!selectedTeacherId) {
            toast.error("الرجاء اختيار مدرس.");
            return;
        }
        setSubmitting(true);
        try {
            await assignCoordinatorToCourse(selectedCourse.courseId, parseInt(selectedTeacherId));
            toast.success("تم تعيين المنسق بنجاح!");
            handleCloseCoordinatorModal();
            fetchInitialData();
        } catch (error) {
            toast.error(error.response?.data?.message || "فشل في تعيين المنسق.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUnassignCoordinator = async () => {
        if (!selectedCourse) return;

        if (window.confirm(`هل أنت متأكد من إلغاء تعيين المنسق من دورة "${selectedCourse.name}"؟`)) {
            setSubmitting(true);
            try {
                await unassignCoordinatorFromCourse(selectedCourse.courseId);
                toast.success("تم إلغاء تعيين المنسق بنجاح.");
                handleCloseCoordinatorModal();
                fetchInitialData();
            } catch (error) {
                toast.error(error.response?.data?.message || "فشل في إلغاء التعيين.");
            } finally {
                setSubmitting(false);
            }
        }
    };

    const filteredCourses = selectedProgramId ? courses.filter(course => course.academicProgramId === parseInt(selectedProgramId)) : courses;

    const renderTableBody = () => {
        if (loading) {
            return (<tr><td colSpan="6" className="text-center"><Spinner animation="border" /></td></tr>);
        }
        if (filteredCourses.length === 0) { return (<tr><td colSpan="6" className="text-center">لا توجد دورات لعرضها.</td></tr>); }
        return filteredCourses.map((course) => (
            <tr key={course.courseId}>
                <td>{course.courseId}</td>
                <td>{course.name}</td>
                <td>{course.academicProgramName || "غير محدد"}</td>
                <td><Link to={`/admin/classrooms?courseId=${course.courseId}`} className="btn btn-link p-0">{classroomCounts[course.courseId] ?? '...'}</Link></td>
                <td>{course.coordinatorName || <span className="text-muted">غير معين</span>}</td>
                <td>
                    <Button variant="warning" size="sm" className="ml-1" onClick={() => handleShowCoordinatorModal(course)} title="تعيين منسق"><i className="fas fa-user-tie"></i></Button>
                    <Button variant="info" size="sm" className="ml-1" onClick={() => handleShowEditModal(course)}><i className="fas fa-edit"></i></Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteCourse(course.courseId)}><i className="fas fa-trash"></i></Button>
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
                                    <Col md={8}><Card.Title as="h4">إدارة الدورات الدراسية</Card.Title><p className="card-category">عرض وإضافة وتعديل الدورات</p></Col>
                                    <Col md={4} className="d-flex justify-content-end"><Button variant="success" onClick={handleShowAddModal}><i className="fas fa-plus mr-1"></i> إضافة دورة</Button></Col>
                                </Row>
                                <Row className="mt-3">
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label>فلترة حسب البرنامج</Form.Label>
                                            <Form.Control as="select" value={selectedProgramId} onChange={(e) => setSelectedProgramId(e.target.value)}>
                                                <option value="">-- عرض الكل --</option>
                                                {programs.map(p => (<option key={p.academicProgramId} value={p.academicProgramId}>{p.name}</option>))}
                                            </Form.Control>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Header>
                            <Card.Body className="table-full-width table-responsive px-0">
                                <Table className="table-hover">
                                    <thead><tr><th className="border-0">#</th><th className="border-0">اسم الدورة</th><th className="border-0">البرنامج</th><th className="border-0">عدد الفصول</th><th className="border-0">منسق الدورة</th><th className="border-0">إجراءات</th></tr></thead>
                                    <tbody>{renderTableBody()}</tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>

            <Modal show={showAddModal} onHide={handleCloseAddModal} centered>
                <Modal.Header closeButton><Modal.Title>إنشاء دورة</Modal.Title></Modal.Header>
                <Modal.Body><Form><Form.Group><Form.Label>اسم الدورة <span className="text-danger">*</span></Form.Label><Form.Control type="text" name="name" value={newCourse.name} onChange={handleNewCourseInputChange} required /></Form.Group><Form.Group><Form.Label>البرنامج الأكاديمي <span className="text-danger">*</span></Form.Label><Form.Control as="select" name="academicProgramId" value={newCourse.academicProgramId} onChange={handleNewCourseInputChange} required><option value="">-- اختر --</option>{programs.map(p => (<option key={p.academicProgramId} value={p.academicProgramId}>{p.name}</option>))}</Form.Control></Form.Group></Form></Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={handleCloseAddModal}>إلغاء</Button><Button variant="primary" onClick={handleAddFormSubmit}>حفظ</Button></Modal.Footer>
            </Modal>

            {editingCourse && (<Modal show={showEditModal} onHide={handleCloseEditModal} centered>
                <Modal.Header closeButton><Modal.Title>تعديل: {editingCourse.name}</Modal.Title></Modal.Header>
                <Modal.Body><Form><Form.Group><Form.Label>اسم الدورة <span className="text-danger">*</span></Form.Label><Form.Control type="text" name="name" value={editingCourse.name} onChange={handleEditCourseInputChange} required /></Form.Group><Form.Group><Form.Label>البرنامج</Form.Label><Form.Control type="text" value={editingCourse.academicProgramName} readOnly disabled /><Form.Text className="text-muted">لا يمكن تغيير البرنامج.</Form.Text></Form.Group></Form></Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={handleCloseEditModal}>إلغاء</Button><Button variant="primary" onClick={handleEditFormSubmit}>حفظ</Button></Modal.Footer>
            </Modal>)}

            {selectedCourse && (
                <Modal show={showCoordinatorModal} onHide={handleCloseCoordinatorModal} centered>
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
                                    <i className="fas fa-times mr-1"></i> إلغاء التعيين
                                </Button>
                            )}
                        </div>
                        <div>
                            <Button variant="secondary" onClick={handleCloseCoordinatorModal} disabled={submitting}>إغلاق</Button>
                            <Button variant="primary" onClick={handleAssignCoordinator} disabled={submitting} className="mr-2">
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