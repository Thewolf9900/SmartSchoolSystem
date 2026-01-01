// src/routes/authRoutes.js
// هذا الملف يحتوي فقط على المسارات العامة التي لا تتطلب تسجيل دخول

// تم تحديث المسار ليشير إلى موقع LoginPage.js الصحيح
import LoginPage from "../views/shared/LoginPage.js";

const authRoutes = [
    {
        path: "/login",
        name: "Login",
        component: LoginPage,
        layout: "/auth",
    },
    // يمكن إضافة مسارات "تسجيل مستخدم جديد" أو "نسيت كلمة المرور" هنا مستقبلاً
];

export default authRoutes;