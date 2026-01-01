import TeacherDashboard from "../views/Teacher/TeacherDashboard.js";
import MyClassrooms from "../views/Teacher/MyClassrooms.js";
import ClassroomPortal from "../views/Teacher/ClassroomPortal.js";
import LectureManagement from "../views/Teacher/LectureManagement.js";
import GradingManagement from "../views/Teacher/GradingManagement.js";
import ClassroomSettings from "../views/Teacher/ClassroomSettings.js";
import CourseCurriculum from "../views/Teacher/CourseCurriculum.js";
import MyProfile from "../views/shared/MyProfile.js";
import QuizManagement from "../views/Teacher/QuizManagement.js";
import QuestionBankManagement from "../views/Teacher/QuestionBankManagement.js";
import WeeklyChallengeViewer from "../views/Teacher/WeeklyChallengeViewer.js";

const teacherRoutes = [
    {
        path: "/dashboard",
        name: "لوحة التحكم الرئيسية",
        icon: "nc-icon nc-chart-pie-35",
        component: TeacherDashboard,
        layout: "/teacher",
    },
    {
        path: "/my-classrooms",
        name: "فصولي الدراسية",
        icon: "nc-icon nc-grid-45",
        component: MyClassrooms,
        layout: "/teacher",
    },
    {
        path: "/curriculum",
        name: "المناهج الدراسية",
        icon: "nc-icon nc-bulb-63",
        component: CourseCurriculum,
        layout: "/teacher",
    },
     {
        path: "/question-banks",
        name: "إدارة بنوك الأسئلة",
        icon: "nc-icon nc-bank",
        component: QuestionBankManagement,
        layout: "/teacher",
        isCoordinatorRoute: true  
    }, {
        path: "/weekly-challenges",
        name: "تحديات الأسبوع",
        icon: "nc-icon nc-trophy",
        component: WeeklyChallengeViewer,
        layout: "/teacher",
    },
    {
        path: "/my-profile",
        name: "حسابي",
        icon: "nc-icon nc-single-02 mr-2",
        component: MyProfile,
        layout: "/teacher",
    },

    // --- المسارات المخفية (لا تظهر في القائمة) ---
    {
        path: "/classroom/:classroomId",
        component: ClassroomPortal,
        layout: "/teacher",
        children: [
            {
                path: "/lectures",
                component: LectureManagement,
            },
            {
                path: "/grading",
                component: GradingManagement,
            },
            {
                path: "/settings",
                component: ClassroomSettings,
            }
        ]
    },
    {
        path: "/quiz/:quizId/manage",
        component: QuizManagement,
        layout: "/teacher",
    }
];

export default teacherRoutes;