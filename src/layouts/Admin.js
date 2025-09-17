import React from "react";
import { useLocation, Route, Switch } from "react-router-dom";

import AdminNavbar from "components/Navbars/AdminNavbar";
import Footer from "components/Footer/Footer";
import Sidebar from "components/Sidebar/Sidebar";
import FixedPlugin from "components/FixedPlugin/FixedPlugin.js";

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- بدأ التعديل ---
// تم تحديث الاستيراد ليقرأ من الملف المركزي للمسارات
import { adminRoutes } from "../routes"; // لم نعد بحاجة لذكر index.js
// --- نهاية التعديل ---

import sidebarImage from "assets/img/sidebar-3.jpg";
import "assets/css/custom.css";


// ... (باقي الكود يبقى كما هو بدون تغيير)
const flattenRoutes = (routes) => {
  let flatRoutes = [];
  routes.forEach(route => {
    if (route.children) {
      flatRoutes = flatRoutes.concat(flattenRoutes(route.children));
    } else if (route.component) {
      flatRoutes.push(route);
    }
  });
  return flatRoutes;
};

function Admin() {
  const [image, setImage] = React.useState(sidebarImage);
  const [color, setColor] = React.useState("black");
  const [hasImage, setHasImage] = React.useState(true);
  const [showColorSwitcher, setShowColorSwitcher] = React.useState(false);
  const location = useLocation();
  const mainPanel = React.useRef(null);
  const getRoutes = (routes) => {
    const allRoutes = flattenRoutes(routes);
    return allRoutes.map((prop, key) => {
      if (prop.layout === "/admin") {
        return (
          <Route
            path={prop.layout + prop.path}
            render={(props) => <prop.component {...props} />}
            key={key}
          />
        );
      } else {
        return null;
      }
    });
  };
  React.useEffect(() => {
    document.documentElement.scrollTop = 0;
    if (document.scrollingElement) {
      document.scrollingElement.scrollTop = 0;
    }
    if (mainPanel.current) {
      mainPanel.current.scrollTop = 0;
    }
    if (
      window.innerWidth < 993 &&
      document.documentElement.className.indexOf("nav-open") !== -1
    ) {
      document.documentElement.classList.toggle("nav-open");
      var element = document.getElementById("bodyClick");
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }
  }, [location]);
  const handleColorSwitcherToggle = () => {
    setShowColorSwitcher(!showColorSwitcher);
  };
  return (
    <>
      <ToastContainer
        position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false}
        closeOnClick rtl={true} pauseOnFocusLoss draggable pauseOnHover
      />
      <div className="wrapper">
        <Sidebar color={color} image={hasImage ? image : ""} routes={adminRoutes} />
        <div className="main-panel" ref={mainPanel}>
           <AdminNavbar routes={adminRoutes} onColorSwitcherToggle={handleColorSwitcherToggle} />

          <div className="content">
            <Switch>{getRoutes(adminRoutes)}</Switch>
          </div>
          <Footer />
        </div>
      </div>
      <FixedPlugin
        hasImage={hasImage}
        setHasImage={() => setHasImage(!hasImage)}
        color={color}
        setColor={(color) => setColor(color)}
        image={image}
        setImage={(image) => setImage(image)}
        showPanel={showColorSwitcher}
        onClose={handleColorSwitcherToggle}
      />
    </>
  );
}
export default Admin;