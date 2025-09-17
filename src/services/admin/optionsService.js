 
import apiClient from "../apiConfig";

// دالة لجلب قائمة أدوار المستخدمين المتاحة
export const getUserRoles = () => {
    return apiClient.get("/api/options/user-roles");
};