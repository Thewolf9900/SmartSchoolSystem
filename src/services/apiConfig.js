import axios from "axios";


const baseURL = process.env.REACT_APP_API_BASE_URL;

const apiClient = axios.create({
    baseURL: baseURL,
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        const isPublicRoute = config.url.includes("/api/public/");

        if (token && !isPublicRoute) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }

        if (config.data instanceof FormData) {
            delete config.headers["Content-Type"];
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const setupResponseInterceptor = (axiosInstance, refetchCallback) => {
    if (axiosInstance.interceptors.response.handlers.length > 0) {
        axiosInstance.interceptors.response.eject(0);
    }

    const interceptor = axiosInstance.interceptors.response.use(
        (response) => response,
        (error) => {
            const { status } = error.response || {};
            if (status === 404 || status === 403) {
                console.log(`Interceptor detected status ${status}. Triggering refetch.`);
                if (refetchCallback) {
                    refetchCallback();
                }
            }
            return Promise.reject(error);
        }
    );

    return () => {
        axiosInstance.interceptors.response.eject(interceptor);
    };
};

export default apiClient;