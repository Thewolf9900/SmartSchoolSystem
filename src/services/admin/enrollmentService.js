// src/services/admin/enrollmentService.js

import apiClient from "../apiConfig";

const BASE_URL = "/api/admin/enrollments"; // المسار الرئيسي الصحيح


/**
 * جلب الطلاب المسجلين في فصل معين
 */
export const getEnrolledStudentsForClassroom = (classroomId) => {
    // تم تصحيح المسار بناءً على EnrollmentsController
    return apiClient.get(`/api/admin/classrooms/${classroomId}/enrollments`);
};

/**
 * تسجيل طالب في فصل دراسي
 */
export const enrollStudentInClassroom = (enrollmentData) => { // { studentId, classroomId }
    return apiClient.post(BASE_URL, enrollmentData); // --- تم التصحيح هنا ---
};

/**
 * إلغاء تسجيل طالب من فصل دراسي
 */
export const unenrollStudentFromClassroom = (enrollmentId) => {
    return apiClient.delete(`${BASE_URL}/${enrollmentId}`); // --- تم التصحيح هنا ---
};

/**
 * نقل طالب إلى فصل آخر
 */
export const transferStudent = (enrollmentId, newClassroomId) => {
    // تم تصحيح Body ليتطابق مع DTO
    return apiClient.put(`${BASE_URL}/${enrollmentId}/transfer`, { newClassroomId }); // --- تم التصحيح هنا ---
};