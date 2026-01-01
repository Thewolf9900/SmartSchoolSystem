import apiClient from "../apiConfig";

// 1. إنشاء كائن الكاش لتخزين الفيديوات التي تم تحميلها
const videoCache = new Map();

/**
 * جلب بيانات ملف لعرضه بشكل آمن من نقطة النهاية الموحدة.
 * هذا الملف مخصص للاستخدام من قبل أي دور مصادق عليه (طالب، مدرس، إلخ).
 * @param {number} materialId - معرف المادة.
 * @returns {Promise<any>}
 */
export const viewMaterial = async (materialId) => {
    // 2. التحقق مما إذا كان الفيديو موجودًا في الكاش
    if (videoCache.has(materialId)) {
        // إذا كان موجودًا، قم بإعادته مباشرة كـ Promise
        return Promise.resolve(videoCache.get(materialId));
    }

    // 3. إذا لم يكن موجودًا، قم بجلبه من الـ API
    const response = await apiClient.get(`/api/view/materials/${materialId}`, {
        responseType: 'blob' // مهم جدًا: اطلب الاستجابة كملف (بيانات خام)
    });

    // 4. تخزين الاستجابة الكاملة في الكاش للمرة القادمة
    videoCache.set(materialId, response);

    return response;
};

/**
 * تفريغ فيديو معين من ذاكرة الكاش.
 * @param {number} materialId - معرف المادة المراد إزالتها.
 */
export const clearVideoFromCache = (materialId) => {
    if (videoCache.has(materialId)) {
        const cachedResponse = videoCache.get(materialId);
        // إذا كان هناك blob URL مرتبط، قم بإلغائه لتحرير الذاكرة
        if (cachedResponse.blobUrl) {
            URL.revokeObjectURL(cachedResponse.blobUrl);
        }
        videoCache.delete(materialId);
        console.log(`تم تفريغ الفيديو ${materialId} من الكاش.`);
    }
};