import React from "react";
import { Route, Switch, Redirect, Link } from "react-router-dom";
import { Navbar, Nav, Container } from "react-bootstrap";
import Footer from "../components/Footer/Footer";
import publicRoutes from "../routes/publicRoutes";

// 1. استيراد ToastContainer و CSS الخاص به
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PublicLayout = () => {
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
                style={{ minHeight: "100vh", direction: "rtl", backgroundColor: "#f8f9fa" }}
            >
                <Navbar bg="white" expand="lg" sticky="top" className="shadow-sm">
                    <Container>
                        <Navbar.Brand as={Link} to="/public/available-programs" style={{ fontWeight: 'bold' }}>
                            نظام Smart School
                        </Navbar.Brand>
                        <Navbar.Toggle aria-controls="public-navbar-nav" />
                        <Navbar.Collapse id="public-navbar-nav">
                            <Nav className="ms-auto">
                                <Nav.Link as={Link} to="/public/available-programs">
                                    البرامج المتاحة
                                </Nav.Link>
                                <Nav.Link as={Link} to="/public/verify-certificate">
                                    فحص الشهادة
                                </Nav.Link>
                            </Nav>
                        </Navbar.Collapse>
                    </Container>
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