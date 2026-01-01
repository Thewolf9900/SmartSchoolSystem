import React, { useState } from "react";
import { useHistory, Link } from "react-router-dom";
import loginBg from "assets/img/photo-1431578500526-4d9613015464.jpeg";
import { Button, Card, Form, Container, Row, Col, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { login } from "services/shared/authService"; // تم تصحيح المسار ليتناسب مع موقع authService في shared/
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
            const data = response.data;

            if (data.userType === "Applicant") {
                toast.info("تم التحقق من حسابك بنجاح. جارٍ عرض حالة طلبك...");

                history.push({
                    pathname: '/public/applicant-status',
                    state: {
                        registrationId: data.registrationId,
                        fullName: data.fullName,
                        applicantStatus: data.applicantStatus
                    }
                });

            } else if (data.token) {
                const token = data.token;
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
                } else {
                    toast.success("تم تسجيل الدخول بنجاح! جارٍ التوجيه...");
                    setTimeout(() => history.replace(redirectPath), 1000);
                }
            } else {
                toast.error("استجابة غير متوقعة من الخادم.");
            }

        } catch (error) {
            const errorMessage = error.response?.data?.message || "فشل تسجيل الدخول. يرجى التحقق من بياناتك.";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="login-page-wrapper"
                style={{
                    backgroundImage: `url(${loginBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    minHeight: '100vh',
                    position: 'relative'
                }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)', // Dark overlay for better text contrast
                    zIndex: 1
                }}></div>
                <Container className="position-relative" style={{ zIndex: 2, paddingTop: '8vh' }}>
                    <Row className="justify-content-center">
                        <Col md="8" lg="5" xl="4">
                            <Card className="card-login-glass border-0"
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    backdropFilter: 'blur(20px)',
                                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                                    borderRadius: '20px',
                                    border: '1px solid rgba(255, 255, 255, 0.18)'
                                }}>
                                <Card.Header className="text-center border-0 bg-transparent pt-4 pb-2">
                                    <h2 className="font-weight-bold mb-2 text-white" style={{ fontSize: '1.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                                        تسجيل الدخول
                                    </h2>
                                    <p className="text-light opacity-75 px-2 mb-0" style={{ fontSize: '0.95rem' }}>مرحباً بك في نظام سمارت سكول</p>
                                </Card.Header>
                                <Card.Body className="px-4 py-3">
                                    <Form onSubmit={handleLogin}>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="text-white font-weight-bold small">البريد الإلكتروني</Form.Label>
                                            <Form.Control
                                                placeholder="example@email.com"
                                                type="email"
                                                size="lg"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                disabled={isLoading}
                                                style={{
                                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                    border: 'none',
                                                    borderRadius: '12px',
                                                    height: '50px',
                                                    fontSize: '1rem',
                                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
                                                }}
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="text-white font-weight-bold small">كلمة المرور</Form.Label>
                                            <Form.Control
                                                placeholder="••••••••"
                                                type="password"
                                                size="lg"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                disabled={isLoading}
                                                style={{
                                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                    border: 'none',
                                                    borderRadius: '12px',
                                                    height: '50px',
                                                    fontSize: '1rem',
                                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
                                                }}
                                            />
                                        </Form.Group>
                                        <Button
                                            className="w-100 mt-3 mb-3 font-weight-bold shadow-lg"
                                            type="submit"
                                            disabled={isLoading}
                                            style={{
                                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                                border: 'none',
                                                borderRadius: '12px',
                                                height: '50px',
                                                fontSize: '1.1rem',
                                                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            {isLoading ? <Spinner as="span" animation="border" size="sm" /> : "متابعة"}
                                        </Button>
                                    </Form>
                                </Card.Body>
                                <Card.Footer className="border-0 bg-transparent text-center pb-4">
                                    <div className="d-flex flex-column align-items-center gap-2">
                                        <a className="text-white text-decoration-none small mb-2 hover-opacity"
                                            href="#pablo"
                                            onClick={(e) => { e.preventDefault(); setShowResetPassword(true); }}
                                            style={{ opacity: 0.9, transition: 'opacity 0.2s' }}>
                                            هل نسيت كلمة المرور؟
                                        </a>
                                        <a className="text-white text-decoration-none small hover-opacity"
                                            href="#pablo"
                                            onClick={(e) => { e.preventDefault(); setShowFindEmail(true); }}
                                            style={{ opacity: 0.9, transition: 'opacity 0.2s' }}>
                                            هل نسيت البريد الإلكتروني؟
                                        </a>
                                    </div>
                                </Card.Footer>
                            </Card>

                            <div className="text-center mt-4 position-relative" style={{ zIndex: 10 }}>
                                <Link to="/public/verify-certificate"
                                    className="d-inline-flex align-items-center justify-content-center px-4 py-2 mb-3 text-white text-decoration-none"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: '50px',
                                        transition: 'all 0.3s ease'
                                    }}>
                                    <i className="fas fa-certificate me-2 ms-2"></i>
                                    <span style={{ fontWeight: 500 }}>فحص الشهادة</span>
                                </Link>

                                <p className="text-white mt-2 mb-0" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                                    لا تملك حساباً؟{" "}
                                    <Link to="/public/available-programs"
                                        className="text-white font-weight-bold ml-1"
                                        style={{ textDecoration: 'underline', textUnderlineOffset: '4px' }}>
                                        أنشئ حساباً جديداً
                                    </Link>
                                </p>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
            <FindEmailModal show={showFindEmail} onHide={() => setShowFindEmail(false)} />
            <ResetPasswordModal show={showResetPassword} onHide={() => setShowResetPassword(false)} />
        </>
    );
}

export default LoginPage;