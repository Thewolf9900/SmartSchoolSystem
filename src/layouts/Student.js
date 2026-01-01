import React from "react";
import { useLocation, Route, Switch } from "react-router-dom";

 import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

 import AdminNavbar from "components/Navbars/AdminNavbar";
import Footer from "components/Footer/Footer";
import Sidebar from "components/Sidebar/Sidebar";
import FixedPlugin from "components/FixedPlugin/FixedPlugin.js";

import { studentRoutes } from "routes";

import sidebarImage from "assets/img/sidebar-3.jpg";

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

function Student() {
    const [image, setImage] = React.useState(sidebarImage);
    const [color, setColor] = React.useState("black");
    const [hasImage, setHasImage] = React.useState(true);
    const [showColorSwitcher, setShowColorSwitcher] = React.useState(false);
    const location = useLocation();
    const mainPanel = React.useRef(null);

    const getRoutes = (routes) => {
        const allRoutes = flattenRoutes(routes);
        return allRoutes.map((prop, key) => {
            if (prop.layout === "/student") {
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
    }, [location]);

    const handleColorSwitcherToggle = () => {
        setShowColorSwitcher(!showColorSwitcher);
    };

    return (
        <>
            <div className="wrapper">
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

                <Sidebar
                    color={color}
                    image={hasImage ? image : ""}
                    routes={studentRoutes.filter(route => route.name && route.icon)}
                />
                <div className="main-panel" ref={mainPanel}>
                    <AdminNavbar
                        routes={studentRoutes}
                        onColorSwitcherToggle={handleColorSwitcherToggle}
                        brandText="واجهة الطالب"
                    />

                    <div className="content">
                        <Switch>{getRoutes(studentRoutes)}</Switch>
                    </div>
                    <Footer fluid />
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

export default Student;