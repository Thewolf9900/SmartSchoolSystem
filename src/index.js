import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Switch, Redirect } from "react-router-dom";

// --- Styles ---
import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/css/animate.min.css";
import "./assets/scss/smart-school-react.scss?v=2.0.0";
import "./assets/css/demo.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import 'react-toastify/dist/ReactToastify.css';

// --- Layouts ---
import AdminLayout from "layouts/Admin.js";
import AuthLayout from "layouts/Auth.js";
import TeacherLayout from "layouts/Teacher.js";
import StudentLayout from "layouts/Student.js";
import PublicLayout from "layouts/Public.js";  

// --- Components & Contexts ---
import { ToastContainer } from 'react-toastify';
import ProtectedRoute from "components/ProtectedRoute/ProtectedRoute.js";
import { TeacherDataProvider } from "contexts/TeacherDataContext.js";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <>
    <ToastContainer
      position="top-center" autoClose={5000} hideProgressBar={false}
      newestOnTop={false} closeOnClick rtl={true} pauseOnFocusLoss
      draggable pauseOnHover theme="colored"
    />
    <BrowserRouter>
      <Switch>
        {/* --- Public Routes (No Auth Required) --- */}
        <Route path="/auth" render={(props) => <AuthLayout {...props} />} />
        <Route path="/public" render={(props) => <PublicLayout {...props} />} />

        {/* --- Protected Routes (Auth Required) --- */}
        <ProtectedRoute path="/admin" component={AdminLayout} />
        <ProtectedRoute path="/student" component={StudentLayout} />
        <ProtectedRoute path="/teacher" render={(props) => (
          <TeacherDataProvider>
            <TeacherLayout {...props} />
          </TeacherDataProvider>
        )} />

        {/* --- Default Redirect --- */}
        <Redirect from="/" to="/auth/login" />
      </Switch>
    </BrowserRouter>
  </>
);