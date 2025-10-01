import AvailablePrograms from "../views/Public/AvailablePrograms.js";
import ApplicantStatus from "../views/Public/ApplicantStatus.js";
import CertificateVerification from "../views/Public/CertificateVerification.js"; // 1. استيراد المكون الجديد

const publicRoutes = [
    {
        path: "/available-programs",
        name: "البرامج المتاحة",
        icon: "nc-icon nc-bullet-list-67",
        component: AvailablePrograms,
        layout: "/public",
    },
    {
        path: "/applicant-status",
        name: "حالة الطلب", // هذا المسار مخفي (لا يظهر في Navbar)
        component: ApplicantStatus,
        layout: "/public",
    },
     {
        path: "/verify-certificate",
        name: "فحص الشهادة",
        icon: "fas fa-certificate",  
        component: CertificateVerification,
        layout: "/public",
    },
];

export default publicRoutes;