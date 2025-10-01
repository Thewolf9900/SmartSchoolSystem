import React, { useState, useEffect } from 'react';
import { useLocation, useHistory, Link } from 'react-router-dom';
import { Container, Card, Button, Spinner, Alert, ListGroup, Form, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { uploadReceipt } from '../../services/public/publicService';

 

const ApplicantStatus = () => {
    const location = useLocation();
    const history = useHistory();

    const [details, setDetails] = useState(location.state || null);
    const [loading, setLoading] = useState(!details);  

    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (!details || !details.registrationId) {
            toast.error("لا يمكن الوصول لهذه الصفحة مباشرة.");
            history.replace('/auth/login');
        }
        setLoading(false);
    }, [details, history]);

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.warn("يرجى اختيار ملف إيصال الدفع أولاً.");
            return;
        }
        setUploading(true);
        try {
            const response = await uploadReceipt(details.registrationId, selectedFile);
            toast.success(response.data.message || "تم رفع الإيصال بنجاح!");
            setDetails(prev => ({ ...prev, applicantStatus: 'PaymentSubmitted' }));
            setSelectedFile(null);  
        } catch (error) {
            toast.error(error.response?.data?.message || "فشل في رفع الإيصال.");
        } finally {
            setUploading(false);
        }
    };

    const renderReceiptUploadForm = (title, label) => (
        <Card className="mt-4">
            <Card.Body>
                <Card.Title>{title}</Card.Title>
                <Form.Group controlId="formFile" className="mb-3">
                    <Form.Label>{label}</Form.Label>
                    <Form.Control type="file" onChange={handleFileChange} accept=".jpg,.jpeg,.png" />
                </Form.Group>
                <Button variant="primary" onClick={handleUpload} disabled={uploading || !selectedFile}>
                    {uploading ? <Spinner size="sm" /> : "رفع وتأكيد"}
                </Button>
            </Card.Body>
        </Card>
    );

    const renderStatusContent = () => {
        if (!details) return null;

        const { applicantStatus, fullName, adminNotes, paymentDetails } = details;

        switch (applicantStatus) {
            case 'PendingReview':
                return (
                    <Alert variant="info">
                        <Alert.Heading>طلبك قيد المراجعة</Alert.Heading>
                        <p>مرحباً <strong>{fullName}</strong>، لقد استلمنا طلبك وهو الآن قيد المراجعة. سيتم إعلامك بالتحديثات قريباً.</p>
                    </Alert>
                );
            case 'AwaitingPayment':
                return (
                    <>
                        <Alert variant="warning">
                            <Alert.Heading>الخطوة التالية: إتمام الدفع</Alert.Heading>
                            <p>تمت الموافقة المبدئية على طلبك. يرجى إرسال المبلغ المطلوب ورفع صورة عن إيصال الدفع.</p>
                            {adminNotes && <><hr /><p className="mb-0"><strong>ملاحظات الإدارة:</strong> {adminNotes}</p></>}
                        </Alert>
                        {paymentDetails && (
                            <Card className="mt-4">
                                <Card.Header><strong>معلومات الدفع</strong></Card.Header>
                                <ListGroup variant="flush">
                                    <ListGroup.Item><strong>اسم المستلم:</strong> {paymentDetails.adminFullName}</ListGroup.Item>
                                    <ListGroup.Item><strong>رقم الهاتف:</strong> {paymentDetails.phoneNumber}</ListGroup.Item>
                                    <ListGroup.Item><strong>العنوان/معلومات إضافية:</strong> {paymentDetails.address}</ListGroup.Item>
                                </ListGroup>
                            </Card>
                        )}
                        {renderReceiptUploadForm("رفع إيصال الدفع", "اختر صورة الإيصال (JPG, PNG)")}
                    </>
                );
            case 'PaymentSubmitted':
                return (
                    <Alert variant="info">
                        <Alert.Heading>تم استلام إيصال الدفع</Alert.Heading>
                        <p>شكراً لك <strong>{fullName}</strong>، سيتم تدقيق إيصال الدفع من قبل الإدارة في أقرب وقت.</p>
                    </Alert>
                );
            case 'ReceiptRejected':
                return (
                    <>
                        <Alert variant="danger">
                            <Alert.Heading>تم رفض الإيصال</Alert.Heading>
                            <p>للأسف، تم رفض الإيصال الذي قمت برفعه. يرجى مراجعة ملاحظات الإدارة وإعادة رفع إيصال صحيح.</p>
                            {adminNotes && <><hr /><p className="mb-0"><strong>سبب الرفض:</strong> {adminNotes}</p></>}
                        </Alert>
                        {renderReceiptUploadForm("إعادة رفع إيصال الدفع", "اختر صورة الإيصال الجديد")}
                    </>
                );
            case 'Approved':
                return (
                    <Alert variant="success">
                        <Alert.Heading>تهانينا! تم قبولك</Alert.Heading>
                        <p>مرحباً بك <strong>{fullName}</strong> في نظام سمارت سكول! يمكنك الآن تسجيل الدخول كطالب للوصول إلى حسابك.</p>
                    </Alert>
                );
            case 'Rejected':
                return (
                    <Alert variant="danger">
                        <Alert.Heading>نعتذر، تم رفض طلبك</Alert.Heading>
                        <p>نأسف لإعلامك بأنه تم رفض طلب التسجيل الخاص بك.</p>
                        {adminNotes && <><hr /><p className="mb-0"><strong>سبب الرفض:</strong> {adminNotes}</p></>}
                        <div className="mt-3">
                            <Link to="/public/available-programs" className="btn btn-primary">تقديم طلب جديد</Link>
                        </div>
                    </Alert>
                );
            default:
                return <Alert variant="secondary">حالة طلبك غير معروفة.</Alert>;
        }
    };

    if (loading) {
        return <Container className="d-flex justify-content-center mt-5"><Spinner animation="border" /></Container>;
    }

    return (
        <Container className="my-5" style={{ maxWidth: '800px' }}>
            <Card className="shadow-sm">
                <Card.Header as="h4" className="text-center bg-light">متابعة حالة طلب التسجيل</Card.Header>
                <Card.Body className="p-4">
                    {renderStatusContent()}
                    <div className="text-center mt-4">
                        <Button variant="secondary" onClick={() => history.push('/auth/login')}>تسجيل الخروج</Button>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ApplicantStatus;