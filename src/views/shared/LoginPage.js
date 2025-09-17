import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import loginBg from "assets/img/photo-1431578500526-4d9613015464.jpeg";
import { Button, Card, Form, Container, Row, Col, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { login } from "services/public/authService";
import { jwtDecode } from "jwt-decode";

import FindEmailModal from "./FindEmailModal";
import ResetPasswordModal from "./ResetPasswordModal";

function LoginPage() {
    const history = useHistory();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [showFindEmail, setShowFindEmail] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            toast.warn("يرجى إدخال البريد الإلكتروني وكلمة المرور.");
            return;
        }
        setIsLoading(true);
        try {
            const response = await login({ Email: email, Password: password });
            const token = response.data.token;
            localStorage.setItem('token', token);
            const decodedToken = jwtDecode(token);
            const userRole = decodedToken.role;

            let redirectPath = null;
            if (userRole === "Administrator") redirectPath = "/admin/dashboard";
            else if (userRole === "Teacher") redirectPath = "/teacher/dashboard";
            else if (userRole === "Student") redirectPath = "/student/my-classrooms";

            if (!redirectPath) {
                toast.error("الدور المحدد للمستخدم غير معروف.");
                localStorage.removeItem("token");
                setIsLoading(false);
                return;
            }
            toast.success("تم تسجيل الدخول بنجاح! جارٍ التوجيه...");
            setTimeout(() => history.replace(redirectPath), 1500);
        } catch (error) {
            const errorMessage = error.response?.data?.message || "فشل تسجيل الدخول. يرجى التحقق من بياناتك.";
            toast.error(errorMessage);
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="login-page-wrapper" style={{ backgroundImage: `url(${loginBg})` }}>
                <Container>
                    <Row className="justify-content-center">
                        <Col md="8" lg="5" xl="4">
                            <Card className="card-login-glass p-4">
                                <Card.Header className="text-center border-0 bg-transparent pb-0">
                                    <Card.Title as="h2" className="font-weight-bold mb-1">تسجيل الدخول</Card.Title>
                                    <p className="text-muted px-2">مرحباً بك في نظام سمارت سكول</p>
                                </Card.Header>
                                <Card.Body className="pt-2">
                                    <Form onSubmit={handleLogin}>
                                        <Form.Group className="mb-4">
                                            <Form.Label>البريد الإلكتروني</Form.Label>
                                            <Form.Control placeholder="أدخل بريدك الإلكتروني" type="email" size="lg" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
                                        </Form.Group>
                                        <Form.Group className="mb-4">
                                            <Form.Label>كلمة المرور</Form.Label>
                                            <Form.Control placeholder="أدخل كلمة المرور" type="password" size="lg" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                                        </Form.Group>
                                        <Button className="btn-fill w-100 mt-4" type="submit" variant="primary" size="lg" disabled={isLoading}>
                                            {isLoading ? <Spinner as="span" animation="border" size="sm" /> : "تسجيل الدخول"}
                                        </Button>
                                    </Form>
                                </Card.Body>
                                <Card.Footer className="border-top-0 bg-transparent pt-2">
                                    <div className="d-flex flex-column align-items-center">
                                        <a className="text-primary small mb-2" href="#pablo" onClick={(e) => { e.preventDefault(); setShowResetPassword(true); }}>هل نسيت كلمة المرور؟</a>
                                        <a className="text-primary small" href="#pablo" onClick={(e) => { e.preventDefault(); setShowFindEmail(true); }}>هل نسيت البريد الإلكتروني؟</a>
                                    </div>
                                </Card.Footer>
                            </Card>
                        </Col> {/* ✨ تم إصلاح الخطأ هنا: إعادة وسم الإغلاق المفقود ✨ */}
                    </Row>
                </Container>
            </div>

            <FindEmailModal show={showFindEmail} onHide={() => setShowFindEmail(false)} />
            <ResetPasswordModal show={showResetPassword} onHide={() => setShowResetPassword(false)} />
        </>
    );
}

export default LoginPage;