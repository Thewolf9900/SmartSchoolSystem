// src/services/admin/studentManagementService.js

import apiClient   from "../apiConfig";

const BASE_URL = "/api/admin/student-management";

/**
 * جلب الطلاب النشطين (المسجلين في برنامج).
 * GET /api/admin/student-management/active-students
 */
export const getActiveStudents = () => {
    return apiClient.get(`${BASE_URL}/active-students`);
};

/**
 * جلب الطلاب غير المعينين لبرنامج.
 * GET /api/admin/student-management/unassigned-students
 */
export const getUnassignedStudents = () => {
    return apiClient.get(`${BASE_URL}/unassigned-students`);
};

/**
 * تعيين طالب لبرنامج أكاديمي.
 * POST /api/admin/student-management/students/{studentId}/assign-program
 * @param {number} studentId - معرف الطالب.
 * @param {object} assignDto - يحتوي على { academicProgramId }.
 */
export const assignStudentToProgram = (studentId, programId) => {
    return apiClient.post(`${BASE_URL}/${studentId}/assign-program`, { academicProgramId: programId });
};

/**
 * إلغاء تعيين طالب من برنامجه الحالي.
 * DELETE /api/admin/student-management/students/{studentId}/unassign-program
 * @param {number} studentId - معرف الطالب.
 */
export const unassignStudentFromProgram = (studentId) => {
    return apiClient.delete(`${BASE_URL}/${studentId}/unassign-program`);
};

/**
 * جلب الملف الشخصي الكامل للطالب.
 * GET /api/admin/student-management/students/{studentId}/profile
 * @param {number} studentId - معرف الطالب.
 */
export const getStudentProfile = (studentId) => {
    return apiClient.get(`${BASE_URL}/${studentId}/profile`);
};

/**
 * جلب الطلاب المتاحين للتسجيل في دورة معينة.
 * GET /api/admin/student-management/courses/{courseId}/available-students
 * @param {number} courseId - معرف الدورة.
 */
export const getAvailableStudentsForCourse = (courseId) => {
    return apiClient.get(`${BASE_URL}/courses/${courseId}/available-students`);
};

/**
 * جلب الطلاب المسجلين في برنامج معين.
 * GET /api/admin/programs/{programId}/students
 * @param {number} programId - معرف البرنامج.
 */
export const getStudentsInProgram = (programId) => {
    // هذا المسار خارج BASE_URL بناءً على الكنترولر
    return apiClient.get(`/api/admin/programs/${programId}/students`);
};


