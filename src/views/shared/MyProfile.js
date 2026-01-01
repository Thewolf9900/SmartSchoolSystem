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
        <Container fluid>
            <Row><Col md="12"><h4 className="title">ملفي الشخصي</h4></Col></Row>
            <Row className="mt-3">
                <Col md={5} className="mb-4">
                    <Card>
                        <Card.Header><Card.Title as="h5"><i className="nc-icon nc-single-02 mr-2"></i>المعلومات الشخصية</Card.Title></Card.Header>
                        <Card.Body>
                            <ListGroup variant="flush">
                                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                    <span className="text-muted">الاسم الأول</span>
                                    <strong>{profile.firstName}</strong>
                                </ListGroup.Item>
                                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                    <span className="text-muted">اسم العائلة</span>
                                    <strong>{profile.lastName}</strong>
                                </ListGroup.Item>
                                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                    <span className="text-muted">البريد الإلكتروني</span>
                                    <strong>{profile.email}</strong>
                                </ListGroup.Item>

                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={7}>
                    <Card>
                        <Card.Header><Card.Title as="h5"><i className="nc-icon nc-key-25 mr-2"></i>تغيير كلمة المرور</Card.Title></Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleSubmitPassword}>
                                <Form.Group>
                                    <Form.Label>كلمة المرور الحالية</Form.Label>
                                    <Form.Control type="password" name="oldPassword" value={passwords.oldPassword} onChange={handlePasswordChange} required />
                                </Form.Group>
                                <Form.Group className="mt-3">
                                    <Form.Label>كلمة المرور الجديدة</Form.Label>
                                    <Form.Control type="password" name="newPassword" value={passwords.newPassword} onChange={handlePasswordChange} required />
                                </Form.Group>
                                <Form.Group className="mt-3">
                                    <Form.Label>تأكيد كلمة المرور الجديدة</Form.Label>
                                    <Form.Control type="password" name="confirmPassword" value={passwords.confirmPassword} onChange={handlePasswordChange} required isInvalid={!!passwordError} />
                                    <Form.Control.Feedback type="invalid">{passwordError}</Form.Control.Feedback>
                                </Form.Group>
                                <Button variant="primary" type="submit" className="btn-fill mt-4 w-100" disabled={isSubmitting}>
                                    {isSubmitting ? (<Spinner as="span" animation="border" size="sm" />) : (<><i className="fas fa-save mr-2"></i> حفظ كلمة المرور</>)}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default MyProfile;