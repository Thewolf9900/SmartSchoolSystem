import apiClient from "../apiConfig";


/**
 * يجلب قائمة بكل محادثات المستخدم الحالي (بدون الرسائل).
 */
export const getMyConversations = () => {
    return apiClient.get('/api/chat/conversations');
};

/**
 * يجلب محادثة واحدة بكل رسائلها.
 * @param {number} conversationId - معرّف المحادثة.
 */
export const getConversationDetails = (conversationId) => {
    return apiClient.get(`/api/chat/conversations/${conversationId}`);
};

/**
 * ينشئ محادثة جديدة فارغة للمستخدم الحالي.
 */
export const createConversation = () => {
    return apiClient.post('/api/chat/conversations');
};

/**
 * يرسل رسالة جديدة إلى محادثة معينة ويستقبل رد الـ AI.
 * @param {number} conversationId - معرّف المحادثة.
 * @param {string} content - نص الرسالة التي يرسلها المستخدم.
 */
export const postMessage = (conversationId, content) => {
    return apiClient.post(`/api/chat/conversations/${conversationId}/messages`, { content });
};

/**
 * يحذف محادثة بالكامل.
 * @param {number} conversationId - معرّف المحادثة.
 */
export const deleteConversation = (conversationId) => {
    return apiClient.delete(`/api/chat/conversations/${conversationId}`);
};
/**
 * يمسح كل الرسائل من محادثة معينة مع الإبقاء على المحادثة نفسها.
 * @param {number} conversationId - معرّف المحادثة.
//  */
// export const clearConversation = (conversationId) => {
//     // ملاحظة: يجب إضافة هذا الـ Endpoint في ChatController في الواجهة الخلفية
//     // POST /api/chat/conversations/{id}/clear
//     return apiClient.post(`/api/chat/conversations/${conversationId}/clear`);
// };