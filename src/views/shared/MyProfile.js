import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Form, Spinner, Alert, ListGroup } from "react-bootstrap";
import { toast } from 'react-toastify';
import { getMyProfile, changeMyPassword } from "services/shared/authService";

function MyProfile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const response = await getMyProfile();
                setProfile(response.data);
            } catch (error) {
                toast.error("فشل في تحميل بيانات الملف الشخصي.");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswords(prev => ({ ...prev, [name]: value }));
        if (passwordError) setPasswordError('');
    };

    const handleSubmitPassword = async (e) => {
        e.preventDefault();
        setPasswordError('');

        if (passwords.newPassword.length < 6) {
            setPasswordError("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.");
            return;
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            setPasswordError("كلمات المرور الجديدة غير متطابقة.");
            return;
        }

        setIsSubmitting(true);
        try {
            const passwordData = {
                OldPassword: passwords.oldPassword,
                NewPassword: passwords.newPassword
            };
            const response = await changeMyPassword(passwordData);
            toast.success(response.data.message || "تم تغيير كلمة المرور بنجاح!");
            setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || "فشل في تغيير كلمة المرور.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Container fluid className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <h5 className="mt-3">جاري تحميل ملفك الشخصي...</h5>
            </Container>
        );
    }

    if (!profile) {
        return <Container fluid><Alert variant="danger">لم يتم العثور على بيانات الملف الشخصي.</Alert></Container>;
    }

    return (
        <div className="content">
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="font-weight-bold mb-1" style={{ color: '#2c3e50' }}>ملفي الشخصي</h4>
                        <p className="text-muted mb-0 small">عرض وتعديل بياناتك الشخصية وتأمين حسابك</p>
                    </div>
                </div>

                <Row>
                    <Col md={5} className="mb-4">
                        <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '15px' }}>
                            <Card.Body className="p-4">
                                <div className="text-center mb-4">
                                    <div className="d-inline-flex align-items-center justify-content-center bg-light rounded-circle mb-3 shadow-sm" style={{ width: '100px', height: '100px' }}>
                                        <i className="nc-icon nc-single-02 text-primary fa-3x"></i>
                                    </div>
                                    <h5 className="font-weight-bold mb-1 text-dark">{profile.firstName} {profile.lastName}</h5>
                                    <p className="text-muted small mb-0">{profile.email}</p>
                                </div>
                                <hr className="my-4" style={{ borderColor: '#f1f1f1' }} />

                                <div className="d-flex align-items-center mb-3">
                                    <div className="icon-container bg-light rounded-circle p-2 ms-3 ml-3" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className="nc-icon nc-badge text-primary"></i>
                                    </div>
                                    <div>
                                        <p className="text-muted small mb-0">الاسم الأول</p>
                                        <h6 className="font-weight-bold mb-0 text-dark">{profile.firstName}</h6>
                                    </div>
                                </div>

                                <div className="d-flex align-items-center mb-3">
                                    <div className="icon-container bg-light rounded-circle p-2 ms-3 ml-3" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className="nc-icon nc-badge text-primary"></i>
                                    </div>
                                    <div>
                                        <p className="text-muted small mb-0">اسم العائلة</p>
                                        <h6 className="font-weight-bold mb-0 text-dark">{profile.lastName}</h6>
                                    </div>
                                </div>

                                <div className="d-flex align-items-center">
                                    <div className="icon-container bg-light rounded-circle p-2 ms-3 ml-3" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className="nc-icon nc-email-85 text-primary"></i>
                                    </div>
                                    <div>
                                        <p className="text-muted small mb-0">البريد الإلكتروني</p>
                                        <h6 className="font-weight-bold mb-0 text-dark">{profile.email}</h6>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={7}>
                        <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '15px' }}>
                            <Card.Header className="bg-white border-0 pt-4 px-4 pb-0" style={{ borderRadius: '15px 15px 0 0' }}>
                                <div className="d-flex align-items-center mb-3">
                                    <i className="nc-icon nc-key-25 text-primary mr-2 fa-lg"></i>
                                    <h5 className="font-weight-bold text-dark mb-0">تغيير كلمة المرور</h5>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-4">
                                <Form onSubmit={handleSubmitPassword}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="small font-weight-bold text-muted">كلمة المرور الحالية</Form.Label>
                                        <Form.Control
                                            type="password"
                                            name="oldPassword"
                                            value={passwords.oldPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            className="border-light bg-light shadow-sm"
                                            style={{ borderRadius: '8px', padding: '10px 15px' }}
                                        />
                                    </Form.Group>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="small font-weight-bold text-muted">كلمة المرور الجديدة</Form.Label>
                                                <Form.Control
                                                    type="password"
                                                    name="newPassword"
                                                    value={passwords.newPassword}
                                                    onChange={handlePasswordChange}
                                                    required
                                                    className="border-light bg-light shadow-sm"
                                                    style={{ borderRadius: '8px', padding: '10px 15px' }}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="small font-weight-bold text-muted">تأكيد كلمة المرور الجديدة</Form.Label>
                                                <Form.Control
                                                    type="password"
                                                    name="confirmPassword"
                                                    value={passwords.confirmPassword}
                                                    onChange={handlePasswordChange}
                                                    required
                                                    isInvalid={!!passwordError}
                                                    className="border-light bg-light shadow-sm"
                                                    style={{ borderRadius: '8px', padding: '10px 15px' }}
                                                />
                                                <Form.Control.Feedback type="invalid">{passwordError}</Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <div className="d-flex justify-content-end mt-4">
                                        <Button variant="primary" type="submit" className="px-4 py-2" disabled={isSubmitting} style={{ borderRadius: '8px', fontWeight: 'bold' }}>
                                            {isSubmitting ? (<Spinner as="span" animation="border" size="sm" />) : (<><i className="fas fa-save me-2 ml-2"></i> حفظ التغييرات</>)}
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default MyProfile;