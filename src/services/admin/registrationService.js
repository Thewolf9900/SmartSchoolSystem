import apiClient from "../apiConfig";

const BASE_URL = "/api/admin/registrations";

/**
 * جلب قائمة بجميع طلبات التسجيل، مع إمكانية الفلترة حسب الحالة.
 * @param {string} [status] - (اختياري) حالة الطلب للفلترة.
 */
export const getRegistrations = (status) => {
    const config = {};
    if (status) {
        config.params = { status };
    }
    return apiClient.get(BASE_URL, config);
};

/**
 * الموافقة المبدئية على الطلب وتغيير حالته إلى "بانتظار الدفع".
 * @param {number} registrationId - معرف الطلب.
 * @param {string} [notes] - (اختياري) ملاحظات للمتقدم.
 */
export const requestPayment = (registrationId, notes) => {
    return apiClient.post(`${BASE_URL}/${registrationId}/request-payment`, `"${notes}"`, {
        headers: { 'Content-Type': 'application/json' }
    });
};

/**
 * الموافقة النهائية على الطلب وإنشاء حساب للطالب.
 * @param {number} registrationId - معرف الطلب.
 */
export const approveRegistration = (registrationId) => {
    return apiClient.post(`${BASE_URL}/${registrationId}/approve`);
};

/**
 * رفض طلب تسجيل.
 * @param {number} registrationId - معرف الطلب.
 * @param {string} reason - (مطلوب) سبب الرفض.
 */
export const rejectRegistration = (registrationId, reason) => {
    return apiClient.post(`${BASE_URL}/${registrationId}/reject`, `"${reason}"`, {
        headers: { 'Content-Type': 'application/json' }
    });
};

/**
 * طلب إيصال جديد من المتقدم بسبب رفض الإيصال الحالي.
 * @param {number} registrationId - معرف الطلب.
 * @param {string} reason - (مطلوب) سبب رفض الإيصال.
 */
export const requestNewReceipt = (registrationId, reason) => {
    return apiClient.post(`${BASE_URL}/${registrationId}/request-new-receipt`, `"${reason}"`, {
        headers: { 'Content-Type': 'application/json' }
    });
};