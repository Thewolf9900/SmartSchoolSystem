// src/services/admin/materialService.js

import apiClient from "../apiConfig";

const BASE_URL = "/api/admin/materials";

/**
 * جلب كل المواد المرجعية لدورة معينة.
 * GET /api/admin/materials/from-course/{courseId}
 * @param {number} courseId - معرف الدورة.
 */
export const getCourseMaterials = (courseId) => {
    return apiClient.get(`${BASE_URL}/from-course/${courseId}`);
};

/**
 * إضافة مادة مرجعية جديدة (ملف أو رابط) لدورة معينة.
 * POST /api/admin/materials/for-course/{courseId}
 * @param {number} courseId - معرف الدورة.
 * @param {FormData} materialData - بيانات المادة الجديدة.
 */
export const addCourseMaterial = (courseId, materialData) => {
    return apiClient.post(`${BASE_URL}/for-course/${courseId}`, materialData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

/**
 * تعديل بيانات مادة مرجعية موجودة.
 * PUT /api/admin/materials/{materialId}
 * @param {number} materialId - معرف المادة.
 * @param {object} updateDto - { title, description }.
 */
export const updateMaterial = (materialId, updateDto) => {
    return apiClient.put(`${BASE_URL}/${materialId}`, updateDto);
};

/**
 * حذف مادة مرجعية.
 * DELETE /api/admin/materials/{materialId}
 * @param {number} materialId - معرف المادة.
 */
export const deleteMaterial = (materialId) => {
    return apiClient.delete(`${BASE_URL}/${materialId}`);
};

/**
 * تحميل ملف مادة مرجعية.
 * GET /api/admin/materials/{materialId}/download
 * @param {number} materialId - معرف المادة.
 */
export const downloadAdminMaterial = async (materialId, originalFilename = 'download') => {
    try {
        const response = await apiClient.get(`${BASE_URL}/${materialId}/download`, {
            responseType: 'blob',
        });

        // استخراج اسم الملف من الـ header إذا كان متاحًا
        const contentDisposition = response.headers['content-disposition'];
        let filename = originalFilename;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
            if (filenameMatch && filenameMatch.length > 1) {
                filename = decodeURIComponent(filenameMatch[1]);
            }
        }

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();

        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Error downloading the material:", error);
        throw error;
    }
};