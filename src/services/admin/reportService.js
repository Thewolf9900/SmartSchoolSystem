// src/services/admin/reportService.js

import apiClient from "../apiConfig";

const BASE_URL = "/api/admin/reports";

/**
 * تقرير بالفصول الدراس различных التي لا يوجد بها مدرسون معينون.
 * GET /api/admin/reports/classrooms-without-teachers
 */
export const getClassroomsWithoutTeachers = () => {
  return apiClient.get(`${BASE_URL}/classrooms-without-teachers`);
};

/**
 * تقرير بالدورات التي لم يتم إنشاء فصول لها.
 * GET /api/admin/reports/courses-without-classrooms
 */
export const getCoursesWithoutClassrooms = () => {
  return apiClient.get(`${BASE_URL}/courses-without-classrooms`);
};

/**
 * تقرير بنواقص التسجيل لدى الطلاب في برنامج معين.
 * GET /api/admin/reports/enrollment-deficiencies/program/{programId}
 * @param {number} programId - معرف البرنامج.
 */
export const getEnrollmentDeficiencies = (programId) => {
  return apiClient.get(`${BASE_URL}/enrollment-deficiencies/program/${programId}`);
};

/**
 * جلب الخريجين الذين لم يتم رفع شهاداتهم بعد.
 * GET /api/admin/reports/graduates-pending-certificate
 */
export const getGraduatesPendingCertificate = () => {
  return apiClient.get(`${BASE_URL}/graduates-pending-certificate`);
};

 /* تقرير بالدورات التي لم يتم تعيين منسق لها.
 * GET / api / admin / reports / courses - without - coordinators
  */
export const getCoursesWithoutCoordinators = () => {
  return apiClient.get(`${BASE_URL}/courses-without-coordinators`);
};