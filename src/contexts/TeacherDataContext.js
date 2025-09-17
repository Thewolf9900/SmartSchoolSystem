import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { toast } from 'react-toastify';
 import apiClient, { setupResponseInterceptor } from 'services/apiConfig';
import { getMyCoordinatedCourses } from 'services/teacher/teacherService';

const TeacherDataContext = createContext(null);

export const TeacherDataProvider = ({ children }) => {
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [coordinatedCourses, setCoordinatedCourses] = useState([]);
    const [isCoordinator, setIsCoordinator] = useState(false);
    const [loadingCoordinatorStatus, setLoadingCoordinatorStatus] = useState(true);

    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        setLoadingCoordinatorStatus(true);
        try {
            const [classroomsResponse, coordinatedCoursesResponse] = await Promise.all([
                apiClient.get('/api/teacher/classrooms'),
                getMyCoordinatedCourses()
            ]);

            setClassrooms(classroomsResponse.data);
            setCoordinatedCourses(coordinatedCoursesResponse.data);
            setIsCoordinator(coordinatedCoursesResponse.data.length > 0);

        } catch (err) {
            setError(err);
            toast.error("فشل في تحميل البيانات الأساسية للمعلم.");
        } finally {
            setLoading(false);
            setLoadingCoordinatorStatus(false);
        }
    }, []);

    useEffect(() => {
        const cleanupInterceptor = setupResponseInterceptor(apiClient, () => {
            toast.info("تم تحديث البيانات تلقائيًا لكشف التغييرات الأخيرة.");
            fetchInitialData();
        });

        fetchInitialData(); 

        // --- 4. استخدام دالة التنظيف ---
        return () => {
            cleanupInterceptor();
        };
    }, [fetchInitialData]);

    const value = {
        classrooms,
        loading,
        error,
        refetchClassrooms: fetchInitialData,
        coordinatedCourses,
        isCoordinator,
        loadingCoordinatorStatus
    };

    return (
        <TeacherDataContext.Provider value={value}>
            {children}
        </TeacherDataContext.Provider>
    );
};

export const useTeacherData = () => {
    const context = useContext(TeacherDataContext);
    if (context === null) {
        throw new Error("useTeacherData must be used within a TeacherDataProvider");
    }
    return context;
};