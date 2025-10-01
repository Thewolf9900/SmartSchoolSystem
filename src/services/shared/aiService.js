import apiClient from "../apiConfig";

/**
 * ====================================================================
 * AI Service for Question Generation
 * ====================================================================
 */

/**
 * يرسل طلبًا لتوليد أسئلة بناءً على محتوى نصي.
 * @param {number} courseId - معرّف الدورة.
 * @param {object} data - كائن يحتوي على النص والإعدادات.
 * @param {string} language - لغة المخرجات المطلوبة (e.g., "Arabic", "English").
 * @returns {Promise} - وعد Axios.
 */
export const generateQuestionsFromText = (courseId, data, language) => {
    // يتم تمرير اللغة كـ query parameter في الرابط
    return apiClient.post(`/api/teacher/ai/course/${courseId}/generate-from-text?language=${language}`, data);
};

/**
 * يرسل طلبًا لتوليد أسئلة بناءً على محتوى ملف (PDF).
 * @param {number} courseId - معرّف الدورة.
 * @param {FormData} formData - كائن FormData يجب أن يحتوي على الملف والإعدادات.
 * @param {string} language - لغة المخرجات المطلوبة.
 * @returns {Promise} - وعد Axios.
 */
export const generateQuestionsFromFile = (courseId, formData, language) => {
    // يتم تمرير اللغة كـ query parameter في الرابط
    return apiClient.post(`/api/teacher/ai/course/${courseId}/generate-from-file?language=${language}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};