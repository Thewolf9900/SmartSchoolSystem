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


    const renderTableBody = () => {
        if (loading) { return (<tr><td colSpan="7" className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>); }
        if (programs.length === 0) { return (<tr><td colSpan="7" className="text-center py-5"><div className="text-muted"><i className="fas fa-layer-group fa-2x mb-3 d-block"></i>لا توجد برامج لعرضها.</div></td></tr>); }

        return programs.map((program) => (
            <tr key={program.academicProgramId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td className="align-middle pl-4 font-weight-bold text-muted">#{program.academicProgramId}</td>
                <td className="align-middle">
                    <span className="font-weight-bold text-dark">{program.name}</span>
                </td>
                <td className="align-middle text-muted small" style={{ maxWidth: '200px' }}>{program.description || "-"}</td>
                <td className="align-middle">
                    <Badge variant={program.isRegistrationOpen ? "success" : "danger"} className="px-3 py-2" style={{ borderRadius: '30px', fontSize: '10px' }}>
                        {program.isRegistrationOpen ? "مفتوح" : "مغلق"}
                    </Badge>
                </td>
                <td className="align-middle text-center">
                    <Link to={`/admin/courses?programId=${program.academicProgramId}`} className="text-primary font-weight-bold" style={{ textDecoration: 'none' }}>
                        {courseCounts[program.academicProgramId] ?? <Spinner animation="border" size="sm" />}
                    </Link>
                </td>
                <td className="align-middle text-center">
                    <span className="font-weight-bold text-dark">{studentCounts[program.academicProgramId] ?? <Spinner animation="border" size="sm" />}</span>
                </td>
                <td className="text-right pr-4 align-middle">
                    <Button
                        variant={program.isRegistrationOpen ? "outline-warning" : "outline-success"}
                        size="sm"
                        onClick={() => handleToggleRegistration(program.academicProgramId)}
                        className="mx-1"
                        title={program.isRegistrationOpen ? "إغلاق التسجيل" : "فتح التسجيل"}
                        style={{ width: '35px', height: '35px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <i className={`fas ${program.isRegistrationOpen ? "fa-lock" : "fa-lock-open"}`}></i>
                    </Button>
                    <Button
                        variant="outline-info"
                        size="sm"
                        className="mx-1"
                        onClick={() => handleShowEditModal(program)}
                        title="تعديل"
                        style={{ width: '35px', height: '35px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <i className="fas fa-pen"></i>
                    </Button>
                    <Button
                        variant="outline-danger"
                        size="sm"
                        className="mx-1"
                        onClick={() => handleDeleteProgram(program.academicProgramId)}
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
        if (programs.length === 0) { return (<div className="text-center py-5 text-muted">لا توجد برامج لعرضها.</div>); }

        return programs.map((program) => (
            <Card key={program.academicProgramId} className="mb-3 border shadow-sm">
                <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center">
                            <div className="rounded-circle d-flex align-items-center justify-content-center mr-2" style={{ width: '40px', height: '40px', backgroundColor: '#e3f2fd', color: '#007bff' }}>
                                <i className="fas fa-graduation-cap"></i>
                            </div>
                            <div>
                                <h6 className="font-weight-bold mb-0 text-dark">{program.name}</h6>
                                <small className="text-muted">#{program.academicProgramId}</small>
                            </div>
                        </div>
                        <Badge variant={program.isRegistrationOpen ? "success" : "danger"} className="px-2 py-1">
                            {program.isRegistrationOpen ? "مفتوح" : "مغلق"}
                        </Badge>
                    </div>

                    {program.description && <div className="mb-3 text-muted small border-bottom pb-2">{program.description}</div>}

                    <div className="d-flex justify-content-between mb-3 text-center">
                        <div className="w-50 border-right">
                            <div className="text-muted small">الدورات</div>
                            <Link to={`/admin/courses?programId=${program.academicProgramId}`} className="font-weight-bold h5 mb-0 d-block text-primary">
                                {courseCounts[program.academicProgramId] ?? '-'}
                            </Link>
                        </div>
                        <div className="w-50">
                            <div className="text-muted small">الطلاب</div>
                            <span className="font-weight-bold h5 mb-0 text-dark">{studentCounts[program.academicProgramId] ?? '-'}</span>
                        </div>
                    </div>

                    <div className="d-flex justify-content-end border-top pt-2">
                        <Button
                            variant="light"
                            size="sm"
                            className={`ml-2 ${program.isRegistrationOpen ? "text-warning" : "text-success"}`}
                            onClick={() => handleToggleRegistration(program.academicProgramId)}
                        >
                            <i className={`fas ${program.isRegistrationOpen ? "fa-lock" : "fa-lock-open"} mr-1`}></i>
                            {program.isRegistrationOpen ? "أغلق التسجيل" : "افتح التسجيل"}
                        </Button>
                        <Button variant="light" size="sm" className="text-info ml-2" onClick={() => handleShowEditModal(program)}>
                            <i className="fas fa-pen mr-1"></i> تعديل
                        </Button>
                        <Button variant="light" size="sm" className="text-danger" onClick={() => handleDeleteProgram(program.academicProgramId)}>
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
                                        <h4 className="font-weight-bold mb-1" style={{ color: '#2c3e50' }}>إدارة البرامج الأكاديمية</h4>
                                        <p className="text-muted mb-0 small">عرض وإضافة وتعديل البرامج وحالة التسجيل</p>
                                    </div>
                                    <div className="mt-3 mt-md-0">
                                        <Button variant="success" className="shadow-sm btn-fill rounded-pill" onClick={handleShowAddModal}>
                                            <i className="fas fa-plus mr-2"></i> إضافة برنامج جديد
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
                                                <th className="border-0 py-3 text-muted small font-weight-bold align-middle">اسم البرنامج</th>
                                                <th className="border-0 py-3 text-muted small font-weight-bold align-middle">الوصف</th>
                                                <th className="border-0 py-3 text-muted small font-weight-bold align-middle">حالة التسجيل</th>
                                                <th className="border-0 py-3 text-muted small font-weight-bold text-center align-middle">الدورات</th>
                                                <th className="border-0 py-3 text-muted small font-weight-bold text-center align-middle">الطلاب</th>
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

            {/* Add Program Modal */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered className="custom-modal">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="font-weight-bold ml-auto">إنشاء برنامج جديد</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddFormSubmit}>
                    <Modal.Body className="pt-2">
                        <Form.Group className="mb-3">
                            <Form.Label className="small font-weight-bold text-muted">اسم البرنامج <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={newProgram.name}
                                onChange={(e) => handleInputChange(e, setNewProgram)}
                                required
                                className="rounded-pill border-0 shadow-sm"
                                style={{ backgroundColor: '#f8f9fa' }}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="small font-weight-bold text-muted">الوصف</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={newProgram.description}
                                onChange={(e) => handleInputChange(e, setNewProgram)}
                                className="rounded-xl border-0 shadow-sm"
                                style={{ backgroundColor: '#f8f9fa', borderRadius: '15px' }}
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Check
                                type="switch"
                                id="isRegistrationOpen-add"
                                label={<span className="font-weight-bold text-muted small">فتح باب التسجيل لهذا البرنامج</span>}
                                name="isRegistrationOpen"
                                checked={newProgram.isRegistrationOpen}
                                onChange={(e) => handleInputChange(e, setNewProgram)}
                                className="custom-switch-lg"
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="border-top-0 pt-0">
                        <Button variant="light" onClick={() => setShowAddModal(false)} className="rounded-pill font-weight-bold text-muted">إلغاء</Button>
                        <Button variant="primary" type="submit" className="rounded-pill px-4 shadow-sm btn-fill">حفظ</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Edit Program Modal */}
            {editingProgram && (
                <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered className="custom-modal">
                    <Modal.Header closeButton className="border-0 pb-0">
                        <Modal.Title className="font-weight-bold ml-auto">تعديل برنامج: {editingProgram.name}</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleEditFormSubmit}>
                        <Modal.Body className="pt-2">
                            <Form.Group className="mb-3">
                                <Form.Label className="small font-weight-bold text-muted">اسم البرنامج <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    name="name"
                                    value={editingProgram.name}
                                    onChange={(e) => handleInputChange(e, setEditingProgram)}
                                    required
                                    className="rounded-pill border-0 shadow-sm"
                                    style={{ backgroundColor: '#f8f9fa' }}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className="small font-weight-bold text-muted">الوصف</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="description"
                                    value={editingProgram.description}
                                    onChange={(e) => handleInputChange(e, setEditingProgram)}
                                    className="rounded-xl border-0 shadow-sm"
                                    style={{ backgroundColor: '#f8f9fa', borderRadius: '15px' }}
                                />
                            </Form.Group>
                            <Form.Group>
                                <Form.Check
                                    type="switch"
                                    id="isRegistrationOpen-edit"
                                    label={<span className="font-weight-bold text-muted small">التسجيل مفتوح لهذا البرنامج</span>}
                                    name="isRegistrationOpen"
                                    checked={editingProgram.isRegistrationOpen}
                                    onChange={(e) => handleInputChange(e, setEditingProgram)}
                                    className="custom-switch-lg"
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer className="border-top-0 pt-0">
                            <Button variant="light" onClick={() => setShowEditModal(false)} className="rounded-pill font-weight-bold text-muted">إلغاء</Button>
                            <Button variant="primary" type="submit" className="rounded-pill px-4 shadow-sm btn-fill">حفظ التعديلات</Button>
                        </Modal.Footer>
                    </Form>
                </Modal>
            )}
        </>
    );
}

export default ProgramManagement;