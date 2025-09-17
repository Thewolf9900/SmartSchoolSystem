import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from 'react-toastify';
import {
  Button, Card, Table, Container, Row, Col, Form, Spinner, Badge
} from "react-bootstrap";

import {
  getClassroomsWithoutTeachers,
  getCoursesWithoutClassrooms,
  getCoursesWithoutCoordinators,
  getEnrollmentDeficiencies,
  getGraduatesPendingCertificate
} from "services/admin/reportService";
import { getStudents, getTeachers } from "services/admin/userService";
import { getPrograms } from "services/admin/programService";
import { getUnassignedStudents } from 'services/admin/studentManagementService';

// --- المكون المُحسَّن والقابل لإعادة الاستخدام ---
const ReportCard = ({ title, description, loading, data, renderRow, positiveMessage, colMd = "6" }) => {
  const renderContent = () => {
    if (loading) {
      return <tr><td className="text-center p-5"><Spinner /></td></tr>;
    }
    if (data.length > 0) {
      return data.map(renderRow);
    }
    return <tr><td><PositiveState message={positiveMessage} /></td></tr>;
  };

  return (
    <Col md={colMd} className="mb-4">
      <Card>
        <Card.Header>
          <Card.Title as="h4">{title}</Card.Title>
          <p className="card-category">{description}</p>
        </Card.Header>
        <Card.Body className="table-full-width table-responsive px-0">
          <Table className="table-hover">
            <tbody>
              {renderContent()}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Col>
  );
};

const PositiveState = ({ message }) => (
  <div className="text-center text-success p-3">
    <i className="nc-icon nc-check-2" style={{ fontSize: '1.5rem' }}></i>
    <p className="mt-2 mb-0" style={{ fontSize: '0.9rem' }}>{message}</p>
  </div>
);


function Dashboard() {
  const [coursesWithoutCoordinatorReport, setCoursesWithoutCoordinatorReport] = useState([]);
  const [stats, setStats] = useState({ students: "...", teachers: "...", programs: "..." });
  const [loadingStats, setLoadingStats] = useState(true);
  const [classroomsReport, setClassroomsReport] = useState([]);
  const [coursesReport, setCoursesReport] = useState([]);
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [pendingCertificates, setPendingCertificates] = useState([]);
  const [deficiencyReport, setDeficiencyReport] = useState(null);
  const [programsForFilter, setProgramsForFilter] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [loadingDeficiency, setLoadingDeficiency] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const [studentsRes, teachersRes, programsRes] = await Promise.all([
          getStudents(), getTeachers(), getPrograms(),
        ]);
        setStats({
          students: studentsRes.data.length,
          teachers: teachersRes.data.length,
          programs: programsRes.data.length,
        });
        setProgramsForFilter(programsRes.data);
        if (programsRes.data.length > 0) {
          setSelectedProgram(programsRes.data[0].academicProgramId);
        }
      } catch (error) { toast.error("فشل في جلب الإحصائيات الرئيسية."); }
      finally { setLoadingStats(false); }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      setLoadingReports(true);
      try {
        const [classroomsRes, coursesRes, unassignedStudentsRes, pendingCertificatesRes, coursesWithoutCoordinatorRes] = await Promise.all([
          getClassroomsWithoutTeachers(),
          getCoursesWithoutClassrooms(),
          getUnassignedStudents(),
          getGraduatesPendingCertificate(),
          getCoursesWithoutCoordinators()
        ]);
        setClassroomsReport(classroomsRes.data);
        setCoursesReport(coursesRes.data);
        setUnassignedStudents(unassignedStudentsRes.data);
        setPendingCertificates(pendingCertificatesRes.data);
        setCoursesWithoutCoordinatorReport(coursesWithoutCoordinatorRes.data);
      } catch (error) { toast.error("فشل في جلب بعض التقارير التشغيلية."); }
      finally { setLoadingReports(false); }
    };
    fetchReports();
  }, []);

  const handleFetchDeficiencyReport = async () => {
    if (!selectedProgram) { toast.warn("الرجاء اختيار برنامج أولاً."); return; }
    setLoadingDeficiency(true);
    setDeficiencyReport(null);
    try {
      const response = await getEnrollmentDeficiencies(selectedProgram);
      setDeficiencyReport(response.data);
    } catch (error) { toast.error("فشل في جلب تقرير النواقص."); }
    finally { setLoadingDeficiency(false); }
  };

  return (
    <>
      <Container fluid>
        {/* --- القسم الأول: بطاقات الإحصائيات --- */}
        <Row>
          <Col lg="3" sm="6"><Link to="/admin/users?filter=Students" style={{ textDecoration: 'none' }}>
          <Card className="card-stats"><Card.Body><Row><Col xs="5"><div className="icon-big text-center"><i className="fas fa-users text-info text-warning"></i></div></Col><Col xs="7"><div className="numbers"><p className="card-category">إجمالي الطلاب</p><Card.Title as="h4">{loadingStats ? <Spinner size="sm" /> : stats.students}</Card.Title></div></Col></Row></Card.Body><Card.Footer><hr /><div className="stats"><i className="fas fa-redo mr-1"></i>عرض التفاصيل</div></Card.Footer></Card></Link></Col>
          <Col lg="3" sm="6"><Link to="/admin/users?filter=Teachers" style={{ textDecoration: 'none' }}><Card className="card-stats"><Card.Body><Row><Col xs="5"><div className="icon-big text-center"><i className="nc-icon nc-badge text-success"></i></div></Col><Col xs="7"><div className="numbers"><p className="card-category">إجمالي المدرسين</p><Card.Title as="h4">{loadingStats ? <Spinner size="sm" /> : stats.teachers}</Card.Title></div></Col></Row></Card.Body><Card.Footer><hr /><div className="stats"><i className="fas fa-redo mr-1"></i>عرض التفاصيل</div></Card.Footer></Card></Link></Col>
          <Col lg="3" sm="6"><Link to="/admin/programs" style={{ textDecoration: 'none' }}><Card className="card-stats"><Card.Body><Row><Col xs="5"><div className="icon-big text-center"><i className="nc-icon nc-notes text-danger"></i></div></Col><Col xs="7"><div className="numbers"><p className="card-category">البرامج المتاحة</p><Card.Title as="h4">{loadingStats ? <Spinner size="sm" /> : stats.programs}</Card.Title></div></Col></Row></Card.Body><Card.Footer><hr /><div className="stats"><i className="fas fa-redo mr-1"></i>عرض التفاصيل</div></Card.Footer></Card></Link></Col>
          <Col lg="3" sm="6"><Card className="card-stats"><Card.Body><Row><Col xs="5"><div className="icon-big text-center"><i className="nc-icon nc-paper-2 text-info"></i></div></Col><Col xs="7"><div className="numbers"><p className="card-category">شهادات معلقة</p><Card.Title as="h4">{loadingReports ? <Spinner size="sm" /> : pendingCertificates.length}</Card.Title></div></Col></Row></Card.Body><Card.Footer><hr /><div className="stats text-info"><i className="fas fa-info-circle mr-1"></i>انظر التقرير أدناه</div></Card.Footer></Card></Col>
        </Row>
        <Row>
          <Col lg="3" sm="6"><Card className="card-stats"><Card.Body><Row><Col xs="5"><div className="icon-big text-center"><i className="nc-icon nc-single-02 text-primary"></i></div></Col><Col xs="7"><div className="numbers"><p className="card-category">طلاب بلا برنامج</p><Card.Title as="h4">{loadingReports ? <Spinner size="sm" /> : unassignedStudents.length}</Card.Title></div></Col></Row></Card.Body><Card.Footer><hr /><div className="stats text-primary"><i className="fas fa-info-circle mr-1"></i>انظر التقرير أدناه</div></Card.Footer></Card></Col>
          <Col lg="3" sm="6"><Card className="card-stats"><Card.Body><Row><Col xs="5"><div className="icon-big text-center"><i className="fas fa-chalkboard-teacher text-danger"></i></div></Col><Col xs="7"><div className="numbers"><p className="card-category">فصول بلا مدرسين</p><Card.Title as="h4">{loadingReports ? <Spinner size="sm" /> : classroomsReport.length}</Card.Title></div></Col></Row></Card.Body><Card.Footer><hr /><div className="stats text-danger"><i className="fas fa-info-circle mr-1"></i>انظر التقرير أدناه</div></Card.Footer></Card></Col>
          <Col lg="3" sm="6"><Card className="card-stats"><Card.Body><Row><Col xs="5"><div className="icon-big text-center"><i className="fas fa-school text-warning"></i></div></Col><Col xs="7"><div className="numbers"><p className="card-category">دورات بلا فصول</p><Card.Title as="h4">{loadingReports ? <Spinner size="sm" /> : coursesReport.length}</Card.Title></div></Col></Row></Card.Body><Card.Footer><hr /><div className="stats text-warning"><i className="fas fa-info-circle mr-1"></i>انظر التقرير أدناه</div></Card.Footer></Card></Col>
          <Col lg="3" sm="6"><Card className="card-stats"><Card.Body><Row><Col xs="5"><div className="icon-big text-center"><i className="fas fa-user-tie text-secondary"></i></div></Col><Col xs="7"><div className="numbers"><p className="card-category">دورات بلا منسق</p><Card.Title as="h4">{loadingReports ? <Spinner size="sm" /> : coursesWithoutCoordinatorReport.length}</Card.Title></div></Col></Row></Card.Body><Card.Footer><hr /><div className="stats text-secondary"><i className="fas fa-info-circle mr-1"></i>انظر التقرير أدناه</div></Card.Footer></Card></Col>
        </Row>

        {/* --- القسم الثاني: التقارير التشغيلية (بشكل شبكي منظم) --- */}
        <Row>
          <ReportCard
            title="دورات بدون منسق"
            description="دورات لم يتم تعيين مدرس مسؤول لها"
            loading={loadingReports}
            data={coursesWithoutCoordinatorReport}
            positiveMessage="كل الدورات لديها منسقين."
            renderRow={(c) => (
              <tr key={c.courseId}>
                <td>{c.name} <small className="text-muted">({c.academicProgramName})</small></td>
                <td className="td-actions text-right"><Button as={Link} to={`/admin/courses?programId=${c.academicProgramId}`} variant="warning" size="sm">تعيين</Button></td>
              </tr>
            )}
          />
          <ReportCard
            title="فصول بدون مدرسين"
            description="فصول دراسية تتطلب تعيين مدرس"
            loading={loadingReports}
            data={classroomsReport}
            positiveMessage="كل الفصول لديها مدرسين."
            renderRow={(c) => (
              <tr key={c.classroomId}>
                <td>{c.name} <small className="text-muted">({c.courseName})</small></td>
                <td className="td-actions text-right"><Button as={Link} to="/admin/classrooms" variant="info" size="sm">تعيين</Button></td>
              </tr>
            )}
          />
          <ReportCard
            title="دورات بدون فصول"
            description="دورات لم يتم إنشاء فصول دراسية لها"
            loading={loadingReports}
            data={coursesReport}
            positiveMessage="كل الدورات لديها فصول."
            renderRow={(c) => (
              <tr key={c.courseId}>
                <td>{c.name} <small className="text-muted">({c.academicProgramName})</small></td>
                <td className="td-actions text-right"><Button as={Link} to="/admin/classrooms" variant="success" size="sm">إنشاء فصل</Button></td>
              </tr>
            )}
          />
          <ReportCard
            title="طلاب غير ملتحقين ببرنامج"
            description="طلاب جدد بحاجة إلى تسجيل في برنامج"
            loading={loadingReports}
            data={unassignedStudents}
            positiveMessage="جميع الطلاب ملتحقون ببرامج."
            renderRow={(s) => (
              <tr key={s.userId}>
                <td>{s.firstName} {s.lastName} <small className="text-muted d-block">{s.email}</small></td>
                <td className="td-actions text-right"><Button as={Link} to="/admin/enrollments" variant="primary" size="sm">التحاق</Button></td>
              </tr>
            )}
          />
        </Row>

        {/* --- القسم الثالث: تقارير معقدة (بعرض كامل) --- */}
        <Row>
          <Col md="12"><Card><Card.Header><Card.Title as="h4">تقرير نواقص التسجيل</Card.Title><p className="card-category">عرض الطلاب الذين لم يسجلوا في جميع دورات برنامجهم</p></Card.Header><Card.Body><Row className="align-items-center p-2 bg-light rounded"><Col md="8"><Form.Select size="sm" value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)}>{programsForFilter.map(p => (<option key={p.academicProgramId} value={p.academicProgramId}>{p.name}</option>))}</Form.Select></Col><Col md="4" className="mt-2 mt-md-0"><Button className="w-100" variant="primary" onClick={handleFetchDeficiencyReport} disabled={loadingDeficiency}>{loadingDeficiency ? <Spinner size="sm" /> : <><i className="fas fa-search mr-1"></i> بحث</>}</Button></Col></Row>{loadingDeficiency && <div className="text-center p-5"><Spinner /></div>}{deficiencyReport && (<div className="table-full-width table-responsive px-0 mt-3"><Table><tbody>{deficiencyReport.studentsWithDeficiencies.length > 0 ? (deficiencyReport.studentsWithDeficiencies.map(s => (<tr key={s.studentId}><td>{s.studentName}</td><td>{s.missingCourses.map(c => (<Badge bg="danger" className="mx-1" key={c.courseId}>{c.courseName}</Badge>))}</td><td className="td-actions text-right"><Button as={Link} to="/admin/classroom-enrollment" variant="warning" size="sm">تسجيل</Button></td></tr>))) : (<tr><td colSpan="3"><PositiveState message="لا توجد نواقص تسجيل في هذا البرنامج." /></td></tr>)}</tbody></Table></div>)}</Card.Body></Card></Col>
        </Row>
        <Row>
          <Col md="12">
            <Card>
              <Card.Header><Card.Title as="h4">خريجون بانتظار رفع الشهادة</Card.Title><p className="card-category">قائمة بالخريجين الذين لم يتم رفع شهاداتهم بعد.</p></Card.Header>
              <Card.Body className="table-full-width table-responsive px-0">
                <Table>
                  <thead><tr><th>الاسم الكامل</th><th>البرنامج</th><th>تاريخ التخرج</th><th className="text-right">الإجراء</th></tr></thead>
                  <tbody>
                    {loadingReports ? (<tr><td colSpan="4" className="text-center"><Spinner /></td></tr>)
                      : pendingCertificates.length > 0 ? (
                        pendingCertificates.map(g => (
                          <tr key={g.graduationId}>
                            <td>{g.firstName} {g.lastName}</td>
                            <td>{g.programName}</td>
                            <td>{new Date(g.graduationDate).toLocaleDateString()}</td>
                            <td className="td-actions text-right"><Button as={Link} to="/admin/graduation" variant="success" size="sm">رفع الشهادة</Button></td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="4"><PositiveState message="جميع الخريجين لديهم شهادات مرفوعة." /></td></tr>
                      )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default Dashboard;