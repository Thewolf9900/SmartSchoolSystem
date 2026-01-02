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
        const buttonStyle = { width: '35px', height: '35px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };

        switch (reg.status) {
            case 'PendingReview':
                return (
                    <>
                        <Button variant="outline-primary" size="sm" className="mx-1 rounded" onClick={() => handleShowModal('requestPayment', reg)} title="طلب الدفع" style={buttonStyle}>
                            <i className="fas fa-file-invoice-dollar"></i>
                        </Button>
                        <Button variant="outline-danger" size="sm" className="mx-1 rounded" onClick={() => handleShowModal('reject', reg)} title="رفض الطلب" style={buttonStyle}>
                            <i className="fas fa-times-circle"></i>
                        </Button>
                    </>
                );
            case 'PaymentSubmitted':
                return (
                    <>
                        {reg.paymentReceiptUrl && (
                            <Button as="a" href={reg.paymentReceiptUrl} target="_blank" variant="outline-info" size="sm" className="mx-1 rounded" title="عرض الإيصال" style={buttonStyle}>
                                <i className="fas fa-receipt"></i>
                            </Button>
                        )}
                        <Button variant="outline-success" size="sm" className="mx-1 rounded" onClick={() => handleShowModal('approve', reg)} title="موافقة نهائية" style={buttonStyle}>
                            <i className="fas fa-check-circle"></i>
                        </Button>
                        <Button variant="outline-danger" size="sm" className="mx-1 rounded" onClick={() => handleShowModal('rejectReceipt', reg)} title="رفض الإيصال وطلب إيصال جديد" style={buttonStyle}>
                            <i className="fas fa-undo"></i>
                        </Button>
                    </>
                );
            case 'ReceiptRejected':
                return (
                    <Button variant="outline-danger" size="sm" className="mx-1 rounded" onClick={() => handleShowModal('reject', reg)} title="رفض الطلب نهائياً" style={buttonStyle}>
                        <i className="fas fa-times-circle"></i>
                    </Button>
                );
            default:
                return <span className="text-muted small">--</span>;
        }
    };

    const renderMobileCards = () => {
        if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;
        if (registrations.length === 0) return <div className="text-center py-5 text-muted">لا توجد طلبات تسجيل متاحة.</div>;

        return registrations.map((reg) => (
            <Card key={reg.registrationId} className="mb-3 border shadow-sm">
                <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center">
                            <div className="rounded-circle d-flex align-items-center justify-content-center mr-2" style={{ width: '40px', height: '40px', backgroundColor: '#e3f2fd', color: '#007bff' }}>
                                <i className="fas fa-user-graduate"></i>
                            </div>
                            <div>
                                <h6 className="font-weight-bold mb-0 text-dark">{reg.fullName}</h6>
                                <small className="text-muted text-break">{reg.email}</small>
                            </div>
                        </div>
                        <Badge bg={statusMap[reg.status]?.variant || 'secondary'} className="px-2 py-1">
                            {statusMap[reg.status]?.text || reg.status}
                        </Badge>
                    </div>

                    <div className="mb-3">
                        <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                            <span className="text-muted small">البرنامج</span>
                            <span className="font-weight-bold text-dark">{reg.academicProgramName}</span>
                        </div>
                        <div className="d-flex justify-content-between pb-2">
                            <span className="text-muted small">تاريخ الطلب</span>
                            <span className="text-dark">{new Date(reg.requestDate).toLocaleDateString('ar-EG')}</span>
                        </div>
                    </div>

                    <div className="d-flex justify-content-end pt-2 border-top">
                        {renderActionButtons(reg)}
                    </div>
                </Card.Body>
            </Card>
        ));
    };

    const renderModalContent = () => {
        const { type, data } = modalConfig;
        if (!data) return null;

        switch (type) {
            case 'requestPayment':
                const defaultNote = `تمت الموافقة المبدئية. يرجى إرسال المبلغ وقدره ${data.totalPrice?.toLocaleString()} ل.س`;
                return {
                    title: 'إرسال طلب الدفع',
                    body: <Form.Control as="textarea" rows={3} defaultValue={defaultNote} onChange={e => setModalInput(e.target.value)} className="rounded shadow-sm" />,
                    submitText: 'إرسال الطلب'
                };
            case 'approve':
                return {
                    title: 'تأكيد الموافقة النهائية',
                    body: <p>هل أنت متأكد من الموافقة على طلب <strong className="text-success">{data.fullName}</strong>؟ <br />سيتم إنشاء حساب طالب له وإرسال بيانات الدخول.</p>,
                    submitText: 'نعم، موافقة'
                };
            case 'reject':
                return {
                    title: 'رفض طلب التسجيل',
                    body: <Form.Control as="textarea" rows={3} onChange={e => setModalInput(e.target.value)} placeholder="اذكر سبب الرفض النهائي هنا..." required className="rounded shadow-sm" />,
                    submitText: 'تأكيد الرفض'
                };
            case 'rejectReceipt':
                return {
                    title: 'رفض إيصال الدفع',
                    body: <Form.Control as="textarea" rows={3} onChange={e => setModalInput(e.target.value)} placeholder="اذكر سبب رفض الإيصال هنا (مثال: الصورة غير واضحة)..." required className="rounded shadow-sm" />,
                    submitText: 'إرسال سبب الرفض'
                };
            default: return {};
        }
    };

    const modalContent = renderModalContent() || {};

    return (
        <>
            <Container fluid>
                <Row>
                    <Col md="12">
                        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '15px' }}>
                            <Card.Header className="bg-white p-4 border-0" style={{ borderRadius: '15px 15px 0 0' }}>
                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
                                    <div>
                                        <h4 className="font-weight-bold mb-1" style={{ color: '#2c3e50' }}>إدارة طلبات التسجيل</h4>
                                        <p className="text-muted mb-0 small">مراجعة والموافقة على طلبات التسجيل الجديدة</p>
                                    </div>
                                </div>

                                <Row className="bg-light p-3 rounded mx-0 align-items-center">
                                    <Col md={12}>
                                        <Form.Group className="mb-0">
                                            <Form.Label className="small font-weight-bold text-muted">فلترة حسب الحالة</Form.Label>
                                            <Form.Select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="shadow-sm py-2 rounded-pill" style={{ height: 'auto' }}>
                                                <option value="">عرض الكل</option>
                                                {Object.keys(statusMap).map(key => (
                                                    <option key={key} value={key}>{statusMap[key].text}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Header>

                            <Card.Body className="px-0">
                                <div className="d-none d-md-block table-responsive">
                                    <Table className="table-hover mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="border-0 py-3 pl-4 text-muted small font-weight-bold align-middle">#</th>
                                                <th className="border-0 py-3 text-muted small font-weight-bold align-middle">الاسم الكامل / البريد</th>
                                                <th className="border-0 py-3 text-muted small font-weight-bold align-middle">البرنامج</th>
                                                <th className="border-0 py-3 text-muted small font-weight-bold align-middle">تاريخ الطلب</th>
                                                <th className="border-0 py-3 text-muted small font-weight-bold align-middle text-center">الحالة</th>
                                                <th className="border-0 py-3 text-muted small font-weight-bold text-right pr-4 align-middle">الإجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr><td colSpan="6" className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>
                                            ) : registrations.length > 0 ? (
                                                registrations.map(reg => (
                                                    <tr key={reg.registrationId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                        <td className="align-middle pl-4 font-weight-bold text-muted">{reg.registrationId}</td>
                                                        <td className="align-middle">
                                                            <span className="font-weight-bold text-dark d-block">{reg.fullName}</span>
                                                            <small className="text-muted">{reg.email}</small>
                                                        </td>
                                                        <td className="align-middle text-dark">{reg.academicProgramName}</td>
                                                        <td className="align-middle text-muted">{new Date(reg.requestDate).toLocaleDateString('ar-EG')}</td>
                                                        <td className="align-middle text-center">
                                                            <Badge bg={statusMap[reg.status]?.variant || 'secondary'} className="px-3 py-2 font-weight-normal">
                                                                {statusMap[reg.status]?.text || reg.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="text-right pr-4 align-middle">
                                                            {renderActionButtons(reg)}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr><td colSpan="6" className="text-center py-5"><div className="text-muted">لا توجد طلبات تسجيل حالياً.</div></td></tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                                <div className="d-md-none p-3 bg-light">
                                    {renderMobileCards()}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
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