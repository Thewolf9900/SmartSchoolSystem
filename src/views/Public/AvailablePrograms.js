import React, { useState, useEffect } from "react";
import { getPublicPrograms } from "../../services/public/publicService"; // إعادة تفعيل
import {
    Container, Row, Col, Card, Button,
    Spinner, Alert, ListGroup
} from "react-bootstrap";
import RegistrationModal from "./RegistrationModal"; // استيراد المكون الجديد

const AvailablePrograms = () => {
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State لإدارة النافذة المنبثقة
    const [showModal, setShowModal] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState(null);

    useEffect(() => {
        // --- الجزء الحقيقي (مفعل الآن) ---
        const fetchPrograms = async () => {
            setLoading(true);
            try {
                const response = await getPublicPrograms();
                setPrograms(response.data);
                setError(null);
            } catch (err) {
                setError("حدث خطأ أثناء جلب البرامج. يرجى المحاولة مرة أخرى لاحقًا.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchPrograms();
    }, []);

    const handleShowModal = (program) => {
        setSelectedProgram(program);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedProgram(null);
    };


    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    return (
        <>
            <div className="wrapper" style={{ direction: "rtl", textAlign: "right" }}>
                <div className="main-panel" style={{ width: "100%" }}>
                    <Container fluid className="p-4">
                        <h1 className="mb-4 text-center">البرامج المتاحة للتسجيل</h1>
                        <Row>
                            {programs.length > 0 ? (
                                programs.map((program) => (
                                    <Col md={6} lg={4} key={program.academicProgramId} className="mb-4">
                                        <Card className="h-100 shadow-sm">
                                            <Card.Body className="d-flex flex-column">
                                                <Card.Title as="h4">{program.name}</Card.Title>
                                                <Card.Text className="text-muted flex-grow-1">{program.description}</Card.Text>
                                                <Card.Subtitle className="mb-2 mt-3">الدورات المضمنة:</Card.Subtitle>
                                                <ListGroup variant="flush" className="mb-3">
                                                    {program.courseNames.map((course, index) => (
                                                        <ListGroup.Item key={index} className="px-0">{course}</ListGroup.Item>
                                                    ))}
                                                </ListGroup>
                                                <Card.Text as="h5" className="mt-auto text-success">
                                                    التكلفة: {program.totalPrice.toLocaleString()} ل.س
                                                </Card.Text>
                                            </Card.Body>
                                            <Card.Footer className="bg-transparent border-0">
                                                {/* تفعيل الزر */}
                                                <Button variant="primary" className="w-100" onClick={() => handleShowModal(program)}>
                                                    تقدم الآن
                                                </Button>
                                            </Card.Footer>
                                        </Card>
                                    </Col>
                                ))
                            ) : (
                                <Col>
                                    <Alert variant="info" className="text-center">
                                        لا توجد برامج متاحة للتسجيل في الوقت الحالي.
                                    </Alert>
                                </Col>
                            )}
                        </Row>
                    </Container>
                </div>
            </div>

            {/* عرض النافذة المنبثقة */}
            <RegistrationModal
                show={showModal}
                onHide={handleCloseModal}
                program={selectedProgram}
            />
        </>
    );
};

export default AvailablePrograms;