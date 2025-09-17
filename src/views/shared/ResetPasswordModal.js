import React, { useState } from "react";
import { Modal, Button, Form, Spinner, Alert } from "react-bootstrap";
import { toast } from "react-toastify";
import { requestPasswordReset, confirmPasswordReset } from "services/public/authService";

function ResetPasswordModal({ show, onHide }) {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({ email: '', nationalId: '', code: '', newPassword: '' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const response = await requestPasswordReset({ Email: data.email, NationalId: data.nationalId });
            toast.info("يتم إرسال الرمز... يرجى التحقق من بريدك الإلكتروني.");
            setMessage({ type: 'success', text: response.data.message });
            setStep(2);
        } catch (error) {
            setMessage({ type: 'danger', text: "حدث خطأ أثناء طلب الرمز." });
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await confirmPasswordReset({ Email: data.email, ResetCode: data.code, NewPassword: data.newPassword });
            toast.success("تم إعادة تعيين كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.");
            handleClose();
        } catch (error) {
            setMessage({ type: 'danger', text: error.response?.data?.message || "فشل في تأكيد الرمز." });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setData({ email: '', nationalId: '', code: '', newPassword: '' });
        setMessage({ type: '', text: '' });
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton><Modal.Title>إعادة تعيين كلمة المرور</Modal.Title></Modal.Header>
            {step === 1 ? (
                <Form onSubmit={handleRequestSubmit}>
                    <Modal.Body>
                        <p>أدخل بريدك الإلكتروني ورقمك الوطني لإرسال رمز إعادة التعيين.</p>
                        <Form.Group className="mb-3">
                            <Form.Label>البريد الإلكتروني</Form.Label>
                            <Form.Control type="email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} required />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>الرقم الوطني</Form.Label>
                            <Form.Control type="text" value={data.nationalId} onChange={(e) => setData({ ...data, nationalId: e.target.value })} required />
                        </Form.Group>
                        {message.text && <Alert variant={message.type} className="mt-3">{message.text}</Alert>}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleClose}>إلغاء</Button>
                        <Button variant="primary" type="submit" disabled={loading}>{loading ? <Spinner size="sm" /> : "طلب الرمز"}</Button>
                    </Modal.Footer>
                </Form>
            ) : (
                <Form onSubmit={handleConfirmSubmit}>
                    <Modal.Body>
                        <p>تم إرسال رمز إلى <strong>{data.email}</strong>. يرجى إدخاله أدناه مع كلمة المرور الجديدة.</p>
                        <Form.Group className="mb-3">
                            <Form.Label>رمز إعادة التعيين</Form.Label>
                            <Form.Control type="text" value={data.code} onChange={(e) => setData({ ...data, code: e.target.value })} required />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>كلمة المرور الجديدة</Form.Label>
                            <Form.Control type="password" value={data.newPassword} onChange={(e) => setData({ ...data, newPassword: e.target.value })} required />
                        </Form.Group>
                        {message.text && <Alert variant={message.type} className="mt-3">{message.text}</Alert>}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setStep(1)}>العودة</Button>
                        <Button variant="primary" type="submit" disabled={loading}>{loading ? <Spinner size="sm" /> : "تأكيد وإعادة التعيين"}</Button>
                    </Modal.Footer>
                </Form>
            )}
        </Modal>
    );
}

export default ResetPasswordModal;