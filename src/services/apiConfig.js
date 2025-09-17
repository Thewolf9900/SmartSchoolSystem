import axios from "axios";

// --- 1. العميل الأساسي (يبقى كما هو) ---
const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// إضافة التوكن لكل الطلبات الصادرة
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


// --- 2. الدالة الجديدة لإضافة المعترضات الذكية ---
// هذه الدالة تقبل نسخة من Axios ودالة callback لإعادة جلب البيانات
export const setupResponseInterceptor = (axiosInstance, refetchCallback) => {

    // أولاً، قم بإزالة أي معترضات قديمة لتجنب التكرار
    if (axiosInstance.interceptors.response.handlers.length > 0) {
        axiosInstance.interceptors.response.eject(0);
    }

    // إضافة المعترض الجديد
    const interceptor = axiosInstance.interceptors.response.use(
        (response) => response,
        (error) => {
            const { status } = error.response || {};
            if (status === 404 || status === 403) {
                console.log(`Interceptor detected status ${status}. Triggering refetch.`);
                // استدعاء الدالة التي تم تمريرها
                if (refetchCallback) {
                    refetchCallback();
                }
            }
            return Promise.reject(error);
        }
    );

    // إرجاع دالة "تنظيف" لإزالة المعترض عند الحاجة
    return () => {
        axiosInstance.interceptors.response.eject(interceptor);
    };
};


export default apiClient;