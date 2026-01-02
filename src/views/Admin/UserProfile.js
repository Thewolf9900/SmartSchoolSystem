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
                {/* Unified Card for Profile Management */}
                <Row className="justify-content-center">
                    <Col md="10" lg="8">
                        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '15px' }}>
                            <Card.Header className="bg-white p-4 border-0" style={{ borderRadius: '15px 15px 0 0' }}>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h4 className="font-weight-bold mb-1" style={{ color: '#2c3e50' }}>الملف الشخصي</h4>
                                        <p className="text-muted mb-0 small">إدارة معلوماتك الشخصية وكلمة المرور</p>
                                    </div>
                                    {!isEditMode && (
                                        <Button
                                            variant="primary"
                                            className="rounded-pill btn-fill shadow-sm"
                                            onClick={() => setIsEditMode(true)}
                                        >
                                            <i className="fas fa-edit mr-2"></i> تعديل المعلومات
                                        </Button>
                                    )}
                                </div>
                            </Card.Header>
                            <Card.Body className="p-4">
                                {/* Personal Information Section */}
                                <h6 className="text-muted font-weight-bold mb-4 border-bottom pb-2">المعلومات الشخصية</h6>
                                <Form onSubmit={(e) => e.preventDefault()}>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="small font-weight-bold text-muted">الاسم الأول</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={profile.firstName}
                                                    onChange={e => setProfile({ ...profile, firstName: e.target.value })}
                                                    readOnly={!isEditMode}
                                                    className="rounded-pill border-0 shadow-sm custom-input"
                                                    style={{ backgroundColor: isEditMode ? '#fff' : '#f8f9fa' }}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="small font-weight-bold text-muted">اسم العائلة</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={profile.lastName}
                                                    onChange={e => setProfile({ ...profile, lastName: e.target.value })}
                                                    readOnly={!isEditMode}
                                                    className="rounded-pill border-0 shadow-sm custom-input"
                                                    style={{ backgroundColor: isEditMode ? '#fff' : '#f8f9fa' }}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="small font-weight-bold text-muted">البريد الإلكتروني</Form.Label>
                                                <Form.Control
                                                    type="email"
                                                    value={profile.email}
                                                    onChange={e => setProfile({ ...profile, email: e.target.value })}
                                                    readOnly={!isEditMode}
                                                    className="rounded-pill border-0 shadow-sm custom-input"
                                                    style={{ backgroundColor: isEditMode ? '#fff' : '#f8f9fa' }}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="small font-weight-bold text-muted">الرقم الوطني</Form.Label>
                                                <Form.Control
                                                    type="password"
                                                    placeholder={isEditMode ? "ادخل الرقم الوطني الجديد" : ""}
                                                    value={profile.nationalId || ""}
                                                    onChange={e => setProfile({ ...profile, nationalId: e.target.value })}
                                                    readOnly={!isEditMode}
                                                    className="rounded-pill border-0 shadow-sm custom-input"
                                                    style={{ backgroundColor: isEditMode ? '#fff' : '#f8f9fa' }}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    {isEditMode && (
                                        <div className="d-flex justify-content-end mt-3 mb-5">
                                            <Button variant="secondary" onClick={handleCancelEdit} className="rounded-pill mr-2 px-4">إلغاء</Button>
                                            <Button variant="success" onClick={handleSaveClick} disabled={submitting} className="rounded-pill btn-fill shadow-sm px-4">
                                                <i className="fas fa-save mr-2"></i> حفظ التغييرات
                                            </Button>
                                        </div>
                                    )}
                                </Form>

                                {/* Password Change Section */}
                                <h6 className="text-muted font-weight-bold mb-4 mt-4 border-bottom pb-2">تغيير كلمة المرور</h6>
                                <Form onSubmit={handleChangePassword}>
                                    <Row className="align-items-end">
                                        <Col md={5}>
                                            <Form.Group className="mb-3 mb-md-0">
                                                <Form.Label className="small font-weight-bold text-muted">الرقم الوطني (للتأكيد)</Form.Label>
                                                <Form.Control
                                                    type="password"
                                                    required
                                                    value={passwordData.nationalId}
                                                    onChange={e => setPasswordData({ ...passwordData, nationalId: e.target.value })}
                                                    placeholder="أدخل الرقم الوطني الحالي"
                                                    className="rounded-pill border-0 shadow-sm"
                                                    style={{ height: '45px' }}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={5}>
                                            <Form.Group className="mb-3 mb-md-0">
                                                <Form.Label className="small font-weight-bold text-muted">كلمة المرور الجديدة</Form.Label>
                                                <Form.Control
                                                    type="password"
                                                    required
                                                    value={passwordData.newPassword}
                                                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                    placeholder="****"
                                                    className="rounded-pill border-0 shadow-sm"
                                                    style={{ height: '45px' }}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={2}>
                                            <Button
                                                variant="info"
                                                type="submit"
                                                disabled={submitting}
                                                className="w-100 rounded-pill btn-fill shadow-sm"
                                                style={{ height: '45px' }}
                                            >
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