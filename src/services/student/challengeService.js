import apiClient from "../apiConfig";

/**
 * @description يجلب أسئلة تحدي الأسبوع لمساق معين.
 * @param {number} courseId - معرّف المساق.
 * @endpoint GET /api/student/challenge/course/{courseId}
 */
export const getWeeklyChallengeForCourse = (courseId) => {
    return apiClient.get(`/api/student/challenge/course/${courseId}`);
};

/**
 * @description يرسل إجابات الطالب لتحدي الأسبوع ويحفظ النتيجة.
 * @param {number} courseId - معرّف المساق.
 * @param {object} submissionData - يحتوي على Answers و TimeTakenSeconds.
 * @endpoint POST /api/student/challenge/course/{courseId}/submit
 */
export const submitWeeklyChallenge = (courseId, submissionData) => {
    return apiClient.post(`/api/student/challenge/course/${courseId}/submit`, submissionData);
};

/**
 * @description يجلب بيانات لوحة المتصدرين لتحدي الأسبوع لمساق معين.
 * @param {number} courseId - معرّف المساق.
 * @endpoint GET /api/student/challenge/course/{courseId}/leaderboard
 */
export const getChallengeLeaderboard = (courseId) => {
    return apiClient.get(`/api/student/challenge/course/${courseId}/leaderboard`);
};