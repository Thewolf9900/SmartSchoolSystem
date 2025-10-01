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
            <div className="login-page-wrapper" style={{ backgroundImage: `url(${loginBg})` }}>
                <Container>
                    <Row className="justify-content-center">
                        <Col md="8" lg="5" xl="4">
                            <Card className="card-login-glass p-4">
                                <Card.Header className="text-center border-0 bg-transparent pb-0">
                                    <Card.Title as="h2" className="font-weight-bold mb-1">تسجيل الدخول / متابعة الطلب</Card.Title>
                                    <p className="card-category text-muted px-2">مرحباً بك في نظام سمارت سكول</p> {/* تم إعادة إضافة النص المفقود */}
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
                                            {isLoading ? <Spinner as="span" animation="border" size="sm" /> : "متابعة"}
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
                            <div className="text-center mt-3">
                                {/* زر فحص الشهادة الجديد */}
                                <Link to="/public/verify-certificate" className="btn btn-info btn-block mt-2"> {/* تم تغيير الكلاسات لتحسين المظهر */}
                                    <i className="fas fa-certificate me-1"></i> فحص الشهادة
                                </Link>
                                {/* رابط إنشاء حساب جديد */}
                                <p style={{ color: "white" }} className="mt-3">
                                    لا تملك حساباً؟{" "}
                                    <Link to="/public/available-programs" style={{ color: "#1DC7EA", fontWeight: "bold" }}>
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