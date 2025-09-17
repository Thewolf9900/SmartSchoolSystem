// src/components/FixedPlugin/FixedPlugin.js

/*eslint-disable*/
import React from "react";
import { Badge, Button, Form } from "react-bootstrap";

import sideBarImage1 from "assets/img/sidebar-1.jpg";
import sideBarImage2 from "assets/img/sidebar-2.jpg";
import sideBarImage3 from "assets/img/sidebar-3.jpg";
import sideBarImage4 from "assets/img/sidebar-4.jpg";

// شرح: استقبال Props جديدة للتحكم في الظهور والإغلاق
function FixedPlugin({
  hasImage,
  setHasImage,
  color,
  setColor,
  image,
  setImage,
  showPanel,
  onClose,
}) {

  // إذا كانت اللوحة غير مرئية، لا تعرض أي شيء
  if (!showPanel) {
    return null;
  }

  return (
    // نستخدم فئة CSS 'show' للتحكم في الظهور
    <div className="fixed-plugin show">
      <div className="dropdown-menu show">
        {/* شرح: إضافة رأس جديد مع زر إغلاق (X) */}
        <li className="header-title d-flex justify-content-between align-items-center px-3 py-2">
          <span>إعدادات الواجهة</span>
          <Button
            variant="link"
            className="p-0 text-muted"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="fas fa-times"></i>
          </Button>
        </li>
        <li className="adjustments-line d-flex align-items-center justify-content-between">
          <p>صورة الخلفية</p>
          <Form.Check
            type="switch"
            id="custom-switch-1-image"
            checked={hasImage}
            onChange={setHasImage}
          />
        </li>
        <li className="adjustments-line mt-3">
          <p>لون الفلتر</p>
          <div className="pull-right">
            <span className={`badge filter badge-black ${color === "black" ? "active" : ""}`} onClick={() => setColor("black")}></span>
            <span className={`badge filter badge-azure ${color === "azure" ? "active" : ""}`} onClick={() => setColor("azure")}></span>
            <span className={`badge filter badge-green ${color === "green" ? "active" : ""}`} onClick={() => setColor("green")}></span>
            <span className={`badge filter badge-orange ${color === "orange" ? "active" : ""}`} onClick={() => setColor("orange")}></span>
            <span className={`badge filter badge-red ${color === "red" ? "active" : ""}`} onClick={() => setColor("red")}></span>
            <span className={`badge filter badge-purple ${color === "purple" ? "active" : ""}`} onClick={() => setColor("purple")}></span></div>
          <div className="clearfix"></div>
        </li>
        <li className="header-title">صور الشريط الجانبي</li>
        <li className={image === sideBarImage1 ? "active" : ""}>
          <a className="img-holder switch-trigger d-block" href="#pablo" onClick={(e) => { e.preventDefault(); setImage(sideBarImage1); }}>
            <img alt="..." src={sideBarImage1}></img>
          </a>
        </li>
        <li className={image === sideBarImage2 ? "active" : ""}>
          <a className="img-holder switch-trigger d-block" href="#pablo" onClick={(e) => { e.preventDefault(); setImage(sideBarImage2); }}>
            <img alt="..." src={sideBarImage2}></img>
          </a>
        </li>
        <li className={image === sideBarImage3 ? "active" : ""}>
          <a className="img-holder switch-trigger d-block" href="#pablo" onClick={(e) => { e.preventDefault(); setImage(sideBarImage3); }}>
            <img alt="..." src={sideBarImage3}></img>
          </a>
        </li>
        <li className={image === sideBarImage4 ? "active" : ""}>
          <a className="img-holder switch-trigger d-block" href="#pablo" onClick={(e) => { e.preventDefault(); setImage(sideBarImage4); }}>
            <img alt="..." src={sideBarImage4}></img>
          </a>
        </li>
      </div>
    </div>
  );
}

export default FixedPlugin;