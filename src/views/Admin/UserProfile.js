// src/views/UserProfile.js

import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { Button, Card, Container, Row, Col, Form, Spinner, Modal, Alert } from "react-bootstrap";

import { getMyProfile, updateMyProfile } from "services/admin/profileService";
import { resetUserPassword } from "services/admin/userService";

const UserProfile = () => {
    // State for data
    const [profile, setProfile] = useState({ userId: null, firstName: "", lastName: "", email: "", nationalId: "" });
    const [originalProfile, setOriginalProfile] = useState(null);

    // States for UI control
    const [loading, setLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [verificationNationalId, setVerificationNationalId] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // States for password change - nationalId will be entered manually
    const [passwordData, setPasswordData] = useState({ nationalId: '', newPassword: '' });

    // Fetch profile data on load
    const fetchProfile = async () => {
        setLoading(true);
        try {
            const response = await getMyProfile();
            setProfile(response.data);
            setOriginalProfile(response.data);
        } catch (error) {
            toast.error("فشل في جلب بيانات الملف الشخصي.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleSaveClick = () => {
        if (JSON.stringify(profile) === JSON.stringify(originalProfile)) {
            toast.info("لم يتم إجراء أي تغييرات لحفظها.");
            setIsEditMode(false);
            return;
        }
        setShowVerificationModal(true);
    };

    const handleConfirmSave = async () => {
        if (!verificationNationalId) {
            toast.error("الرجاء إدخال الرقم الوطني الحالي للتأكيد.");
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                currentNationalId: verificationNationalId,
                firstName: profile.firstName,
                lastName: profile.lastName,
                email: profile.email,
                nationalId: profile.nationalId
            };
            await updateMyProfile(payload);
            toast.success("تم تحديث الملف الشخصي بنجاح!");
            setShowVerificationModal(false);
            setIsEditMode(false);
            setVerificationNationalId("");
            fetchProfile();
        } catch (error) {
            toast.error(error.response?.data?.message || "فشل في تحديث الملف الشخصي. تأكد من الرقم الوطني.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
        setProfile(originalProfile);
    };

    // Logic for the Change Password card
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!passwordData.nationalId || !passwordData.newPassword) {
            toast.error("الرجاء ملء كل حقول تغيير كلمة المرور.");
            return;
        }
        setSubmitting(true);
        try {
            await resetUserPassword(profile.userId, {
                nationalId: passwordData.nationalId,
                newPassword: passwordData.newPassword
            });
            toast.success("تم تغيير كلمة المرور بنجاح!");
            setPasswordData({ nationalId: '', newPassword: '' }); // Clear the form
        } catch (error) {
            toast.error(error.response?.data || "فشل تغيير كلمة المرور. تأكد من الرقم الوطني.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Container fluid className="text-center p-5">
                <Spinner animation="border" variant="primary" />
            </Container>
        );
    }

    return (
        <>
            <Container fluid>
                {/* Card 1: Personal Information */}
                <Row>
                    <Col md="12">
                        <Card>
                            <Card.Header>
                                <Row className="align-items-center">
                                    <Col>
                                        <Card.Title as="h4">تعديل المعلومات الشخصية</Card.Title>
                                    </Col>
                                    <Col className="text-right">
                                        {!isEditMode ? (
                                            <Button variant="primary" onClick={() => setIsEditMode(true)}>
                                                <i className="fas fa-edit mr-1"></i> تعديل
                                            </Button>
                                        ) : (
                                            <>
                                                <Button variant="secondary" onClick={handleCancelEdit} className="ml-2">إلغاء</Button>
                                                <Button variant="success" onClick={handleSaveClick} disabled={submitting}>
                                                    حفظ التغييرات
                                                </Button>
                                            </>
                                        )}
                                    </Col>
                                </Row>
                            </Card.Header>
                            <Card.Body>
                                <Form onSubmit={(e) => e.preventDefault()}>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group>
                                                <label>الاسم الأول</label>
                                                <Form.Control type="text" value={profile.firstName} onChange={e => setProfile({ ...profile, firstName: e.target.value })} readOnly={!isEditMode} />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <label>اسم العائلة</label>
                                                <Form.Control type="text" value={profile.lastName} onChange={e => setProfile({ ...profile, lastName: e.target.value })} readOnly={!isEditMode} />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row className="mt-3">
                                        <Col md={6}>
                                            <Form.Group>
                                                <label>البريد الإلكتروني</label>
                                                <Form.Control type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} readOnly={!isEditMode} />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <label>الرقم الوطني</label>
                                                <Form.Control type="text" placeholder={"ادخل الرقم الوطني الجديد"} onChange={e => setProfile({ ...profile, nationalId: e.target.value })} readOnly={!isEditMode} />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Card 2: Change Password */}
                <Row>
                    <Col md="12">
                        <Card>
                            <Card.Header>
                                <Card.Title as="h4">تغيير كلمة المرور</Card.Title>
                            </Card.Header>
                            <Card.Body>
                                <Form onSubmit={handleChangePassword}>
                                    <Row className="align-items-end">
                                        <Col md={5}>
                                            <Form.Group>
                                                <label>الرقم الوطني (للتأكيد)</label>
                                                <Form.Control
                                                    type="password"
                                                    required
                                                    value={passwordData.nationalId}
                                                    onChange={e => setPasswordData({ ...passwordData, nationalId: e.target.value })}
                                                    placeholder="أدخل رقمك الوطني الحالي"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={5}>
                                            <Form.Group>
                                                <label>كلمة المرور الجديدة</label>
                                                <Form.Control
                                                    type="password"
                                                    required
                                                    value={passwordData.newPassword}
                                                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                    placeholder="أدخل كلمة المرور الجديدة"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={2}>
                                            <Button variant="primary" type="submit" disabled={submitting} className="w-100">
                                                {submitting ? <Spinner size="sm" /> : "تغيير"}
                                            </Button>
                                        </Col>
                                    </Row>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>

            {/* Verification Modal */}
            <Modal show={showVerificationModal} onHide={() => setShowVerificationModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>تأكيد حفظ التغييرات</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="text-muted">لإتمام العملية، يرجى إدخال رقمك الوطني الحالي.</p>
                    <Form.Group>
                        <Form.Label>الرقم الوطني الحالي (سري)</Form.Label>
                        <Form.Control
                            type="password"
                            value={verificationNationalId}
                            onChange={e => setVerificationNationalId(e.target.value)}
                            placeholder="لن يتم عرض هذا الرقم"
                            autoFocus
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowVerificationModal(false)}>إلغاء</Button>
                    <Button variant="success" onClick={handleConfirmSave} disabled={submitting}>
                        {submitting ? <Spinner as="span" size="sm" /> : "تأكيد وحفظ"}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default UserProfile;