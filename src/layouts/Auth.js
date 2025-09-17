import React from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- بدأ التعديل ---
// تم تحديث الاستيراد ليقرأ من الملف المركزي للمسارات
import { authRoutes } from "../routes"; // لم نعد بحاجة لذكر index.js أو اسم الملف المحدد
// --- نهاية التعديل ---

function Auth() {
    const getRoutes = (routes) => {
        return routes.map((prop, key) => {
            if (prop.layout === "/auth") {
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

    return (
        <>
            <div className="wrapper wrapper-full-page">
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
                <Switch>
                    {getRoutes(authRoutes)}
                    <Redirect from="/auth" to="/auth/login" />
                </Switch>
            </div>
        </>
    );
}

export default Auth;