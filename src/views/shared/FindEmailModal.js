import React, { useState } from "react";
import { Modal, Button, Form, Spinner, Alert } from "react-bootstrap";
import { findEmailByNationalId } from "services/public/authService";

function FindEmailModal({ show, onHide }) {
    const [nationalId, setNationalId] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const response = await findEmailByNationalId(nationalId);
            setMessage({ type: 'success', text: `تم العثور على البريد الإلكتروني: ${response.data.email}` });
        } catch (error) {
            setMessage({ type: 'danger', text: error.response?.data?.message || "فشل في العثور على البريد الإلكتروني." });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setNationalId('');
        setMessage({ type: '', text: '' });
        onHide();
    }

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton><Modal.Title>العثور على البريد الإلكتروني</Modal.Title></Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <p>أدخل رقمك الوطني للعثور على البريد الإلكتروني المرتبط بحسابك.</p>
                    <Form.Group>
                        <Form.Label>الرقم الوطني</Form.Label>
                        <Form.Control type="text" value={nationalId} onChange={(e) => setNationalId(e.target.value)} required />
                    </Form.Group>
                    {message.text && <Alert variant={message.type} className="mt-3">{message.text}</Alert>}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>إغلاق</Button>
                    <Button variant="primary" type="submit" disabled={loading}>{loading ? <Spinner size="sm" /> : "بحث"}</Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

export default FindEmailModal;