import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert, ListGroup } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { getAlumniRecords, downloadCertificate } from '../../services/public/alumniService';

function CertificateVerification() {
    const [nationalId, setNationalId] = useState('');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [downloadingId, setDownloadingId] = useState(null);
    const [searchPerformed, setSearchPerformed] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!nationalId) {
            toast.warn("الرجاء إدخال الرقم الوطني.");
            return;
        }
        setLoading(true);
        setRecords([]);
        setSearchPerformed(true);
        try {
            const response = await getAlumniRecords(nationalId);
            setRecords(response.data);
        } catch (error) {
            const errorMessage = error.response?.data?.message || "فشل في البحث عن السجلات.";
            toast.error(errorMessage);
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (graduationId, fileName) => {
        setDownloadingId(graduationId);
        try {
            const response = await downloadCertificate(graduationId);
            const url = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName || `Certificate-${graduationId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success("تم بدء تحميل الشهادة بنجاح.");
        } catch (error) {
            const errorMessage = error.response?.data?.message || "فشل في تحميل الشهادة.";
            toast.error(errorMessage);
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <Container className="my-5" style={{ maxWidth: '800px' }}>
            <Card className="shadow-sm">
                <Card.Header as="h4" className="text-center bg-light">بوابة فحص وتنزيل الشهادات</Card.Header>
                <Card.Body className="p-4">
                    <Form onSubmit={handleSearch}>
                        <Form.Group className="mb-3">
                            <Form.Label>الرقم الوطني</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="أدخل الرقم الوطني"
                                value={nationalId}
                                onChange={(e) => setNationalId(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </Form.Group>
                        <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                            {loading ? <Spinner as="span" size="sm" /> : <><i className="fas fa-search me-1"></i> بحث عن الشهادات</>}
                        </Button>
                    </Form>

                    <hr className="my-4" />

                    {loading && <div className="text-center"><Spinner animation="border" /><p className="mt-2">جاري البحث...</p></div>}

                    {!loading && searchPerformed && records.length === 0 && (
                        <Alert variant="info" className="text-center">
                            لا توجد شهادات مطابقة للرقم الوطني المدخل.
                        </Alert>
                    )}

                    {!loading && records.length > 0 && (
                        <ListGroup className="mt-4">
                            {records.map((record) => (
                                <ListGroup.Item key={record.graduationId} className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>{record.firstName} {record.lastName}</strong><br />
                                        <small className="text-muted">
                                            {record.programNameAtGraduation} - {new Date(record.graduationDate).toLocaleDateString('ar-EG')}
                                            (معدل: {record.finalGpa?.toFixed(2) || 'غير متاح'})
                                        </small>
                                    </div>
                                    {record.hasCertificate ? (
                                        <Button
                                            variant="success"
                                            size="sm"
                                            onClick={() => handleDownload(record.graduationId, `${record.firstName} ${record.lastName} - ${record.programNameAtGraduation} Certificate.pdf`)}
                                            disabled={downloadingId === record.graduationId}
                                        >
                                            {downloadingId === record.graduationId ? <Spinner as="span" size="sm" /> : <><i className="fas fa-download me-1"></i> تنزيل الشهادة</>}
                                        </Button>
                                    ) : (
                                        <Badge bg="secondary">شهادة غير متاحة</Badge>
                                    )}
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
}

export default CertificateVerification;