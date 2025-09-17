// src/views/ProgramManagement.js

import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { Link } from "react-router-dom"; // --- تأكد من استيراد Link ---

import {
    Card,
    Table,
    Container,
    Row,
    Col,
    Button,
    Spinner,
    Modal,
    Form,
} from "react-bootstrap";

import { getPrograms, createProgram, updateProgram, deleteProgram, getCoursesForProgram, getStudentsForProgram } from "services/admin/programService";

function ProgramManagement() {
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [courseCounts, setCourseCounts] = useState({});
    const [studentCounts, setStudentCounts] = useState({});

    const [showAddModal, setShowAddModal] = useState(false);
    const [newProgram, setNewProgram] = useState({ name: "", description: "" });

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingProgram, setEditingProgram] = useState(null);

    const fetchPrograms = async () => {
        setLoading(true);
        try {
            const programsResponse = await getPrograms();
            const fetchedPrograms = programsResponse.data || [];
            setPrograms(fetchedPrograms);

            if (fetchedPrograms.length > 0) {
                const courseCountPromises = fetchedPrograms.map(p => getCoursesForProgram(p.academicProgramId));
                const studentCountPromises = fetchedPrograms.map(p => getStudentsForProgram(p.academicProgramId));
                const [courseResponses, studentResponses] = await Promise.all([Promise.all(courseCountPromises), Promise.all(studentCountPromises)]);

                const newCourseCounts = {};
                courseResponses.forEach((response, index) => { newCourseCounts[fetchedPrograms[index].academicProgramId] = response.data.length; });
                setCourseCounts(newCourseCounts);

                const newStudentCounts = {};
                studentResponses.forEach((response, index) => { newStudentCounts[fetchedPrograms[index].academicProgramId] = response.data.length; });
                setStudentCounts(newStudentCounts);
            } else {
                setCourseCounts({});
                setStudentCounts({});
            }
        } catch (error) { toast.error("فشل في جلب البيانات."); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPrograms(); }, []);

    const handleShowAddModal = () => { setNewProgram({ name: "", description: "" }); setShowAddModal(true); };
    const handleCloseAddModal = () => setShowAddModal(false);
    const handleNewProgramInputChange = (e) => { setNewProgram({ ...newProgram, [e.target.name]: e.target.value }); };
    const handleAddFormSubmit = async () => {
        if (!newProgram.name) { toast.error("اسم البرنامج مطلوب."); return; }
        try { await createProgram(newProgram); toast.success("تم إنشاء البرنامج بنجاح!"); handleCloseAddModal(); fetchPrograms(); }
        catch (error) { toast.error("فشل في إنشاء البرنامج." + error.response.data); }
    };

    const handleShowEditModal = (program) => { setEditingProgram(program); setShowEditModal(true); };
    const handleCloseEditModal = () => setShowEditModal(false);
    const handleEditProgramInputChange = (e) => { setEditingProgram({ ...editingProgram, [e.target.name]: e.target.value }); };
    const handleEditFormSubmit = async () => {
        if (!editingProgram || !editingProgram.name) { toast.error("اسم البرنامج مطلوب."); return; }
        try {
            await updateProgram(editingProgram.academicProgramId, { name: editingProgram.name, description: editingProgram.description });
            toast.success("تم تحديث البرنامج بنجاح!"); handleCloseEditModal(); fetchPrograms();
        } catch (error) { toast.error("فشل في تحديث البرنامج." + error.response.data); }
    };

    const handleDeleteProgram = async (programId) => {
        if (window.confirm("هل أنت متأكد من رغبتك في حذف هذا البرنامج؟")) {
            try { await deleteProgram(programId); toast.success("تم حذف البرنامج بنجاح!"); fetchPrograms(); }
            catch (error) { toast.error("فشل في حذف البرنامج." + error.response.data); }
        }
    };

    const renderTableBody = () => {
        const colSpan = 6;
        if (loading) { return (<tr><td colSpan={colSpan} className="text-center"><Spinner animation="border" /></td></tr>); }
        if (programs.length === 0) { return (<tr><td colSpan={colSpan} className="text-center">لا توجد برامج أكاديمية لعرضها.</td></tr>); }
        return programs.map((program) => (
            <tr key={program.academicProgramId}>
                <td>{program.academicProgramId}</td>
                <td>{program.name}</td>
                <td>{program.description || "لا يوجد وصف"}</td>
                <td>
                    {/* --- هذا هو التعديل المطلوب: تحويل العدد إلى رابط --- */}
                    <Link to={`/admin/courses?programId=${program.academicProgramId}`} className="btn btn-link p-0">
                        {courseCounts[program.academicProgramId] ?? '...'}
                    </Link>
                </td>
                <td>{studentCounts[program.academicProgramId] ?? '...'}</td>
                <td>
                    <Button variant="info" size="sm" className="ml-2" onClick={() => handleShowEditModal(program)}><i className="fas fa-edit"></i> تعديل</Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteProgram(program.academicProgramId)}><i className="fas fa-trash"></i> حذف</Button>
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
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <Card.Title as="h4">إدارة البرامج الأكاديمية</Card.Title>
                                        <p className="card-category">عرض وإضافة وتعديل البرامج الأكاديمية في النظام</p>
                                    </div>
                                    <div>
                                        <Button variant="success" onClick={handleShowAddModal}><i className="fas fa-plus mr-1"></i> إضافة برنامج جديد</Button>
                                    </div>
                                </div>
                            </Card.Header>
                            <Card.Body className="table-full-width table-responsive px-0">
                                <Table className="table-hover">
                                    <thead>
                                        <tr>
                                            <th className="border-0">#</th>
                                            <th className="border-0">اسم البرنامج</th>
                                            <th className="border-0">الوصف</th>
                                            <th className="border-0">عدد الدورات</th>
                                            <th className="border-0">عدد الطلاب</th>
                                            <th className="border-0">إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>{renderTableBody()}</tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
            <Modal show={showAddModal} onHide={handleCloseAddModal} centered>
                <Modal.Header closeButton><Modal.Title>إنشاء برنامج أكاديمي جديد</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group><Form.Label>اسم البرنامج <span className="text-danger">*</span></Form.Label><Form.Control type="text" name="name" value={newProgram.name} onChange={handleNewProgramInputChange} required /></Form.Group>
                        <Form.Group><Form.Label>الوصف (اختياري)</Form.Label><Form.Control as="textarea" rows={3} name="description" value={newProgram.description} onChange={handleNewProgramInputChange} /></Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={handleCloseAddModal}>إلغاء</Button><Button variant="primary" onClick={handleAddFormSubmit}>حفظ البرنامج</Button></Modal.Footer>
            </Modal>
            {editingProgram && (
                <Modal show={showEditModal} onHide={handleCloseEditModal} centered>
                    <Modal.Header closeButton><Modal.Title>تعديل برنامج: {editingProgram.name}</Modal.Title></Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group><Form.Label>اسم البرنامج <span className="text-danger">*</span></Form.Label><Form.Control type="text" name="name" value={editingProgram.name} onChange={handleEditProgramInputChange} required /></Form.Group>
                            <Form.Group><Form.Label>الوصف (اختياري)</Form.Label><Form.Control as="textarea" rows={3} name="description" value={editingProgram.description} onChange={handleEditProgramInputChange} /></Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer><Button variant="secondary" onClick={handleCloseEditModal}>إلغاء</Button><Button variant="primary" onClick={handleEditFormSubmit}>حفظ التعديلات</Button></Modal.Footer>
                </Modal>
            )}
        </>
    );
}

export default ProgramManagement;