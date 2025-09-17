// src/services/admin/programService.js

import apiClient from "../apiConfig";

const BASE_URL = "/api/admin/programs";

/**
 * جلب كل البرامج الأكاديمية.
 * GET /api/admin/programs
 */
export const getPrograms = () => {
    return apiClient.get(BASE_URL);
};

/**
 * إنشاء برنامج أكاديمي جديد.
 * POST /api/admin/programs
 * @param {object} programData - { name, description }
 */
export const createProgram = (programData) => {
    return apiClient.post(BASE_URL, programData);
};

/**
 * تحديث برنامج أكاديمي موجود.
 * PUT /api/admin/programs/{programId}
 * @param {number} programId - معرف البرنامج.
 * @param {object} programData - { name, description }
 */
export const updateProgram = (programId, programData) => {
    return apiClient.put(`${BASE_URL}/${programId}`, programData);
};

/**
 * حذف برنامج أكاديمي.
 * DELETE /api/admin/programs/{programId}
 * @param {number} programId - معرف البرنامج.
 */
export const deleteProgram = (programId) => {
    return apiClient.delete(`${BASE_URL}/${programId}`);
};

/**
 * جلب كل الدورات لبرنامج أكاديمي معين.
 * GET /api/admin/programs/{programId}/courses
 * @param {number} programId - معرف البرنامج.
 */
export const getCoursesForProgram = (programId) => {
    return apiClient.get(`${BASE_URL}/${programId}/courses`);
};

/**
 * جلب كل الطلاب المسجلين في برنامج معين.
 * (This endpoint is defined in StudentManagementController but logically belongs here)
 * GET /api/admin/programs/{programId}/students
 * @param {number} programId - معرف البرنامج.
 */
export const getStudentsForProgram = (programId) => {
    return apiClient.get(`${BASE_URL}/${programId}/students`);
};
