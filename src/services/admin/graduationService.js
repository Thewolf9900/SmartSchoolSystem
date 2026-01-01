// src/services/admin/graduationService.js

import apiClient from "../apiConfig";

const BASE_URL = "/api/admin/graduation";

/**
 * تشغيل عملية تخريج/رسوب للطلاب المستحقين في برنامج معين.
 * POST /api/admin/graduation/process/program/{programId}
 * @param {number} programId - معرف البرنامج.
 */
export const processProgramGraduations = (programId) => {
    return apiClient.post(`${BASE_URL}/process/program/${programId}`);
};

/**
 * جلب قائمة الخريجين مع فلاتر اختيارية.
 * GET /api/admin/graduation/graduates
 * @param {object} filters - { programId, year, month }
 */
export const getGraduates = (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.programId) params.append('programId', filters.programId);
    if (filters.year) params.append('year', filters.year);
    if (filters.month) params.append('month', filters.month);

    return apiClient.get(`${BASE_URL}/graduates`, { params });
};

/**
 * جلب قائمة الراسبين مع فلاتر اختيارية.
 * GET /api/admin/graduation/failures
 * @param {object} filters - { programId, year, month }
 */
export const getFailures = (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.programId) params.append('programId', filters.programId);
    if (filters.year) params.append('year', filters.year);
    if (filters.month) params.append('month', filters.month);

    return apiClient.get(`${BASE_URL}/failures`, { params });
};

/**
 * رفع ملف شهادة لسجل تخرج معين.
 * POST /api/admin/graduation/{graduationId}/upload-certificate
 * @param {number} graduationId - معرف سجل التخرج.
 * @param {FormData} formData - يحتوي على ملف الشهادة باسم 'file'.
 */
export const uploadCertificate = (graduationId, formData) => {
    return apiClient.post(`${BASE_URL}/${graduationId}/upload-certificate`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

/**
 * حذف شهادة موجودة لسجل تخرج.
 * DELETE /api/admin/graduation/{graduationId}/certificate
 * @param {number} graduationId - معرف سجل التخرج.
 */
export const deleteCertificate = (graduationId) => {
    return apiClient.delete(`${BASE_URL}/${graduationId}/certificate`);
};
 