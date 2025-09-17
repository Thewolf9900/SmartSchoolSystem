import React from "react";
import { useLocation, Route, Switch } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AdminNavbar from "components/Navbars/AdminNavbar.js";
import Footer from "components/Footer/Footer";
import Sidebar from "components/Sidebar/Sidebar.js";
import FixedPlugin from "components/FixedPlugin/FixedPlugin.js";

import teacherRoutes from "routes/teacherRoutes.js";
import sidebarImage from "assets/img/sidebar-4.jpg";

import { TeacherDataProvider } from "contexts/TeacherDataContext";

import "assets/css/custom.css";

function Teacher() {
    const [image, setImage] = React.useState(sidebarImage);
    const [color, setColor] = React.useState("black");
    const [hasImage, setHasImage] = React.useState(true);
    const [showColorSwitcher, setShowColorSwitcher] = React.useState(false);
    const location = useLocation();
    const mainPanel = React.useRef(null);

    // --- العودة إلى الدالة الأصلية والصحيحة ---
    const getRoutes = (routes) => {
        return routes.flatMap((prop, key) => {
            if (prop.layout === "/teacher") {
                if (prop.children) {
                    // Render parent route if it has a component
                    const parentRoute = prop.component ? (
                        <Route
                            path={prop.layout + prop.path}
                            render={(props) => <prop.component {...props} />}
                            key={key}
                            exact
                        />
                    ) : null;

                    // Render child routes
                    const childRoutes = prop.children.map((childProp, childKey) => {
                        const fullPath = prop.layout + prop.path + childProp.path;
                        return (
                            <Route
                                path={fullPath}
                                render={(props) => <childProp.component {...props} />}
                                key={`${key}-${childKey}`}
                            />
                        );
                    });

                    return [parentRoute, ...childRoutes].filter(Boolean);
                } else {
                    return (
                        <Route
                            path={prop.layout + prop.path}
                            render={(props) => <prop.component {...props} />}
                            key={key}
                        />
                    );
                }
            }
            return null;
        }).filter(route => route !== null);
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

    const visibleRoutesForSidebar = teacherRoutes.filter(
        (route) => route.name && route.icon
    );

    return (
        <>
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
            />
            <div className="wrapper">
                <Sidebar color={color} image={hasImage ? image : ""} routes={visibleRoutesForSidebar} />
                <div className="main-panel" ref={mainPanel}>
                    <AdminNavbar routes={teacherRoutes} onColorSwitcherToggle={handleColorSwitcherToggle} />
                    <TeacherDataProvider>
                        <div className="content">
                            <Switch>{getRoutes(teacherRoutes)}</Switch>
                        </div>
                    </TeacherDataProvider>
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

export default Teacher;