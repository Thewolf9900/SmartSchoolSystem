import React, { useState, useEffect } from "react";
import { getPublicPrograms } from "../../services/public/publicService";
import { useHistory } from "react-router-dom"; // Added useHistory
import {
    Container, Row, Col, Card, Button,
    Spinner, Alert, ListGroup
} from "react-bootstrap";
import RegistrationModal from "./RegistrationModal";

const AvailablePrograms = () => {
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const history = useHistory(); // Initialize history

    // State for Modal
    const [showModal, setShowModal] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState(null);

    useEffect(() => {
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
                <Spinner animation="grow" variant="primary" role="status">
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
            <div className="wrapper" style={{ direction: "rtl", textAlign: "right", backgroundColor: "#f3f4f6", minHeight: "100vh" }}>
                <div className="main-panel" style={{ width: "100%" }}>
                    <Container fluid className="p-4 p-md-5">
                        {/* Header & Back Button */}
                        <div className="d-flex align-items-center justify-content-between mb-5">
                            <Button
                                variant="outline-secondary"
                                onClick={() => history.push('/auth/login')}
                                className="border-0 shadow-sm bg-white"
                                style={{ borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <i className="fas fa-arrow-right"></i>
                            </Button>
                            <h2 className="font-weight-bold text-center flex-grow-1 m-0" style={{ color: '#1f2937' }}>البرامج المتاحة للتسجيل</h2>
                            <div style={{ width: '45px' }}></div> {/* Spacer for perfect centering */}
                        </div>

                        <Row>
                            {programs.length > 0 ? (
                                programs.map((program) => (
                                    <Col md={6} lg={4} key={program.academicProgramId} className="mb-4">
                                        <Card className="h-100 border-0 shadow-hover" style={{ transition: 'all 0.3s ease', borderRadius: '16px', overflow: 'hidden' }}>
                                            <div style={{ height: '6px', background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)' }}></div>
                                            <Card.Body className="d-flex flex-column p-4">
                                                <Card.Title as="h4" className="font-weight-bold mb-3" style={{ color: '#111827' }}>{program.name}</Card.Title>
                                                <Card.Text className="text-muted flex-grow-1" style={{ lineHeight: '1.6' }}>{program.description}</Card.Text>

                                                <div className="mt-4">
                                                    <Card.Subtitle className="mb-3 text-uppercase text-secondary small font-weight-bold" style={{ letterSpacing: '1px' }}>الدورات المضمنة</Card.Subtitle>
                                                    <ListGroup variant="flush" className="mb-4">
                                                        {program.courseNames.map((course, index) => (
                                                            <ListGroup.Item key={index} className="px-0 border-0 py-1 d-flex align-items-center bg-transparent">
                                                                <i className="fas fa-check-circle text-success ml-2" style={{ fontSize: '0.8rem' }}></i>
                                                                {course}
                                                            </ListGroup.Item>
                                                        ))}
                                                    </ListGroup>
                                                </div>

                                                <div className="mt-auto pt-3 border-top">
                                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                                        <span className="text-muted small">التكلفة الإجمالية</span>
                                                        <span className="h5 font-weight-bold text-primary mb-0">{program.totalPrice.toLocaleString()} ل.س</span>
                                                    </div>
                                                    <Button
                                                        variant="primary"
                                                        className="w-100 py-2 shadow-sm font-weight-bold"
                                                        onClick={() => handleShowModal(program)}
                                                        style={{ borderRadius: '12px', background: 'linear-gradient(45deg, #6366f1, #4f46e5)', border: 'none' }}
                                                    >
                                                        تقدم الآن <i className="fas fa-chevron-left mr-2"></i>
                                                    </Button>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))
                            ) : (
                                <Col>
                                    <Alert variant="info" className="text-center shadow-sm border-0 bg-white" style={{ borderRadius: '12px' }}>
                                        <div className="py-4">
                                            <i className="nc-icon nc-bell-55 d-block mb-3 text-primary" style={{ fontSize: '2rem' }}></i>
                                            لا توجد برامج متاحة للتسجيل في الوقت الحالي.
                                        </div>
                                    </Alert>
                                </Col>
                            )}
                        </Row>
                    </Container>
                </div>
            </div>

            <RegistrationModal
                show={showModal}
                onHide={handleCloseModal}
                program={selectedProgram}
            />
        </>
    );
};

export default AvailablePrograms;