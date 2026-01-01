// src/services/admin/archiveService.js

import apiClient from "../apiConfig";

const BASE_URL = "/api/admin/archive";

/**
 * تشغيل عملية أرشفة لفصل دراسي معين.
 * POST /api/admin/archive/classrooms/{classroomId}
 * @param {number} classroomId - معرف الفصل.
 */
export const archiveClassroom = (classroomId) => {
    return apiClient.post(`${BASE_URL}/classrooms/${classroomId}`);
};

/**
 * جلب قائمة بجميع الفصول التي تمت أرشفتها.
 * GET /api/admin/archive/classrooms
 */
export const getArchivedClassrooms = () => {
    return apiClient.get(`${BASE_URL}/classrooms`);
};