// src/services/admin/courseService.js

import apiClient from "../apiConfig";

const BASE_URL = "/api/admin/courses";

/**
 * جلب كل الدورات الدراسية.
 * GET /api/admin/courses
 */
export const getCourses = () => {
    return apiClient.get(BASE_URL);
};

/**
 * إنشاء دورة دراسية جديدة.
 * POST /api/admin/courses
 * @param {object} courseData - { name, academicProgramId }
 */
export const createCourse = (courseData) => {
    return apiClient.post(BASE_URL, courseData);
};

/**
 * تحديث دورة دراسية موجودة.
 * PUT /api/admin/courses/{id}
 * @param {number} courseId - معرف الدورة.
 * @param {object} courseData - { name }
 */
export const updateCourse = (courseId, courseData) => {
    return apiClient.put(`${BASE_URL}/${courseId}`, courseData);
};

/**
 * حذف دورة دراسية.
 * DELETE /api/admin/courses/{id}
 * @param {number} courseId - معرف الدورة.
 */
export const deleteCourse = (courseId) => {
    return apiClient.delete(`${BASE_URL}/${courseId}`);
};

// --- الدوال التي تعتمد على متحكمات أخرى ---

/**
 * جلب كل الدورات لبرنامج أكاديمي معين.
 * (This endpoint is in ProgramsController)
 * GET /api/admin/programs/{programId}/courses
 * @param {number} programId - معرف البرنامج.
 */
export const getCoursesForProgram = (programId) => {
    return apiClient.get(`/api/admin/programs/${programId}/courses`);
};

/**
 * جلب كل الفصول لدورة دراسية معينة.
 * (This endpoint is in ClassroomsController, assuming a new structure)
 * GET /api/admin/classrooms/by-course/{courseId}
 * @param {number} courseId - معرف الدورة.
 */
export const getClassroomsForCourse = (courseId) => {
    // Assuming the path based on best practices, to be confirmed by ClassroomsController
    return apiClient.get(`/api/admin/courses/${courseId}/classrooms`);
};

/**
 * جلب الطلاب المتاحين للتسجيل في دورة معينة.
 * (This endpoint is in StudentManagementController)
 * GET /api/admin/student-management/courses/{courseId}/available-students
 * @param {number} courseId
 */
export const getAvailableStudentsForCourse = (courseId) => {
    return apiClient.get(`/api/admin/student-management/courses/${courseId}/available-students`);
};

/**
 * تعيين مدرس كمنسق لدورة معينة.
 * PATCH /api/admin/courses/{id}/assign-coordinator
 * @param {number} courseId - معرف الدورة.
 * @param {number} teacherId - معرف المدرس.
 */
export const assignCoordinatorToCourse = (courseId, teacherId) => {
    return apiClient.patch(`/api/admin/courses/${courseId}/assign-coordinator`, { teacherId });
};
/**
 * إلغاء تعيين المنسق الحالي من دورة معينة.
 * DELETE /api/admin/courses/{id}/unassign-coordinator
 * @param {number} courseId - معرف الدورة.
 */
export const unassignCoordinatorFromCourse = (courseId) => {
    return apiClient.delete(`${BASE_URL}/${courseId}/unassign-coordinator`);
};