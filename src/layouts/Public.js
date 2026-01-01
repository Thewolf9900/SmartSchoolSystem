import React from "react";
import { Route, Switch, Redirect, Link } from "react-router-dom";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import Footer from "../components/Footer/Footer";
import publicRoutes from "../routes/publicRoutes";

// 1. استيراد ToastContainer و CSS الخاص به
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PublicLayout = () => {
    // State to manage navbar collapse
    const [expanded, setExpanded] = React.useState(false);

    const getRoutes = (routes) => {
        return routes.map((prop, key) => {
            if (prop.layout === "/public") {
                return (
                    <Route
                        path={prop.layout + prop.path}
                        component={prop.component}
                        key={key}
                    />
                );
            }
            return null;
        });
    };

    return (
        <>
            {/* 2. إضافة ToastContainer هنا */}
            <ToastContainer
                position="top-center"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={true}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
            />

            <div
                className="d-flex flex-column"
                style={{ minHeight: "100vh", direction: "rtl", backgroundColor: "#f8f9fa", paddingTop: "90px" }}
            >
                <Navbar
                    expand="lg"
                    fixed="top"
                    className="shadow-sm py-3"
                    expanded={expanded}
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        borderBottom: '1px solid rgba(0,0,0,0.05)'
                    }}
                >
                    <Container>
                        <Navbar.Brand as={Link} to="/public/available-programs" onClick={() => setExpanded(false)} className="d-flex align-items-center" style={{ fontWeight: '800', fontSize: '1.5rem', color: '#6366f1' }}>
                            <i className="nc-icon nc-hat-3 ml-2" style={{ fontSize: '1.8rem', marginLeft: '10px' }}></i>
                            نظام Smart School
                        </Navbar.Brand>
                        <Navbar.Toggle
                            aria-controls="public-navbar-nav"
                            className="border-0"
                            onClick={() => setExpanded(expanded ? false : "expanded")}
                        >
                            <i className={`fas ${expanded ? 'fa-times' : 'fa-bars'} text-dark`} style={{ fontSize: '1.5rem', transition: 'all 0.3s' }}></i>
                        </Navbar.Toggle>
                        <Navbar.Collapse id="public-navbar-nav">
                            <Nav className="px-3 d-flex align-items-center" navbarScroll>
                                <Nav.Link as={Link} to="/public/available-programs" onClick={() => setExpanded(false)} className="px-3 font-weight-bold nav-link-custom" style={{ color: '#4b5563', fontSize: '1rem', transition: 'all 0.3s' }}>
                                    البرامج المتاحة
                                </Nav.Link>
                                <Nav.Link as={Link} to="/public/verify-certificate" onClick={() => setExpanded(false)} className="px-3 font-weight-bold nav-link-custom" style={{ color: '#4b5563', fontSize: '1rem', transition: 'all 0.3s' }}>
                                    فحص الشهادة
                                </Nav.Link>
                            </Nav>

                            <Nav className="mr-auto d-flex align-items-center">
                                <Nav.Item>
                                    <Link to="/auth/login" onClick={() => setExpanded(false)}>
                                        <Button
                                            variant="outline-primary"
                                            className="btn-round font-weight-bold px-4 login-btn-custom"
                                            style={{ borderWidth: '2px' }}
                                        >
                                            تسجيل الدخول
                                        </Button>
                                    </Link>
                                </Nav.Item>
                            </Nav>
                        </Navbar.Collapse>
                    </Container>
                    <style>
                        {`
                            .nav-link-custom:hover {
                                color: #6366f1 !important;
                                transform: translateY(-2px);
                            }
                            .login-btn-custom:hover {
                                background-color: #6366f1 !important;
                                color: white !important;
                                border-color: #6366f1 !important;
                            }
                        `}
                    </style>
                </Navbar>

                <main className="flex-grow-1">
                    <Switch>
                        {getRoutes(publicRoutes)}
                        <Redirect from="/public" to="/public/available-programs" />
                    </Switch>
                </main>

                <Footer />
            </div>
        </>
    );
};

export default PublicLayout;