import React, { useState } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { submitRegistration } from '../../services/public/publicService';

const RegistrationModal = ({ show, onHide, program }) => {
    const initialState = {
        firstName: '',
        lastName: '',
        email: '',
        nationalId: '',
        password: '',
        confirmPassword: ''
    };
    const [formData, setFormData] = useState(initialState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // 1. التحقق من تطابق كلمتي المرور
        if (formData.password !== formData.confirmPassword) {
            const errorMessage = "كلمة المرور وتأكيدها غير متطابقين.";
            setError(errorMessage);
            toast.warn(errorMessage);
            return;
        }

        setLoading(true);
        try {
            const registrationData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                nationalId: formData.nationalId,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                academicProgramId: program.academicProgramId,
            };
            const response = await submitRegistration(registrationData);

            // 2. تحديث رسالة النجاح
            const successMessage = response.data.message || "تم إنشاء حسابك بنجاح! يمكنك الآن تسجيل الدخول لمتابعة حالة طلبك.";
            toast.success(successMessage);
            handleClose();

        } catch (err) {
            let errorMessage = "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.status === 409) {
                errorMessage = "هذا البريد الإلكتروني مسجل بالفعل.";
            }
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData(initialState);
        setError(null);
        onHide();
    };

    if (!program) return null;

    return (
        <Modal show={show} onHide={handleClose} centered dir="rtl">
            <Modal.Header closeButton>
                <Modal.Title>
                    تقديم طلب تسجيل في: <br />
                    <span className="text-primary">{program.name}</span>
                </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form.Group className="mb-3">
                        <Form.Label>الاسم الأول <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required disabled={loading} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>اسم العائلة <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required disabled={loading} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>البريد الإلكتروني <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="email" name="email" value={formData.email} onChange={handleInputChange} required disabled={loading} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>الرقم الوطني <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="text" name="nationalId" value={formData.nationalId} onChange={handleInputChange} required disabled={loading} />
                    </Form.Group>
                    <hr />
                    {/* 3. إضافة حقول كلمة المرور */}
                    <Form.Group className="mb-3">
                        <Form.Label>كلمة المرور <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="password" name="password" value={formData.password} onChange={handleInputChange} required disabled={loading} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>تأكيد كلمة المرور <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required disabled={loading} />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={loading}>
                        إلغاء
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? <Spinner as="span" size="sm" /> : "إنشاء حساب وتقديم الطلب"}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default RegistrationModal;