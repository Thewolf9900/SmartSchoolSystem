// src/services/admin/profileService.js
import  apiClient   from "../apiConfig";

/**
 * جلب بيانات المدير الحالي.
 * GET /api/admin/account/profile
 */
export const getMyProfile = () => {
    return apiClient.get('api/admin/account/profile');
};

/**
 * تحديث بيانات المدير الحالي بشكل آمن.
 * PUT /api/admin/account/profile
 * @param {object} profileData - بيانات الملف الشخصي الجديدة مع حقل التحقق.
 */
export const updateMyProfile = (profileData) => {
    return apiClient.put('api/admin/account/profile', profileData);
};