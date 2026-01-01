import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    Container, Row, Col, Card, Table, Spinner, Badge,
    Button, Form, Modal, Alert
} from 'react-bootstrap';
import {
    getRegistrations, requestPayment, approveRegistration,
    rejectRegistration, requestNewReceipt
} from 'services/admin/registrationService';

const statusMap = {
    PendingReview: { text: 'قيد المراجعة', variant: 'secondary' },
    AwaitingPayment: { text: 'بانتظار الدفع', variant: 'warning' },
    PaymentSubmitted: { text: 'تم تقديم الدفع', variant: 'info' },
    Approved: { text: 'مقبول', variant: 'success' },
    Rejected: { text: 'مرفوض', variant: 'danger' },
    ReceiptRejected: { text: 'الإيصال مرفوض', variant: 'danger' },
};

function RegistrationManagement() {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState("PendingReview"); // فلتر افتراضي

    const [showModal, setShowModal] = useState(false);
    const [modalConfig, setModalConfig] = useState({ type: '', data: null });
    const [modalInput, setModalInput] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await getRegistrations(selectedStatus || null);
            setRegistrations(response.data);
        } catch (error) {
            toast.error("فشل في جلب طلبات التسجيل.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedStatus]);

    const handleShowModal = (type, data) => {
        setModalConfig({ type, data });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setModalInput("");
        setModalConfig({ type: '', data: null });
    };

    const handleModalSubmit = async () => {
        setSubmitting(true);
        const { type, data } = modalConfig;
        try {
            switch (type) {
                case 'requestPayment':
                    await requestPayment(data.registrationId, modalInput);
                    toast.success("تم إرسال طلب الدفع.");
                    break;
                case 'approve':
                    await approveRegistration(data.registrationId);
                    toast.success("تمت الموافقة النهائية.");
                    break;
                case 'reject':
                case 'rejectReceipt': // يعاملان بنفس الطريقة تقريباً
                    if (!modalInput) {
                        toast.warn("سبب الرفض مطلوب.");
                        setSubmitting(false);
                        return;
                    }
                    if (type === 'reject') {
                        await rejectRegistration(data.registrationId, modalInput);
                        toast.success("تم رفض الطلب.");
                    } else {
                        await requestNewReceipt(data.registrationId, modalInput);
                        toast.success("تم رفض الإيصال وطلب إيصال جديد.");
                    }
                    break;
                default: break;
            }
            handleCloseModal();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "حدث خطأ.");
        } finally {
            setSubmitting(false);
        }
    };

    const renderActionButtons = (reg) => {
        switch (reg.status) {
            case 'PendingReview':
                return (
                    <>
                        <Button variant="primary" size="sm" className="me-1" onClick={() => handleShowModal('requestPayment', reg)} title="طلب الدفع">
                            <i className="fas fa-file-invoice-dollar"></i>
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleShowModal('reject', reg)} title="رفض الطلب">
                            <i className="fas fa-times-circle"></i>
                        </Button>
                    </>
                );
            case 'PaymentSubmitted':
                return (
                    <>
                        <Button as="a" href={reg.paymentReceiptUrl} target="_blank" variant="info" size="sm" className="me-1" disabled={!reg.paymentReceiptUrl} title="عرض الإيصال">
                            <i className="fas fa-receipt"></i>
                        </Button>
                        <Button variant="success" size="sm" className="me-1" onClick={() => handleShowModal('approve', reg)} title="موافقة نهائية">
                            <i className="fas fa-check-circle"></i>
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleShowModal('rejectReceipt', reg)} title="رفض الإيصال وطلب إيصال جديد">
                            <i className="fas fa-undo"></i>
                        </Button>
                    </>
                );
            case 'ReceiptRejected':
                return (
                    <Button variant="danger" size="sm" onClick={() => handleShowModal('reject', reg)} title="رفض الطلب نهائياً">
                        <i className="fas fa-times-circle"></i>
                    </Button>
                );
            default:
                return <span className="text-muted">--</span>;
        }
    };

    const renderModalContent = () => {
        const { type, data } = modalConfig;
        if (!data) return null;

        switch (type) {
            case 'requestPayment':
                const defaultNote = `تمت الموافقة المبدئية. يرجى إرسال المبلغ وقدره ${data.totalPrice?.toLocaleString()} ل.س`;
                return {
                    title: 'إرسال طلب الدفع',
                    body: <Form.Control as="textarea" rows={3} defaultValue={defaultNote} onChange={e => setModalInput(e.target.value)} />,
                    submitText: 'إرسال الطلب'
                };
            case 'approve':
                return {
                    title: 'تأكيد الموافقة النهائية',
                    body: <p>هل أنت متأكد من الموافقة على طلب <strong>{data.fullName}</strong>؟ سيتم إنشاء حساب طالب له.</p>,
                    submitText: 'نعم، موافقة'
                };
            case 'reject':
                return {
                    title: 'رفض طلب التسجيل',
                    body: <Form.Control as="textarea" rows={3} onChange={e => setModalInput(e.target.value)} placeholder="اذكر سبب الرفض النهائي هنا..." required />,
                    submitText: 'تأكيد الرفض'
                };
            case 'rejectReceipt':
                return {
                    title: 'رفض إيصال الدفع',
                    body: <Form.Control as="textarea" rows={3} onChange={e => setModalInput(e.target.value)} placeholder="اذكر سبب رفض الإيصال هنا (مثال: الصورة غير واضحة)..." required />,
                    submitText: 'إرسال سبب الرفض'
                };
            default: return {};
        }
    };

    const modalContent = renderModalContent() || {};

    return (
        <>
            <Container fluid>
                <Card>
                    <Card.Header>
                        <Card.Title as="h4">إدارة طلبات التسجيل</Card.Title>
                        <p className="card-category">مراجعة والموافقة على طلبات التسجيل الجديدة.</p>
                        <Form.Group as={Col} md="4" className="mt-3">
                            <Form.Label>فلترة حسب الحالة</Form.Label>
                            <Form.Select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                                <option value="">عرض الكل</option>
                                {Object.keys(statusMap).map(key => (
                                    <option key={key} value={key}>{statusMap[key].text}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Card.Header>
                    <Card.Body>
                        <Table responsive hover>
                            <thead>
                                <tr>
                                    <th>#</th><th>الاسم الكامل</th><th>البرنامج</th>
                                    <th>تاريخ الطلب</th><th>الحالة</th><th>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" className="text-center"><Spinner /></td></tr>
                                ) : registrations.length > 0 ? (
                                    registrations.map(reg => (
                                        <tr key={reg.registrationId}>
                                            <td>{reg.registrationId}</td>
                                            <td>{reg.fullName} <br /><small className="text-muted">{reg.email}</small></td>
                                            <td>{reg.academicProgramName}</td>
                                            <td>{new Date(reg.requestDate).toLocaleDateString('ar-EG')}</td>
                                            <td><Badge bg={statusMap[reg.status]?.variant || 'secondary'}>{statusMap[reg.status]?.text || reg.status}</Badge></td>
                                            <td>{renderActionButtons(reg)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="6" className="text-center">لا توجد طلبات.</td></tr>
                                )}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            </Container>

            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton><Modal.Title>{modalContent.title}</Modal.Title></Modal.Header>
                <Modal.Body>{modalContent.body}</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal} disabled={submitting}>إلغاء</Button>
                    <Button variant="primary" onClick={handleModalSubmit} disabled={submitting}>
                        {submitting ? <Spinner size="sm" /> : modalContent.submitText}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default RegistrationManagement;