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
    var node = document.createElement("div");
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
      <Navbar bg="light" expand="lg"  >
        <Container fluid >
          <div className="d-flex justify-content-center align-items-center">
            <Button
              variant="dark"
              className="d-lg-none btn-fill d-flex justify-content-center align-items-center rounded-circle p-2"
              onClick={mobileSidebarToggle}
            >
              <i className="fas fa-ellipsis-v"></i>
            </Button>
            <Navbar.Brand style={{ color: 'black' }}
              href="#home"
              onClick={(e) => e.preventDefault()}
              className="mr-2 "
            >
              {brandText || getBrandText()}
            </Navbar.Brand>
          </div>
          <div className="d-flex align-items-center">
            <Nav className="align-items-center ">
              <Nav.Item>
                <Button
                  variant="link"
                  onClick={(e) => { e.preventDefault(); if (onColorSwitcherToggle) onColorSwitcherToggle(); }}
                  title="تغيير الألوان"
                  className="btn-outline-secondary rounded-circle p-2 d-flex align-items-center justify-content-center"
                  style={{ width: '30px', height: '30px', border: '1px solid', color: '#6c757d'  }}
                >
                  <i className="nc-icon nc-palette m-1"></i>
                </Button>
              </Nav.Item>
              <Nav.Item className="ms-2">
                <Button
                  variant="link"
                  onClick={handleShowChatModal}
                  title="المساعد الذكي"
                  className="btn-outline-info rounded-circle p-2 d-flex align-items-center justify-content-center"
                  style={{ width: '40px', height: '40px', border: '1px solid' }}
                >
                  <i className="fas fa-robot"></i>
                </Button>
              </Nav.Item>
            </Nav>
            <span className="navbar-divider mx-3" style={{ width: '1px', height: '25px', backgroundColor: '#ddd' }}></span>
            <Button
              onClick={handleLogout}
              variant="danger"
              style={{ borderRadius: `10px`, fontSize: "15px", textTransform: `capitalize` }}>
              تسجيل الخروج
            </Button>
          </div>
        </Container>
      </Navbar>

      {/* ✨ 3. عرض المكون الجديد وتمرير الخصائص اللازمة له */}
      <ChatModal show={showChatModal} onHide={handleCloseChatModal} />
    </>
  );
}

export default AdminNavbar;