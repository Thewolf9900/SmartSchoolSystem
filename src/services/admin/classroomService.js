// src/services/admin/classroomService.js

import apiClient from "../apiConfig";

const BASE_URL = "/api/admin/classrooms";

/**
 * جلب كل الفصول الدراسية (مع إمكانية الفلترة بالحالة).
 * GET /api/admin/classrooms?status={status}
 * @param {string} status - (اختياري) "ACTIVE" أو "COMPLETED".
 */
export const getClassrooms = (status) => {
    const params = status ? { status } : {};
    return apiClient.get(BASE_URL, { params });
};

/**
 * جلب الفصول التي حالتها "مكتملة" فقط. (مطلوبة لصفحة الأرشفة).
 */
export const getCompletedClassrooms = () => {
    return apiClient.get(BASE_URL, { params: { status: 'COMPLETED' } });
};

/**
 * جلب محتوى فصل دراسي (المحاضرات والمواد).
 * GET /api/admin/classrooms/{classroomId}/content
 * @param {number} classroomId - معرف الفصل.
 */
export const getClassroomContent = (classroomId) => {
    return apiClient.get(`${BASE_URL}/${classroomId}/content`);
};

/**
 * إنشاء فصل دراسي جديد.
 * POST /api/admin/classrooms
 * @param {object} classroomData - { name, courseId, capacity }.
 */
export const createClassroom = (classroomData) => {
    return apiClient.post(BASE_URL, classroomData);
};

/**
 * تحديث فصل دراسي موجود.
 * PUT /api/admin/classrooms/{id}
 * @param {number} classroomId - معرف الفصل.
 * @param {object} classroomData - { name, courseId, capacity }.
 */
export const updateClassroom = (classroomId, classroomData) => {
    return apiClient.put(`${BASE_URL}/${classroomId}`, classroomData);
};

/**
 * حذف فصل دراسي.
 * DELETE /api/admin/classrooms/{id}
 * @param {number} classroomId - معرف الفصل.
 */
export const deleteClassroom = (classroomId) => {
    return apiClient.delete(`${BASE_URL}/${classroomId}`);
};

/**
 * تعيين مدرس لفصل دراسي معين.
 * POST /api/admin/classrooms/{id}/assign-teacher
 * @param {number} classroomId - معرف الفصل.
 * @param {number} teacherId - معرف المدرس.
 */
export const assignTeacherToClassroom = (classroomId, teacherId) => {
    return apiClient.post(`${BASE_URL}/${classroomId}/assign-teacher`, { teacherId });
};

/**
 * إلغاء تعيين مدرس من فصل دراسي.
 * DELETE /api/admin/classrooms/{classroomId}/teacher
 * @param {number} classroomId - معرف الفصل.
 */
export const unassignTeacherFromClassroom = (classroomId) => {
    return apiClient.delete(`${BASE_URL}/${classroomId}/teacher`);
};

/**
 * أرشفة فصل دراسي مكتمل.
 * POST /api/admin/classrooms/{classroomId}/archive
 * @param {number} classroomId - معرف الفصل.
 */
export const archiveClassroom = (classroomId) => {
    return apiClient.post(`${BASE_URL}/${classroomId}/archive`);
};

// --- الدوال التي تعتمد على متحكمات أخرى ---

/**
 * جلب كل الفصول لدورة دراسية معينة.
 * GET /api/admin/courses/{courseId}/classrooms
 * @param {number} courseId - معرف الدورة.
 */
export const getClassroomsForCourse = (courseId) => {
    return apiClient.get(`/api/admin/courses/${courseId}/classrooms`);
};

/**
 * جلب كل الفصول لمدرس معين.
 * GET /api/admin/teachers/{teacherId}/classrooms
 * @param {number} teacherId - معرف المدرس.
 */
export const getClassroomsForTeacher = (teacherId) => {
    return apiClient.get(`/api/admin/teachers/${teacherId}/classrooms`);
};