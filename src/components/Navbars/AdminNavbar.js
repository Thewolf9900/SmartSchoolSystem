import React, { useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { Navbar, Container, Button, Nav } from "react-bootstrap";
import { toast } from 'react-toastify';
import ChatModal from "components/Chatbot/ChatModal";
const flattenRoutes = (routes) => {
  let flatRoutes = [];
  if (routes) {
    routes.forEach(route => {
      if (route.children) {
        flatRoutes = flatRoutes.concat(flattenRoutes(route.children));
      } else if (route.component) {
        flatRoutes.push(route);
      }
    });
  }
  return flatRoutes;
};

function AdminNavbar({ routes, brandText, onColorSwitcherToggle }) {
  const location = useLocation();
  const history = useHistory();

  const [showChatModal, setShowChatModal] = useState(false);
  const handleShowChatModal = () => setShowChatModal(true);
  const handleCloseChatModal = () => setShowChatModal(false);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    toast.info("تم تسجيل الخروج بنجاح.");
    history.push("/auth/login");
  };

  const mobileSidebarToggle = (e) => {
    e.preventDefault();
    document.documentElement.classList.toggle("nav-open");
    const node = document.createElement("div");
    node.id = "bodyClick";
    node.onclick = function () {
      if (this.parentElement) {
        this.parentElement.removeChild(this);
      }
      document.documentElement.classList.toggle("nav-open");
    };
    document.body.appendChild(node);
  };

  const getBrandText = () => {
    const allRoutes = flattenRoutes(routes);
    for (let i = 0; i < allRoutes.length; i++) {
      if (location.pathname.indexOf(allRoutes[i].layout + allRoutes[i].path) !== -1) {
        return allRoutes[i].name;
      }
    }
    return "Brand";
  };

  return (
    <>
      <Navbar bg="light" expand="lg">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center w-100">
            {/* Left side: Toggle button (mobile) and Brand */}
            <div className="d-flex align-items-center">
              <Button
                variant="dark"
                className="d-lg-none btn-fill d-flex justify-content-center align-items-center rounded-circle p-2 me-2"
                onClick={mobileSidebarToggle}
              >
                <i className="fas fa-ellipsis-v"></i>
              </Button>
              <Navbar.Brand
                href="#home"
                onClick={(e) => e.preventDefault()}
                className="mr-2"
                style={{ color: 'black', fontSize: '1.2rem', fontWeight: 'bold' }}
              >
                {brandText || getBrandText()}
              </Navbar.Brand>
            </div>

            {/* Right side: Icons and Logout */}
            <div className="d-flex align-items-center gap-2">
              <Nav className="align-items-center flex-row">
                <Nav.Item>
                  <Button
                    variant="link"
                    onClick={(e) => { e.preventDefault(); if (onColorSwitcherToggle) onColorSwitcherToggle(); }}
                    title="تغيير الألوان"
                    className="btn-outline-secondary rounded-circle p-0 d-flex align-items-center justify-content-center mx-1"
                    style={{ width: '35px', height: '35px', border: '1px solid #dee2e6', color: '#6c757d' }}
                  >
                    <i className="nc-icon nc-palette"></i>
                  </Button>
                </Nav.Item>
                <Nav.Item>
                  <Button
                    variant="link"
                    onClick={handleShowChatModal}
                    title="المساعد الذكي"
                    className="btn-outline-info rounded-circle p-0 d-flex align-items-center justify-content-center mx-1"
                    style={{ width: '35px', height: '35px', border: '1px solid #17a2b8' }}
                  >
                    <i className="fas fa-robot"></i>
                  </Button>
                </Nav.Item>
              </Nav>

              <span className="d-none d-md-block mx-2" style={{ width: '1px', height: '25px', backgroundColor: '#ddd' }}></span>

              <Button
                onClick={handleLogout}
                variant="danger"
                size="sm"
                className="btn-fill d-flex align-items-center"
                style={{ borderRadius: '8px', fontSize: "14px", padding: "8px 15px" }}
              >
                <i className="nc-icon nc-button-power me-2 ms-0 pl-2"></i>
                <span className="d-none d-md-inline">تسجيل الخروج</span>
                <span className="d-md-none">خروج</span>
              </Button>
            </div>
          </div>
        </Container>
      </Navbar>

      <ChatModal show={showChatModal} onHide={handleCloseChatModal} />
    </>
  );
}

export default AdminNavbar;