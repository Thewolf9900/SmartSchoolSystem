import apiClient from "../apiConfig";

/**
 * Service methods for public-facing API endpoints related to registration.
 */

export const getPublicPrograms = () => {
    return apiClient.get("/api/public/programs");
};

/**
  * @param {object} registrationData  
 */
export const submitRegistration = (registrationData) => {
    return apiClient.post("/api/public/register", registrationData);
};

export const checkRegistrationStatus = (email, programId) => {
    return apiClient.get("/api/public/registrations/status", {
        params: { email, programId },
    });
};

export const uploadReceipt = (registrationId, receiptFile) => {
    const formData = new FormData();
    formData.append("receiptFile", receiptFile);

    return apiClient.post(
        `/api/public/registrations/${registrationId}/upload-receipt`,
        formData
    );
};