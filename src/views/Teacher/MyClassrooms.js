import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
    Container, Row, Col, Card, Button, ButtonGroup, Modal, Spinner
} from "react-bootstrap";
import { toast } from 'react-toastify';
import { getMyClassrooms } from "services/teacher/teacherService";

const AVAILABLE_ICONS = [
    "nc-icon nc-pin-3", "nc-icon nc-layers-3", "nc-icon nc-settings-gear-64", "nc-icon nc-tv-2",
    "nc-icon nc-palette", "nc-icon nc-bulb-63", "nc-icon nc-compass-05", "nc-icon nc-atom",
    "nc-icon nc-puzzle-10", "nc-icon nc-quote", "nc-icon nc-refresh-02", "nc-icon nc-satisfied",
    "nc-icon nc-spaceship", "nc-icon nc-tag-content", "nc-icon nc-tap-01", "nc-icon nc-umbrella-13"
];

const getStoredIcons = () => {
    const stored = sessionStorage.getItem('classroomIcons');
    return stored ? JSON.parse(stored) : {};
};

const setStoredIcon = (classroomId, icon) => {
    const allIcons = getStoredIcons();
    allIcons[classroomId] = icon;
    sessionStorage.setItem('classroomIcons', JSON.stringify(allIcons));
};

function MyClassrooms() {
    const [allClassrooms, setAllClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [classroomsWithLocalIcons, setClassroomsWithLocalIcons] = useState([]);
    const [filter, setFilter] = useState("ACTIVE");
    const [showIconModal, setShowIconModal] = useState(false);
    const [selectedClassroom, setSelectedClassroom] = useState(null);

    useEffect(() => {
        const fetchClassrooms = async () => {
            setLoading(true);
            try {
                const response = await getMyClassrooms(filter);
                setAllClassrooms(response.data);
            } catch (error) {
                toast.error("فشل في جلب قائمة الفصول الدراسية.");
                setAllClassrooms([]); // Clear data on error
            } finally {
                setLoading(false);
            }
        };
        fetchClassrooms();
    }, [filter]);

    useEffect(() => {
        if (allClassrooms) {
            const storedIcons = getStoredIcons();
            const classroomsWithIcons = allClassrooms.map(c => ({
                ...c,
                customIcon: storedIcons[c.classroomId] || c.customIcon || "nc-icon nc-grid-45"
            }));
            setClassroomsWithLocalIcons(classroomsWithIcons);
        }
    }, [allClassrooms]);

    const groupedClassrooms = useMemo(() => {
        return classroomsWithLocalIcons.reduce((acc, classroom) => {
            const programName = classroom.academicProgramName || "برامج غير محددة";
            if (!acc[programName]) {
                acc[programName] = [];
            }
            acc[programName].push(classroom);
            return acc;
        }, {});
    }, [classroomsWithLocalIcons]);

    const handleShowIconModal = (classroom) => {
        setSelectedClassroom(classroom);
        setShowIconModal(true);
    };

    const handleCloseIconModal = () => setShowIconModal(false);

    const handleIconSelect = (icon) => {
        if (!selectedClassroom) return;
        setStoredIcon(selectedClassroom.classroomId, icon);
        setClassroomsWithLocalIcons(prev =>
            prev.map(c =>
                c.classroomId === selectedClassroom.classroomId ? { ...c, customIcon: icon } : c
            )
        );
        handleCloseIconModal();
    };

    const renderContent = () => {
        if (loading) {
            return (<Row className="justify-content-center align-items-center" style={{ minHeight: "50vh" }}><Col className="text-center"><Spinner animation="border" variant="primary" /><h5 className="mt-3">جاري تحميل الفصول...</h5></Col></Row>);
        }
        if (Object.keys(groupedClassrooms).length === 0) {
            return (<Row><Col className="text-center text-muted mt-5"><h5><i className="nc-icon nc-simple-remove d-block mb-3" style={{ fontSize: '3rem' }}></i> لا توجد فصول دراسية تطابق الفلتر الحالي.</h5></Col></Row>);
        }
        return (
            <div className="mt-4">
                {Object.keys(groupedClassrooms).map(programName => (
                    <div key={programName} className="mb-5">
                        <h3 className="mb-3" style={{ borderRight: '4px solid #007bff', paddingRight: '15px' }}>{programName}</h3>
                        <Row>
                            {groupedClassrooms[programName].map((classroom) => (
                                <Col lg="4" md="6" key={classroom.classroomId} className="mb-4">
                                    <Card className="h-100 card-hover">
                                        <Card.Header className="text-center">
                                            <div className="icon-big icon-warning"><i className={`${classroom.customIcon} text-primary`} style={{ fontSize: "2.5rem" }}></i></div>
                                            <Card.Title as="h5" className="mt-2">{classroom.name}</Card.Title>
                                            <p className="card-category text-muted d-flex align-items-center justify-content-center flex-wrap">
                                                <span>{classroom.courseName}</span>
                                                {classroom.status === 'ACTIVE' ? (<i className="fas fa-cog fa-spin text-info ml-2" title="نشط"></i>) : (<i className="fas fa-check-circle text-success ml-2" title="مكتمل"></i>)}
                                            </p>
                                        </Card.Header>
                                        <Card.Body className="d-flex justify-content-between align-items-center py-3">
                                            <span className="font-weight-bold"><i className="fas fa-users text-info mr-2"></i> {classroom.enrolledStudentsCount} / {classroom.capacity} طالب</span>
                                            <Button variant="outline-secondary" size="sm" onClick={() => handleShowIconModal(classroom)} title="تغيير أيقونة العرض">تغيير الأيقونة <i className="fas fa-pencil-alt ml-1"></i></Button>
                                        </Card.Body>
                                        <Card.Footer>
                                            <hr className="mt-0" />
                                            <Button as={Link} to={`/teacher/classroom/${classroom.classroomId}`} variant="primary" className="btn-fill w-100">
                                                <i className="fas fa-arrow-right mr-2"></i> الذهاب للفصل
                                            </Button>
                                        </Card.Footer>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            <Container fluid>
                <Row className="align-items-center">
                    <Col md={6}><h4 className="title mb-0">فصولي الدراسية</h4><p className="category">قائمة بجميع الفصول الدراسية المسندة إليك.</p></Col>
                    <Col md={6} className="d-flex justify-content-end"><ButtonGroup>
                        <Button variant={filter === 'ACTIVE' ? 'primary' : 'outline-primary'} onClick={() => setFilter("ACTIVE")}>النشطة</Button>
                        <Button variant={filter === 'COMPLETED' ? 'primary' : 'outline-primary'} onClick={() => setFilter("COMPLETED")}>المكتملة</Button>
                        <Button variant={filter === 'ALL' ? 'primary' : 'outline-primary'} onClick={() => setFilter("ALL")}>الكل</Button>
                    </ButtonGroup></Col>
                </Row>
                {renderContent()}
            </Container>
            {selectedClassroom && (<Modal show={showIconModal} onHide={handleCloseIconModal} centered><Modal.Header closeButton><Modal.Title>اختر أيقونة للفصل: {selectedClassroom.name}</Modal.Title></Modal.Header><Modal.Body><Row className="text-center">{AVAILABLE_ICONS.map(icon => (<Col xs={3} key={icon} className="mb-3"><Button variant={selectedClassroom.customIcon === icon ? "primary" : "outline-primary"} className="p-3" onClick={() => handleIconSelect(icon)}><i className={icon} style={{ fontSize: "2rem" }}></i></Button></Col>))}</Row></Modal.Body></Modal>)}
        </>
    );
}

export default MyClassrooms;