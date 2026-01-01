import MyClassrooms from "views/Student/MyClassrooms.js";
import ClassroomDetails from "views/Student/ClassroomDetails.js";
import AcademicRecord from "views/Student/AcademicRecord.js";
import TakeQuiz from "views/Student/TakeQuiz.js";
import QuizResult from "views/Student/QuizResult.js";
import Announcements from "views/Student/Announcements.js";
import MyProfile from "../views/shared/MyProfile.js";
import WeeklyChallengePage from "../views/Student/WeeklyChallengePage.js";
import TakeChallengePage from "../views/Student/TakeChallengePage.js";
import ChallengeResultPage from "../views/Student/ChallengeResultPage.js";


const studentRoutes = [
    // --- المسارات التي تظهر في الشريط الجانبي ---
    {
        path: "/my-classrooms",
        name: "فصولي الدراسية",
        icon: "nc-icon nc-paper-2",
        component: MyClassrooms,
        layout: "/student",
    },
    {
        path: "/academic-record",
        name: "السجل الأكاديمي",
        icon: "nc-icon nc-notes",
        component: AcademicRecord,
        layout: "/student",
    },
    {
        path: "/announcements",
        name: "الإعلانات",
        icon: "nc-icon nc-bell-55",
        component: Announcements,
        layout: "/student",
    },
    {
        path: "/my-profile",
        name: "ملفي الشخصي",
        icon: "nc-icon nc-single-02",
        component: MyProfile,
        layout: "/student",
    },
    {
        path: "/weekly-challenge",
        name: "تحدي الأسبوع",
        icon: "fas fa-trophy text-warning",
        component: WeeklyChallengePage,
        layout: "/student",
    },


    // --- المسارات المخفية ---
    {
        path: "/classrooms/:classroomId",
        component: ClassroomDetails,
        layout: "/student",
    },
    {
        path: "/take-quiz/:lectureId", // المسار لجلب الاختبار بناءً على معرف المحاضرة
        component: TakeQuiz,
        layout: "/student",
    },
    {
        path: "/quiz-result/:submissionId", // ✨ التأكيد على استخدام submissionId هنا
        component: QuizResult,
        layout: "/student",
    },
    {
        path: "/challenge/take/:courseId",
        component: TakeChallengePage,
        layout: "/student",
    },
    {
        path: "/challenge/result/:courseId",
        component: ChallengeResultPage,
        layout: "/student",
    },
];

export default studentRoutes;