import React from "react";
import ReactDOM from "react-dom/client";

import { BrowserRouter, Route, Switch, Redirect } from "react-router-dom";

// استيراد التنسيقات العامة
import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/css/animate.min.css";
import "./assets/scss/smart-school-react.scss?v=2.0.0";
import "./assets/css/demo.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// استيراد الأغلفة (Layouts) المختلفة
import AdminLayout from "layouts/Admin.js";
import AuthLayout from "layouts/Auth.js";
import TeacherLayout from "layouts/Teacher.js";
import StudentLayout from "layouts/Student.js";

// استيراد مكون الحماية
import ProtectedRoute from "components/ProtectedRoute/ProtectedRoute.js";
import { TeacherDataProvider } from "contexts/TeacherDataContext.js";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
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
      theme="colored"
    />
    <BrowserRouter>
      <Switch>
        {/* المسارات العامة (تسجيل الدخول) */}
        <Route path="/auth" render={(props) => <AuthLayout {...props} />} />

        {/* المسارات المحمية */}
        <ProtectedRoute path="/admin" component={AdminLayout} />
        <ProtectedRoute path="/teacher" render={(props) => (
          <TeacherDataProvider>
            <TeacherLayout {...props} />
          </TeacherDataProvider>
        )} />

        {/* ✨ 2. إضافة المسار المحمي الخاص بالطالب */}
        <ProtectedRoute path="/student" component={StudentLayout} />

        {/* إعادة التوجيه الافتراضية */}
        <Redirect from="/" to="/auth/login" />
      </Switch>
    </BrowserRouter>
  </>
);