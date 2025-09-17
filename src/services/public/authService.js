import apiClient from "../apiConfig";

// =================================================================
//                        Authentication
// =================================================================

/**
 * @description يقوم بإرسال بيانات تسجيل الدخول (الإيميل وكلمة المرور) للحصول على توكن المصادقة.
 * @param {object} credentials - يحتوي على Email و Password.
 * @endpoint POST /api/auth/login
 */
export const login = (credentials) => {
    // تم تصحيح المسار ليكون عامًا لجميع الأدوار
    return apiClient.post('/api/auth/login', credentials);
};

// =================================================================
//                        User Profile
// =================================================================

/**
 * @description يجلب بيانات الملف الشخصي للمستخدم المسجل دخوله حاليًا.
 * @endpoint GET /api/my-profile
 */
export const getMyProfile = () => {
    // تم تصحيح حالة الأحرف في المسار
    return apiClient.get('/api/My-profile');
};

/**
 * @description يقوم بتغيير كلمة المرور للمستخدم الحالي.
 * @param {object} passwordData - يحتوي على OldPassword و NewPassword.
 * @endpoint PUT /api/my-profile/change-password
 */
export const changeMyPassword = (passwordData) => {
    return apiClient.put('/api/my-profile/change-password', passwordData);
};

// =================================================================
//                        Account Recovery
// =================================================================

/**
 * @description يبحث عن البريد الإلكتروني للمستخدم باستخدام الرقم الوطني ويعيده بشكل مخفي.
 * @param {string} nationalId - الرقم الوطني للمستخدم.
 * @endpoint GET /api/account-recovery/find-email
 */
export const findEmailByNationalId = (nationalId) => {
    return apiClient.get(`/api/account-recovery/find-email`, {
        params: { nationalId }
    });
};

/**
 * @description يطلب إرسال رمز إعادة تعيين كلمة المرور إلى بريد المستخدم.
 * @param {object} data - يحتوي على Email و NationalId.
 * @endpoint POST /api/account-recovery/request-reset
 */
export const requestPasswordReset = (data) => {
    return apiClient.post('/api/account-recovery/request-reset', data);
};

/**
 * @description يؤكد عملية إعادة التعيين باستخدام الرمز وكلمة المرور الجديدة.
 * @param {object} data - يحتوي على Email, ResetCode, NewPassword.
 * @endpoint POST /api/account-recovery/confirm-reset
 */
export const confirmPasswordReset = (data) => {
    return apiClient.post('/api/account-recovery/confirm-reset', data);
};