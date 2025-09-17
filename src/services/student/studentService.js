import apiClient from "../apiConfig"; // ✨ تم تصحيح المسار هنا

/**
 * =================================================================
 *                        Classrooms & Materials
 * =================================================================
 */

/**
 * @description يجلب قائمة بكل الفصول الدراسية المسجل بها الطالب الحالي.
 * @endpoint GET /api/student/my-classrooms
 * @returns {Promise<AxiosResponse<Array<StudentClassroomListDto>>>}
 */
export const getMyClassrooms = () => {
    return apiClient.get("/api/student/my-classrooms");
};

/**
 * @description يجلب التفاصيل الكاملة لفصل دراسي معين، بما في ذلك المحاضرات والمواد.
 * @param {number} classroomId - معرّف الفصل الدراسي.
 * @endpoint GET /api/student/classrooms/{classroomId}/details
 * @returns {Promise<AxiosResponse<StudentClassroomDetailsDto>>}
 */
export const getClassroomDetails = (classroomId) => {
    return apiClient.get(`/api/student/classrooms/${classroomId}/details`);
};

/**
 * @description يجلب المواد المرجعية (غير المرتبطة بمحاضرة) لمساق معين.
 * @param {number} courseId - معرّف المساق.
 * @endpoint GET /api/student/courses/{courseId}/materials
 * @returns {Promise<AxiosResponse<Array<MaterialDto>>>}
 */
export const getCourseReferenceMaterials = (courseId) => {
    return apiClient.get(`/api/student/courses/${courseId}/materials`);
};

/**
 * @description يقوم ببدء عملية تحميل ملف مادة تعليمية معينة.
 * @param {number} materialId - معرّف المادة.
 * @endpoint GET /api/student/materials/{materialId}/download
 * @returns {Promise<AxiosResponse<Blob>>} - A promise that resolves with the file blob.
 */
export const downloadMaterial = (materialId) => {
    return apiClient.get(`/api/student/materials/${materialId}/download`, {
        responseType: 'blob', // Important for handling file downloads
    });
};



/**
 * =================================================================
 *                        Announcements & Academic Record
 * =================================================================
 */

/**
 * @description يجلب قائمة بكل الإعلانات الموجهة للطالب.
 * @endpoint GET /api/student/announcements
 * @returns {Promise<AxiosResponse<Array<AnnouncementDto>>>}
 */
export const getMyAnnouncements = () => {
    return apiClient.get("/api/student/announcements");
};

/**
 * @description يجلب السجل الأكاديمي الكامل للطالب.
 * @endpoint GET /api/student/academic-record
 * @returns {Promise<AxiosResponse<StudentAcademicRecordDto>>}
 */
export const getMyAcademicRecord = () => {
    return apiClient.get("/api/student/academic-record");
};

/**
 * @description يجلب تفاصيل الاختبار الخاص بمحاضرة معينة (بدون الإجابات).
 * @param {number} lectureId - معرّف المحاضرة.
 * @endpoint GET /api/student/lectures/{lectureId}/quiz
 */
export const getQuizForLecture = (lectureId) => {
    return apiClient.get(`/api/student/lectures/${lectureId}/quiz`);
};

/**
 * @description يرسل إجابات الطالب للاختبار ويستقبل النتيجة.
 * @param {number} quizId - معرّف الاختبار.
 * @param {Array<object>} answers - مصفوفة من إجابات الطالب.
 * @endpoint POST /api/student/quizzes/{quizId}/submit
 */
export const submitQuiz = (quizId, answers) => {
    return apiClient.post(`/api/student/quizzes/${quizId}/submit`, { answers });
};

/**
 * =================================================================
 *                        Quiz Review
 * =================================================================
 */

/**
 * @description يجلب تفاصيل نتيجة اختبار تم تقديمه للمراجعة.
 * @param {number} submissionId - معرّف تقديم الاختبار (submission ID).
 * @endpoint GET /api/student/submissions/{submissionId}/review
 * @returns {Promise<AxiosResponse<QuizReviewDetailsDto>>}
 */
export const getQuizResultReview = (submissionId) => {
    return apiClient.get(`/api/student/submissions/${submissionId}/review`);
};