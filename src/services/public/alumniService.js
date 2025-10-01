import apiClient from "../apiConfig";

const BASE_URL = "/api/public/alumni";

export const getAlumniRecords = (nationalId) => {
    return apiClient.get(`${BASE_URL}/records`, {
        params: { nationalId }
    });
};

export const downloadCertificate = (graduationId) => {
    return apiClient.get(`${BASE_URL}/certificate/${graduationId}`, {
        responseType: 'blob'  
    });
};