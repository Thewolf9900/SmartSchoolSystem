import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { Link } from "react-router-dom";
import {
    Card, Table, Container, Row, Col, Button,
    Spinner, Modal, Form, Badge
} from "react-bootstrap";
import {
    getPrograms, createProgram, updateProgram, deleteProgram,
    getCoursesForProgram, getStudentsForProgram, toggleProgramRegistration
} from "services/admin/programService";

function ProgramManagement() {
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [courseCounts, setCourseCounts] = useState({});
    const [studentCounts, setStudentCounts] = useState({});
    const [showAddModal, setShowAddModal] = useState(false);
    const [newProgram, setNewProgram] = useState({ name: "", description: "", isRegistrationOpen: false });
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingProgram, setEditingProgram] = useState(null);

    const fetchProgramsData = async () => {
        setLoading(true);
        try {
            const programsResponse = await getPrograms();
            const fetchedPrograms = programsResponse.data || [];
            setPrograms(fetchedPrograms);

            if (fetchedPrograms.length > 0) {
                const courseCountPromises = fetchedPrograms.map(p => getCoursesForProgram(p.academicProgramId).catch(() => ({ data: [] })));
                const studentCountPromises = fetchedPrograms.map(p => getStudentsForProgram(p.academicProgramId).catch(() => ({ data: [] })));
                const [courseResponses, studentResponses] = await Promise.all([Promise.all(courseCountPromises), Promise.all(studentCountPromises)]);

                const newCourseCounts = {};
                courseResponses.forEach((res, i) => { newCourseCounts[fetchedPrograms[i].academicProgramId] = res.data.length; });
                setCourseCounts(newCourseCounts);

                const newStudentCounts = {};
                studentResponses.forEach((res, i) => { newStudentCounts[fetchedPrograms[i].academicProgramId] = res.data.length; });
                setStudentCounts(newStudentCounts);
            }
        } catch (error) {
            toast.error("فشل في جلب بيانات البرامج.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProgramsData();
    }, []);

    const handleInputChange = (e, setStateFunc) => {
        const { name, value, type, checked } = e.target;
        const inputValue = type === 'checkbox' || type === 'switch' ? checked : value;
        setStateFunc(prevState => ({ ...prevState, [name]: inputValue }));
    };

    const handleShowAddModal = () => {
        setNewProgram({ name: "", description: "", isRegistrationOpen: false });
        setShowAddModal(true);
    };

    const handleAddFormSubmit = async (e) => {
        e.preventDefault();
        if (!newProgram.name) {
            toast.warn("اسم البرنامج مطلوب.");
            return;
        }
        try {
            await createProgram(newProgram);
            toast.success("تم إنشاء البرنامج بنجاح!");
            setShowAddModal(false);
            fetchProgramsData();
        } catch (error) {
            toast.error(error.response?.data?.message || "فشل في إنشاء البرنامج.");
        }
    };

    const handleShowEditModal = (program) => {
        setEditingProgram(program);
        setShowEditModal(true);
    };

    const handleEditFormSubmit = async (e) => {
        e.preventDefault();
        if (!editingProgram?.name) return;
        try {
            await updateProgram(editingProgram.academicProgramId, editingProgram);
            toast.success("تم تحديث البرنامج بنجاح!");
            setShowEditModal(false);
            fetchProgramsData();
        } catch (error) {
            toast.error(error.response?.data?.message || "فشل في تحديث البرنامج.");
        }
    };

    const handleToggleRegistration = async (programId) => {
        try {
            await toggleProgramRegistration(programId);
            toast.success("تم تغيير حالة التسجيل بنجاح.");
            fetchProgramsData(); // Refresh data to show the new status
        } catch (error) {
            toast.error("فشل في تغيير حالة التسجيل.");
        }
    };

    const handleDeleteProgram = async (programId) => {
        if (window.confirm("هل أنت متأكد من رغبتك في حذف هذا البرنامج؟")) {
            try {
                await deleteProgram(programId);
                toast.success("تم حذف البرنامج بنجاح!");
                fetchProgramsData();
            } catch (error) {
                toast.error(error.response?.data?.message || "فشل في حذف البرنامج.");
            }
        }
    };

    return (
        <>
            <Container fluid>
                <Row>
                    <Col md="12">
                        <Card className="str-table-with-hover">
                            <Card.Header>
                                <div className="d-flex justify-content-between align-items-center">
                                    <Card.Title as="h4">إدارة البرامج الأكاديمية</Card.Title>
                                    <Button variant="success" onClick={handleShowAddModal}>
                                        <i className="fas fa-plus me-2"></i> إضافة برنامج جديد
                                    </Button>
                                </div>
                                <p className="card-category">عرض وإضافة وتعديل البرامج وحالة التسجيل</p>
                            </Card.Header>
                            <Card.Body className="table-full-width table-responsive px-0">
                                <Table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>اسم البرنامج</th>
                                            <th>الوصف</th>
                                            <th>حالة التسجيل</th>
                                            <th>الدورات</th>
                                            <th>الطلاب</th>
                                            <th>إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="7" className="text-center"><Spinner animation="border" /></td></tr>
                                        ) : programs.length > 0 ? (
                                            programs.map((program) => (
                                                <tr key={program.academicProgramId}>
                                                    <td>{program.academicProgramId}</td>
                                                    <td>{program.name}</td>
                                                    <td>{program.description || "-"}</td>
                                                    <td>
                                                        <Badge bg={program.isRegistrationOpen ? "success" : "danger"}>
                                                            {program.isRegistrationOpen ? "مفتوح" : "مغلق"}
                                                        </Badge>
                                                    </td>
                                                    <td><Link to={`/admin/courses?programId=${program.academicProgramId}`}>{courseCounts[program.academicProgramId] ?? '...'}</Link></td>
                                                    <td>{studentCounts[program.academicProgramId] ?? '...'}</td>
                                                    <td>
                                                        <Button variant={program.isRegistrationOpen ? "warning" : "success"} size="sm" onClick={() => handleToggleRegistration(program.academicProgramId)} className="me-1">
                                                            <i className={program.isRegistrationOpen ? "fas fa-lock" : "fas fa-lock-open"}></i>
                                                        </Button>
                                                        <Button variant="info" size="sm" onClick={() => handleShowEditModal(program)} className="me-1">
                                                            <i className="fas fa-edit"></i>
                                                        </Button>
                                                        <Button variant="danger" size="sm" onClick={() => handleDeleteProgram(program.academicProgramId)}>
                                                            <i className="fas fa-trash"></i>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="7" className="text-center">لا توجد برامج لعرضها.</td></tr>
                                        )}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>

            {/* Add Program Modal */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>إنشاء برنامج جديد</Modal.Title></Modal.Header>
                <Form onSubmit={handleAddFormSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>اسم البرنامج <span className="text-danger">*</span></Form.Label>
                            <Form.Control type="text" name="name" value={newProgram.name} onChange={(e) => handleInputChange(e, setNewProgram)} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>الوصف</Form.Label>
                            <Form.Control as="textarea" rows={3} name="description" value={newProgram.description} onChange={(e) => handleInputChange(e, setNewProgram)} />
                        </Form.Group>
                        <Form.Group>
                            <Form.Check type="switch" id="isRegistrationOpen-add" label="فتح باب التسجيل لهذا البرنامج" name="isRegistrationOpen"
                                checked={newProgram.isRegistrationOpen} onChange={(e) => handleInputChange(e, setNewProgram)} />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowAddModal(false)}>إلغاء</Button>
                        <Button variant="primary" type="submit">حفظ</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Edit Program Modal */}
            {editingProgram && (
                <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                    <Modal.Header closeButton><Modal.Title>تعديل برنامج: {editingProgram.name}</Modal.Title></Modal.Header>
                    <Form onSubmit={handleEditFormSubmit}>
                        <Modal.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>اسم البرنامج <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="text" name="name" value={editingProgram.name} onChange={(e) => handleInputChange(e, setEditingProgram)} required />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>الوصف</Form.Label>
                                <Form.Control as="textarea" rows={3} name="description" value={editingProgram.description} onChange={(e) => handleInputChange(e, setEditingProgram)} />
                            </Form.Group>
                            <Form.Group>
                                <Form.Check type="switch" id="isRegistrationOpen-edit" label="التسجيل مفتوح لهذا البرنامج" name="isRegistrationOpen"
                                    checked={editingProgram.isRegistrationOpen} onChange={(e) => handleInputChange(e, setEditingProgram)} />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowEditModal(false)}>إلغاء</Button>
                            <Button variant="primary" type="submit">حفظ التعديلات</Button>
                        </Modal.Footer>
                    </Form>
                </Modal>
            )}
        </>
    );
}

export default ProgramManagement;