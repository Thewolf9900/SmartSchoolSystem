// src/components/Footer/Footer.js

import React from "react";
import { Container } from "react-bootstrap";

function Footer() {
  return (
    <footer className="footer px-0 px-lg-3">
      <Container fluid>
        <nav>
          <p className="copyright text-center">
            © {new Date().getFullYear()}  تم تطوير هذا الموقع كجزء مشروع التحرج الخاص بالطلاب بيهس الخطيب و آية النحاس
          </p>
        </nav>
      </Container>
    </footer>
  );
}

export default Footer;