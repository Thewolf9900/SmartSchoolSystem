import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useHistory } from "react-router-dom";
import {
    Container, Row, Col, Card, Button, Breadcrumb, Table,
    Form, Spinner, ProgressBar, Alert
} from "react-bootstrap";
import { toast } from 'react-toastify';
import {
    getClassroomEnrollments, getGradingStatus,
    setRawGrades, calculateFinalGrades
} from "services/teacher/teacherService";

function GradingManagement() {
    const { classroomId } = useParams();
    const history = useHistory();

    const [enrollments, setEnrollments] = useState([]);
    const [gradingStatus, setGradingStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);

    const [editedGrades, setEditedGrades] = useState({});

    const fetchData = useCallback(async () => {
        try {
            const [enrollmentsRes, statusRes] = await Promise.all([
                getClassroomEnrollments(classroomId),
                getGradingStatus(classroomId)
            ]);
            setEnrollments(enrollmentsRes.data);
            setGradingStatus(statusRes.data);
        } catch (error) {
            toast.error("فشل في تحميل بيانات الطلاب والدرجات.");
        } finally {
            setLoading(false);
        }
    }, [classroomId]);

    useEffect(() => {
        setLoading(true);
        fetchData();
    }, [fetchData]);

    const handleGradeChange = (enrollmentId, field, value) => {
        if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
            const numericValue = value === '' ? null : parseFloat(value);
            setEditedGrades(prev => ({
                ...prev,
                [enrollmentId]: { ...prev[enrollmentId], [field]: numericValue }
            }));
        }
    };

    const handleSaveAllChanges = async () => {
        const editedEnrollmentIds = Object.keys(editedGrades);
        if (editedEnrollmentIds.length === 0) {
            toast.info("لا توجد تغييرات لحفظها.");
            return;
        }

        setIsSaving(true);

        const savePromises = editedEnrollmentIds.map(enrollmentId => {
            const currentStudent = enrollments.find(e => e.enrollmentId == enrollmentId);
            const gradesToUpdate = {
                PracticalGrade: editedGrades[enrollmentId].practicalGrade ?? currentStudent.practicalGrade,
                ExamGrade: editedGrades[enrollmentId].examGrade ?? currentStudent.examGrade,
            };
            return setRawGrades(enrollmentId, gradesToUpdate);
        });

        try {
            await Promise.all(savePromises);
            toast.success(`تم حفظ التغييرات لـ ${editedEnrollmentIds.length} طالب بنجاح!`);
            setEditedGrades({});
            await fetchData();
        } catch (error) {
            toast.error("حدث خطأ أثناء حفظ بعض التغييرات.");
            console.error("Error saving all changes:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCalculateFinalGrades = async () => {
        setIsCalculating(true);
        try {
            await calculateFinalGrades(classroomId);
            toast.success("تم حساب الدرجات النهائية بنجاح!");
            setLoading(true);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || error.response?.data || "فشل في حساب الدرجات النهائية.");
        } finally {
            setIsCalculating(false);
        }
    };

    const renderGradingSummary = () => {
        if (!gradingStatus) return null;
        const progress = gradingStatus.totalStudents > 0 ? (gradingStatus.gradesEnteredCount / gradingStatus.totalStudents) * 100 : 0;
        const hasUnsavedChanges = Object.keys(editedGrades).length > 0;

        return (
            <Card className="mb-4">
                <Card.Header><Card.Title as="h4">ملخص وإجراءات</Card.Title></Card.Header>
                <Card.Body>
                    <Row className="align-items-center">
                        <Col md={6}>
                            <p>تم رصد الدرجات لـ <strong>{gradingStatus.gradesEnteredCount}</strong> من <strong>{gradingStatus.totalStudents}</strong> طالبًا.</p>
                            <ProgressBar now={progress} label={`${Math.round(progress)}%`} animated />
                        </Col>
                        <Col md={6} className="text-center mt-3 mt-md-0 d-flex justify-content-around">
                            <Button variant="success" className="btn-fill" disabled={!hasUnsavedChanges || isSaving} onClick={handleSaveAllChanges}>
                                {isSaving ? (<><Spinner as="span" animation="border" size="sm" /> حفظ...</>) : (<><i className="fas fa-save mr-2"></i> حفظ التغييرات</>)}
                            </Button>
                            <Button variant="primary" className="btn-fill" disabled={!gradingStatus.isComplete || isCalculating || hasUnsavedChanges} onClick={handleCalculateFinalGrades}>
                                {isCalculating ? (<><Spinner as="span" animation="border" size="sm" /> حساب...</>) : (<><i className="fas fa-calculator mr-2"></i> حساب الدرجات النهائية</>)}
                            </Button>
                        </Col>
                        {hasUnsavedChanges && <Col xs={12}><Alert variant="warning" className="text-center mt-3 mb-0">لديك تغييرات غير محفوظة.</Alert></Col>}
                    </Row>
                </Card.Body>
            </Card>
        );
    };

    const renderStudentsTable = () => (
        <Card>
            <Card.Header><Card.Title as="h4">قائمة الطلاب</Card.Title></Card.Header>
            <Card.Body className="table-full-width table-responsive px-0">
                <Table className="table-hover table-striped">
                    <thead>
                        <tr>
                            <th>اسم الطالب</th>
                            <th style={{ width: '20%' }}>العملي (30)</th>
                            <th style={{ width: '20%' }}>الاختبار (70)</th>
                            <th style={{ width: '20%' }}>النهائي (100)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {enrollments.map(e => {
                            const studentEdits = editedGrades[e.enrollmentId] || {};
                            const practicalValue = studentEdits.practicalGrade !== undefined ? studentEdits.practicalGrade : e.practicalGrade;
                            const examValue = studentEdits.examGrade !== undefined ? studentEdits.examGrade : e.examGrade;

                            return (
                                <tr key={e.enrollmentId}>
                                    <td>{e.studentName}</td>
                                    <td><Form.Control type="text" inputMode="decimal" step="0.1" min="0" max="30" value={practicalValue ?? ''} onChange={ev => handleGradeChange(e.enrollmentId, 'practicalGrade', ev.target.value)} /></td>
                                    <td><Form.Control type="text" inputMode="decimal" step="0.1" min="0" max="70" value={examValue ?? ''} onChange={ev => handleGradeChange(e.enrollmentId, 'examGrade', ev.target.value)} /></td>
                                    <td><Form.Control type="text" readOnly value={e.finalGrade ?? 'N/A'} className="bg-light" /></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );

    return (
        <>
            <Container fluid>
                <Row><Col><Breadcrumb listProps={{ className: "bg-transparent p-0" }}><li className="breadcrumb-item"><Link to="/teacher/my-classrooms">فصولي</Link></li><li className="breadcrumb-item"><Link to={`/teacher/classroom/${classroomId}`}>البوابة</Link></li><Breadcrumb.Item active>الطلاب والدرجات</Breadcrumb.Item></Breadcrumb></Col></Row>
                <Row className="mb-3 align-items-center"><Col xs="auto"><Button variant="outline-secondary" onClick={() => history.goBack()} title="رجوع"><i className="fas fa-arrow-right"></i></Button></Col><Col><h4 className="title mb-0">إدارة الطلاب والدرجات</h4></Col></Row>

                {loading ? (
                    <div className="text-center py-5"><Spinner animation="border" /><h5 className="mt-3">جاري تحميل بيانات الطلاب...</h5></div>
                ) : gradingStatus && enrollments.length > 0 ? (
                    <>
                        {renderGradingSummary()}
                        {renderStudentsTable()}
                    </>
                ) : (
                    <Alert variant="info" className="text-center">لا يوجد طلاب مسجلون في هذا الفصل الدراسي بعد.</Alert>
                )}
            </Container>
        </>
    );
}

export default GradingManagement;