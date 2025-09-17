import apiClient from "../apiConfig";

// ====================================================================
// 1. Classroom & General Endpoints
// ====================================================================

export const getMyClassrooms = (statusFilter) => {
    const params = statusFilter && statusFilter !== 'ALL' ? { status: statusFilter } : {};
    return apiClient.get('/api/teacher/classrooms', { params });
};

export const getClassroomDetails = (classroomId) => {
    return apiClient.get(`/api/teacher/classrooms/${classroomId}/details`);
};

export const toggleClassroomStatus = (classroomId) => {
    return apiClient.post(`/api/teacher/classrooms/${classroomId}/toggle-status`);
};

// ====================================================================
// 2. Lecture Endpoints
// ====================================================================

export const getClassroomLectures = (classroomId) => {
    return apiClient.get(`/api/teacher/classrooms/${classroomId}/lectures`);
};

export const createLecture = (classroomId, lectureData) => {
    return apiClient.post(`/api/teacher/classrooms/${classroomId}/lectures`, lectureData);
};

export const deleteLecture = (lectureId) => {
    return apiClient.delete(`/api/teacher/lectures/${lectureId}`);
};

// ====================================================================
// 3. Material Endpoints
// ====================================================================

export const addMaterialToLecture = (lectureId, formData) => {
    return apiClient.post(`/api/teacher/lectures/${lectureId}/materials`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const deleteMaterial = (materialId) => {
    return apiClient.delete(`/api/teacher/materials/${materialId}`);
};

export const getCourseReferenceMaterials = (courseId) => {
    return apiClient.get(`/api/teacher/from-course/${courseId}/material`);
};

export const downloadTeacherMaterial = async (material) => {
    try {
        const response = await apiClient.get(`/api/teacher/materials/${material.materialId}/download`, {
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', material.originalFilename || 'download');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Secure download error:", error);
    }
};

// ====================================================================
// 4. Grading & Enrollment Endpoints
// ====================================================================

export const getClassroomEnrollments = (classroomId) => {
    return apiClient.get(`/api/teacher/classrooms/${classroomId}/enrollments`);
};

export const setRawGrades = (enrollmentId, gradesData) => {
    return apiClient.post(`/api/teacher/enrollments/${enrollmentId}/raw-grades`, gradesData);
};

export const getGradingStatus = (classroomId) => {
    return apiClient.get(`/api/teacher/classrooms/${classroomId}/grading-status`);
};

export const calculateFinalGrades = (classroomId) => {
    return apiClient.post(`/api/teacher/classrooms/${classroomId}/calculate-final-grades`);
};

// ====================================================================
// 5. Announcement Endpoints
// ====================================================================

export const createClassroomAnnouncement = (classroomId, announcementData) => {
    return apiClient.post(`/api/teacher/classrooms/${classroomId}/announcements`, announcementData);
};

export const deleteAnnouncement = (announcementId) => {
    return apiClient.delete(`/api/announcements/${announcementId}`);
};

export const getAllAnnouncements = () => {
    return apiClient.get('/api/announcements');
};


// ====================================================================
// 6. Lecture Quiz Endpoints
// ====================================================================

export const createQuizForLecture = (lectureId, quizData) => {
    return apiClient.post(`/api/teacher/quizzes/lecture/${lectureId}`, quizData);
};

export const getQuizDetails = (quizId) => {
    return apiClient.get(`/api/teacher/quizzes/${quizId}/details`);
};

export const deleteQuiz = (quizId) => {
    return apiClient.delete(`/api/teacher/quizzes/${quizId}`);
};

export const addQuestionToQuiz = (quizId, formData) => {
    return apiClient.post(`/api/teacher/quizzes/${quizId}/questions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const deleteQuizQuestion = (questionId) => {
    return apiClient.delete(`/api/teacher/quizzes/questions/${questionId}`);
};

export const getQuizSubmissions = (quizId) => {
    return apiClient.get(`/api/teacher/quizzes/${quizId}/submissions`);
};

/**
 * @description يقوم بتفعيل اختبار معين (عملية لمرة واحدة).
 * @param {number} quizId - معرّف الاختبار.
 * @endpoint POST /api/teacher/quizzes/{quizId}/toggle-status
 */
export const activateQuiz = (quizId) => {
    // نستخدم post() ولا نرسل أي بيانات في الـ body، تمامًا كما يتوقع الباك اند.
    return apiClient.post(`/api/teacher/quizzes/${quizId}/toggle-status`);
};

// ====================================================================
// 7. Coordinator & Question Bank Endpoints
// ====================================================================

export const getMyCoordinatedCourses = () => {
    return apiClient.get('/api/teacher/my-coordinated-courses');
};

export const getCourseQuestions = (courseId) => {
    return apiClient.get(`/api/teacher/question-bank/course/${courseId}`);
};

export const suggestQuestion = (courseId, formData) => {
    return apiClient.post(`/api/teacher/question-bank/course/${courseId}/suggest`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const reviewQuestion = (questionId, reviewData) => {
    return apiClient.patch(`/api/teacher/question-bank/questions/${questionId}/review`, reviewData);
};

export const revertQuestionReview = (questionId) => {
    return apiClient.patch(`/api/teacher/question-bank/questions/${questionId}/revert-review`);
};

export const updateQuestion = (questionId, formData) => {
    return apiClient.put(`/api/teacher/question-bank/questions/${questionId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const deleteQuestion = (questionId) => {
    return apiClient.delete(`/api/teacher/question-bank/questions/${questionId}`);
};

export const getMyPendingSuggestions = (courseId) => {
    return apiClient.get(`/api/teacher/question-bank/course/${courseId}/my-suggestions`);
};

// ====================================================================
// 8. ✨ Weekly Challenge Endpoint (New) ✨
// ====================================================================

/**
 * @description يجلب بيانات لوحة المتصدرين لتحدي الأسبوع لمساق معين (للمدرس).
 * @param {number} courseId - معرّف المساق.
 * @endpoint GET /api/teacher/challenge/course/{courseId}/leaderboard
 */
export const getChallengeLeaderboardForTeacher = (courseId) => {
    return apiClient.get(`/api/teacher/challenge/course/${courseId}/leaderboard`);
};