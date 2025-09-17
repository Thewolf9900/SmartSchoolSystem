// src/services/admin/announcementService.js

import apiClient from "../apiConfig";

const BASE_URL = "/api/announcements";
const OPTIONS_URL = "/api/options";

/**
 * جلب قائمة الإعلانات المتاحة للمستخدم الحالي.
 */
export const getAnnouncements = () => {
    return apiClient.get(BASE_URL);
};

/**
 * إنشاء إعلان جديد.
 * @param {object} announcementData - { title, content, targetScope, targetId }
 */
export const createAnnouncement = (announcementData) => {
    return apiClient.post(BASE_URL, announcementData);
};

/**
 * حذف إعلان معين.
 * @param {number} announcementId
  */
export const deleteAnnouncement = (announcementId) => {
    return apiClient.delete(`${BASE_URL}/${announcementId}`);
};

/**
 * جلب قائمة نطاقات الإعلانات المتاحة بناءً على دور المستخدم.
 */
export const getAvailableAnnouncementScopes = () => {
    return apiClient.get(`${OPTIONS_URL}/announcement-scopes`);
};