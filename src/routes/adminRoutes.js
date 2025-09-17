// src/routes/adminRoutes.js
// هذا الملف يحتوي الآن فقط على المسارات الخاصة بواجهة المدير

// تم تحديث جميع مسارات الاستيراد لتشير إلى المجلد الجديد 'views/admin'
import Dashboard from "../views/Admin/Dashboard";
import UserManagement from "../views/Admin/UserManagement.js";
import ProgramManagement from "../views/Admin/ProgramManagement.js";
import CourseManagement from "../views/Admin/CourseManagement.js";
import ClassroomManagement from "../views/Admin/ClassroomManagement.js";
import EnrollmentManagement from "../views/Admin/EnrollmentManagement.js";
import ClassroomEnrollment from "../views/Admin/ClassroomEnrollment.js";
import AnnouncementManagement from "../views/Admin/AnnouncementManagement.js";
import StudentDirectory from "../views/Admin/StudentDirectory.js";
import CurriculumManagement from "../views/Admin/CurriculumManagement.js";
import GraduationManagement from "../views/Admin/GraduationManagement.js";
import ArchivingManagement from "../views/Admin/ArchivingManagement.js";
import UserProfile from "../views/Admin/UserProfile.js";

// تم تغيير اسم المصفوفة ليعكس محتواها بشكل أفضل
const adminRoutes = [
  {
    path: "/dashboard",
    name: "لوحة التحكم الرئيسية",
    icon: "nc-icon nc-chart-pie-35",
    component: Dashboard,
    layout: "/admin",
  },
  {
    path: "/users",
    name: "إدارة المستخدمين",
    icon: "nc-icon nc-circle-09",
    component: UserManagement,
    layout: "/admin",
  },
  {
    name: "إدارة المناهج",
    icon: "nc-icon nc-bullet-list-67",
    path: "/curriculum",
    layout: "/admin",
    children: [
      {
        path: "/programs",
        name: "البرامج الأكاديمية",
        icon: "nc-icon nc-notes",
        component: ProgramManagement,
        layout: "/admin",
      },
      {
        path: "/courses",
        name: "الدورات الدراسية",
        icon: "nc-icon nc-paper-2",
        component: CourseManagement,
        layout: "/admin",
      },
      {
        path: "/classrooms",
        name: "الفصول الدراسية",
        icon: "nc-icon nc-grid-45",
        component: ClassroomManagement,
        layout: "/admin",
      },
      {
        path: "/curriculum-management",
        name: " إدارة المناهج الاكاديمية",
        icon: "nc-icon nc-tv-2",
        component: CurriculumManagement,
        layout: "/admin",
      },
    ],
  },
  {
    name: "إدارة الطلاب",
    icon: "nc-icon nc-single-02",
    path: "/student-management",
    layout: "/admin",
    children: [
      {
        path: "/students",
        name: "دليل الطلاب",
        icon: "nc-icon nc-cctv",
        component: StudentDirectory,
        layout: "/admin",
      },
      {
        path: "/enrollments",
        name: "تسجيل البرامج",
        icon: "nc-icon nc-badge",
        component: EnrollmentManagement,
        layout: "/admin",
      },
      {
        path: "/classroom-enrollment",
        name: "تسجيل الفصول",
        icon: "nc-icon nc-vector",
        component: ClassroomEnrollment,
        layout: "/admin",
      },
    ],
  },
  {
    path: "/announcements",
    name: "إدارة الإعلانات",
    icon: "nc-icon nc-chat-round",
    component: AnnouncementManagement,
    layout: "/admin",
  },
  {
    name: "الخريجين والأرشفة",
    icon: "fa fa-certificate",
    path: "/advanced-functions",
    layout: "/admin",
    children: [
      {
        path: "/graduation",
        name: "إدارة التخرج",
        icon: "nc-icon nc-delivery-fast",
        component: GraduationManagement,
        layout: "/admin",
      },
      {
        path: "/archiving",
        name: "أرشفة الفصول",
        icon: "fa fa-folder-open",
        component: ArchivingManagement,
        layout: "/admin",
      },
    ],
  },
  {
    path: "/user-profile",
    name: "الحساب الشخصي",
    icon: "nc-icon nc-single-02",
    component: UserProfile,
    layout: "/admin",
  },
];

 export default adminRoutes;