// src/services/admin/userService.js

import apiClient from "../apiConfig";

const BASE_URL = "/api/admin/users"; 

export const getStudents = () => {
    return apiClient.get(BASE_URL, { params: { role: 'Student' } });  
};

export const getTeachers = () => {
    return apiClient.get(BASE_URL, { params: { role: 'Teacher' } }); 
};

export const createUser = (userData) => {
    console.log(userData)
    return apiClient.post(BASE_URL, userData); 
};

export const updateUser = (userId, userData) => {
    return apiClient.put(`${BASE_URL}/${userId}`, userData); 
};

export const deleteUser = (userId) => {
    return apiClient.delete(`${BASE_URL}/${userId}`); 
};

export const resetUserPassword = (userId, data) => {
    return apiClient.post(`${BASE_URL}/${userId}/reset-password`, data); 
};