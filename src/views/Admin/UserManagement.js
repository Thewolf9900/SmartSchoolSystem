// src/views/UserManagement.js

import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getStudents, getTeachers, createUser, updateUser, deleteUser, resetUserPassword } from "services/admin/userService";
import { getUserRoles } from "services/admin/optionsService";
import { toast } from 'react-toastify';

import {
    Card,
    Table,
    Container,
    Row,
    Col,
    Button,
    ButtonGroup,
    Spinner,
    Modal,
    Form,
    Badge
} from "react-bootstrap";

const roleNameToIdMap = {
    "Administrator": 0,
    "Teacher": 1,
    "Student": 2
};
const roleIdToNameMap = {
    0: "Administrator",
    1: "Teacher",
    2: "Student"
};


function useQuery() {
    return new URLSearchParams(useLocation().search);
}

function UserManagement() {
    const query = useQuery();
    const initialFilter = query.get("filter") || "Students";

    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState(initialFilter);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const [showAddModal, setShowAddModal] = useState(false);
    const [newUser, setNewUser] = useState({ firstName: "", lastName: "", email: "", password: "", nationalId: "", role: "Student" });

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const [roles, setRoles] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);

    // States for Reset Password Modal
    const [showResetModal, setShowResetModal] = useState(false);
    const [selectedUserForReset, setSelectedUserForReset] = useState(null);
    const [resetData, setResetData] = useState({ nationalId: '', newPassword: '' });
    const [isResetting, setIsResetting] = useState(false);


    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const rolesResponse = await getUserRoles();
                setRoles(rolesResponse.data);
            } catch (error) {
                toast.error("فشل في تحميل قائمة الأدوار.");
            }
        };
        loadInitialData();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        setSelectedUsers([]);
        setSearchQuery("");
        try {
            const response = filter === "Students" ? await getStudents() : await getTeachers();
            setUsers(response.data || []);
        } catch (error) {
            toast.error("فشل في جلب قائمة المستخدمين.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [filter]);


    const handleShowAddModal = () => {
        setNewUser({ firstName: "", lastName: "", email: "", password: "", nationalId: "", role: "Student" });
        setShowAddModal(true);
    };
    const handleCloseAddModal = () => setShowAddModal(false);

    const handleNewUserInputChange = (e) => {
        setNewUser({ ...newUser, [e.target.name]: e.target.value });
    };

    const handleAddFormSubmit = async () => {
        const payload = { ...newUser, role: roleNameToIdMap[newUser.role] };
        if (payload.role === undefined) {
            toast.error("يرجى تحديد دور صحيح.");
            return;
        }
        try {
            await createUser(payload);
            toast.success("تم إنشاء المستخدم بنجاح!");
            handleCloseAddModal();
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || "فشل في إنشاء المستخدم.");
        }
    };

    const handleShowEditModal = (user) => {
        setEditingUser({ ...user, role: roleIdToNameMap[user.role] });
        setShowEditModal(true);
    };
    const handleCloseEditModal = () => setShowEditModal(false);

    const handleEditUserInputChange = (e) => {
        setEditingUser({ ...editingUser, [e.target.name]: e.target.value });
    };

    const handleEditFormSubmit = async () => {
        const payload = { ...editingUser, role: roleNameToIdMap[editingUser.role] };
        delete payload.password_hash;
        if (payload.role === undefined) {
            toast.error("يرجى تحديد دور صحيح.");
            return;
        }
        try {
            await updateUser(payload.userId, payload);
            toast.success("تم تحديث المستخدم بنجاح!");
            handleCloseEditModal();
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || "فشل في تحديث المستخدم.");
        }
    };

    const handleSelectUser = (userId) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    const filteredUsers = users.filter(user =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allUserIds = filteredUsers.map(user => user.userId);
            setSelectedUsers(allUserIds);
        } else {
            setSelectedUsers([]);
        }
    };

    const handleDeleteSelected = async () => {
        const confirmDelete = window.confirm(`هل أنت متأكد من رغبتك في حذف ${selectedUsers.length} مستخدم؟`);
        if (confirmDelete) {
            setLoading(true);
            const deletePromises = selectedUsers.map(userId => deleteUser(userId));
            try {
                await Promise.all(deletePromises);
                toast.success(`تم حذف ${selectedUsers.length} مستخدم بنجاح!`);
                fetchUsers();
            } catch (error) {
                toast.error(`فشل حذف بعض المستخدمين. ${error.response?.data || ''}`);
                setLoading(false);
            }
        }
    };

    // --- Control functions for the new Reset Password Modal ---
    const handleShowResetModal = (user) => {
        setSelectedUserForReset(user);
        setResetData({ nationalId: user.nationalId, newPassword: '' });
        setShowResetModal(true);
    };
    const handleCloseResetModal = () => setShowResetModal(false);
    const handleResetPasswordChange = (e) => {
        setResetData({ ...resetData, newPassword: e.target.value });
    };
    const handleResetPasswordSubmit = async (e) => {
        e.preventDefault();
        if (!resetData.newPassword) {
            toast.error("الرجاء إدخال كلمة المرور الجديدة.");
            return;
        }
        setIsResetting(true);
        try {
            await resetUserPassword(selectedUserForReset.userId, {
                nationalId: resetData.nationalId,
                newPassword: resetData.newPassword
            });
            toast.success(`تم إعادة تعيين كلمة مرور ${selectedUserForReset.firstName} بنجاح!`);
            handleCloseResetModal();
        } catch (error) {
            toast.error(error.response?.data || "فشل في إعادة تعيين كلمة المرور.");
        } finally {
            setIsResetting(false);
        }
    };

    const renderTableBody = () => {
        if (loading) { return (<tr><td colSpan="5" className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>); }
        if (filteredUsers.length === 0) {
            if (searchQuery) { return (<tr><td colSpan="5" className="text-center py-5"><div className="text-muted"><i className="fas fa-search fa-2x mb-3 d-block"></i>لا يوجد مستخدمون يطابقون بحثك.</div></td></tr>); }
            return (<tr><td colSpan="5" className="text-center py-5"><div className="text-muted"><i className="fas fa-users-slash fa-2x mb-3 d-block"></i>لا توجد بيانات لعرضها.</div></td></tr>);
        }
        return filteredUsers.map((user) => (
            <tr key={user.userId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td className="pl-4 align-middle" style={{ width: '50px' }}>
                    <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.userId)}
                        onChange={() => handleSelectUser(user.userId)}
                        style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                    />
                </td>
                <td className="align-middle">
                    <div className="d-flex align-items-center">
                        <div className="rounded-circle d-flex align-items-center justify-content-center mr-3 flex-shrink-0 shadow-sm" style={{ width: '40px', height: '40px', backgroundColor: '#f8f9fa', color: '#6c757d' }}>
                            <i className="fas fa-user"></i>
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <span className="font-weight-bold text-dark d-block text-truncate" style={{ maxWidth: '200px' }}>{user.firstName} {user.lastName}</span>
                            <small className="text-muted">#{user.userId}</small>
                        </div>
                    </div>
                </td>
                <td className="align-middle">{user.email}</td>
                <td className="text-right pr-4 align-middle">
                    <Button
                        variant="outline-warning"
                        size="sm"
                        className="mx-1 rounded"
                        onClick={() => handleShowResetModal(user)}
                        title="إعادة تعيين كلمة المرور"
                        style={{ width: '35px', height: '35px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <i className="fas fa-key"></i>
                    </Button>
                    <Button
                        variant="outline-info"
                        size="sm"
                        className="mx-1 rounded"
                        onClick={() => handleShowEditModal(user)}
                        title="تعديل"
                        style={{ width: '35px', height: '35px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <i className="fas fa-pen"></i>
                    </Button>
                </td>
            </tr>
        ));
    };

    const renderMobileCards = () => {
        if (loading) { return (<div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>); }
        if (filteredUsers.length === 0) { return (<div className="text-center py-5 text-muted">لا توجد بيانات.</div>); }
        return filteredUsers.map((user) => (
            <Card key={user.userId} className="mb-3 border shadow-sm">
                <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center">
                            <input
                                type="checkbox"
                                checked={selectedUsers.includes(user.userId)}
                                onChange={() => handleSelectUser(user.userId)}
                                className="mr-2"
                                style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                            />
                            <div className="rounded-circle d-flex align-items-center justify-content-center mr-2 shadow-sm" style={{ width: '35px', height: '35px', backgroundColor: '#f8f9fa', color: '#6c757d' }}>
                                <i className="fas fa-user"></i>
                            </div>
                            <div>
                                <h6 className="font-weight-bold mb-0 text-dark">{user.firstName} {user.lastName}</h6>
                                <small className="text-muted">{user.userId}</small>
                            </div>
                        </div>
                        <Badge bg={user.role === 1 ? 'primary' : 'info'} className="px-2 py-1">{roleIdToNameMap[user.role]}</Badge>
                    </div>
                    <div className="mb-3 text-muted small border-bottom pb-2">
                        <i className="fas fa-envelope mr-2"></i> {user.email}
                    </div>

                    <div className="d-flex justify-content-end pt-2">
                        <Button variant="outline-warning" size="sm" className="ml-2 rounded" onClick={() => handleShowResetModal(user)}>
                            <i className="fas fa-key mr-1"></i> تعيين كلمة المرور
                        </Button>
                        <Button variant="outline-info" size="sm" className="rounded" onClick={() => handleShowEditModal(user)}>
                            <i className="fas fa-pen mr-1"></i> تعديل
                        </Button>
                    </div>
                </Card.Body>
            </Card>
        ));
    };

    return (
        <>
            <Container fluid>
                <Row>
                    <Col md="12">
                        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '15px' }}>
                            <Card.Header className="bg-white p-4 border-0" style={{ borderRadius: '15px 15px 0 0' }}>
                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
                                    <div>
                                        <h4 className="font-weight-bold mb-1" style={{ color: '#2c3e50' }}>إدارة المستخدمين</h4>
                                        <p className="text-muted mb-0 small">عرض وتصفية المستخدمين (المدرسين والطلاب) في النظام</p>
                                    </div>
                                    <div className="mt-3 mt-md-0">
                                        <Button variant="danger" className="ml-2 shadow-sm btn-fill rounded-pill" disabled={selectedUsers.length === 0} onClick={handleDeleteSelected}>
                                            <i className="fas fa-trash mr-2"></i> حذف المحدد ({selectedUsers.length})
                                        </Button>
                                        <Button variant="success" className="shadow-sm btn-fill rounded-pill" onClick={handleShowAddModal}>
                                            <i className="fas fa-user-plus mr-2"></i> إضافة مستخدم جديد
                                        </Button>
                                    </div>
                                </div>

                                <Row className="align-items-center bg-light p-3 rounded mx-0">
                                    <Col md={6} lg={5} className="mb-3 mb-md-0">
                                        <div className="position-relative">
                                            <i className="fas fa-search position-absolute text-muted" style={{ top: '50%', right: '15px', transform: 'translateY(-50%)', zIndex: 10 }}></i>
                                            <Form.Control
                                                type="text"
                                                placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-3 pr-5 shadow-sm border-0"
                                                style={{ borderRadius: '50px', height: '45px' }}
                                            />
                                        </div>
                                    </Col>
                                    <Col md={6} lg={7} className="d-flex justify-content-md-end">
                                        <div className="bg-white rounded-pill shadow-sm p-1 d-inline-flex">
                                            <Button
                                                variant={filter === 'Students' ? 'primary' : 'transparent'}
                                                className={`px-4 py-2 ${filter === 'Students' ? 'font-weight-bold shadow-sm' : 'text-muted'}`}
                                                onClick={() => setFilter("Students")}
                                                style={{ borderRadius: '50px', border: 'none', transition: 'all 0.3s' }}
                                            >
                                                <i className="fas fa-user-graduate mr-2"></i> الطلاب
                                            </Button>
                                            <Button
                                                variant={filter === 'Teachers' ? 'primary' : 'transparent'}
                                                className={`px-4 py-2 ${filter === 'Teachers' ? 'font-weight-bold shadow-sm' : 'text-muted'}`}
                                                onClick={() => setFilter("Teachers")}
                                                style={{ borderRadius: '50px', border: 'none', transition: 'all 0.3s' }}
                                            >
                                                <i className="fas fa-chalkboard-teacher mr-2"></i> المدرسون
                                            </Button>
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Header>
                            <Card.Body className="px-0">
                                <div className="d-none d-md-block table-responsive">
                                    <Table className="table-hover mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="border-0 pl-4 align-middle" style={{ width: '50px' }}>
                                                    <input
                                                        type="checkbox"
                                                        onChange={handleSelectAll}
                                                        checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                                                        style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                                                    />
                                                </th>
                                                <th className="border-0 py-3 text-muted small font-weight-bold align-middle">المستخدم</th>
                                                <th className="border-0 py-3 text-muted small font-weight-bold align-middle">البريد الإلكتروني</th>
                                                <th className="border-0 py-3 text-muted small font-weight-bold text-right pr-4 align-middle">إجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody>{renderTableBody()}</tbody>
                                    </Table>
                                </div>
                                <div className="d-md-none p-3 bg-light">
                                    <div className="d-flex align-items-center mb-3 bg-white p-3 rounded shadow-sm border">
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                                            style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                                            className="mx-3"
                                        />
                                        <span className="font-weight-bold">تحديد الكل</span>
                                    </div>
                                    {renderMobileCards()}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>

            <Modal show={showAddModal} onHide={handleCloseAddModal} centered>
                <Modal.Header closeButton><Modal.Title>إنشاء مستخدم جديد</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row><Col><Form.Group><Form.Label>الاسم الأول</Form.Label><Form.Control type="text" name="firstName" onChange={handleNewUserInputChange} required /></Form.Group></Col><Col><Form.Group><Form.Label>اسم العائلة</Form.Label><Form.Control type="text" name="lastName" onChange={handleNewUserInputChange} required /></Form.Group></Col></Row>
                        <Form.Group><Form.Label>الرقم الوطني</Form.Label><Form.Control type="text" name="nationalId" onChange={handleNewUserInputChange} required /></Form.Group>
                        <Form.Group><Form.Label>البريد الإلكتروني</Form.Label><Form.Control type="email" name="email" onChange={handleNewUserInputChange} required /></Form.Group>
                        <Form.Group><Form.Label>كلمة المرور</Form.Label><Form.Control type="password" name="password" onChange={handleNewUserInputChange} required /></Form.Group>
                        <Form.Group><Form.Label>الدور</Form.Label><Form.Control as="select" name="role" value={newUser.role} onChange={handleNewUserInputChange}>{roles.length > 0 ? roles.filter(role => role !== "Administrator").map(role => <option key={role} value={role}>{role}</option>) : <option>جاري تحميل الأدوار...</option>}</Form.Control></Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={handleCloseAddModal}>إلغاء</Button><Button variant="primary" onClick={handleAddFormSubmit}>حفظ المستخدم</Button></Modal.Footer>
            </Modal>

            {editingUser && (
                <Modal show={showEditModal} onHide={handleCloseEditModal} centered>
                    <Modal.Header closeButton><Modal.Title>تعديل بيانات: {editingUser.firstName} {editingUser.lastName}</Modal.Title></Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Row><Col><Form.Group><Form.Label>الاسم الأول</Form.Label><Form.Control type="text" name="firstName" value={editingUser.firstName} onChange={handleEditUserInputChange} required /></Form.Group></Col><Col><Form.Group><Form.Label>اسم العائلة</Form.Label><Form.Control type="text" name="lastName" value={editingUser.lastName} onChange={handleEditUserInputChange} required /></Form.Group></Col></Row>
                            <Form.Group><Form.Label>الرقم الوطني</Form.Label><Form.Control type="text" name="nationalId" value={editingUser.nationalId} onChange={handleEditUserInputChange} required /></Form.Group>
                            <Form.Group><Form.Label>البريد الإلكتروني</Form.Label><Form.Control type="email" name="email" value={editingUser.email} onChange={handleEditUserInputChange} required /></Form.Group>
                            <Form.Group><Form.Label>الدور</Form.Label><Form.Control as="select" name="role" value={editingUser.role} onChange={handleEditUserInputChange}>{roles.filter(role => role !== "Administrator").map(role => <option key={role} value={role}>{role}</option>)}</Form.Control></Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer><Button variant="secondary" onClick={handleCloseEditModal}>إلغاء</Button><Button variant="primary" onClick={handleEditFormSubmit}>حفظ التعديلات</Button></Modal.Footer>
                </Modal>
            )}

            {selectedUserForReset && (
                <Modal show={showResetModal} onHide={handleCloseResetModal} centered>
                    <Form onSubmit={handleResetPasswordSubmit}>
                        <Modal.Header closeButton>
                            <Modal.Title>إعادة تعيين كلمة مرور لـ: {selectedUserForReset.firstName}</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <p className="text-muted">الرقم الوطني يستخدم للتأكيد فقط.</p>
                            <Form.Group className="mb-3">
                                <Form.Label>الرقم الوطني</Form.Label>
                                <Form.Control type="text" name="nationalId" value={resetData.nationalId} readOnly className="bg-light" />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>كلمة المرور الجديدة <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="password" name="newPassword" value={resetData.newPassword} onChange={handleResetPasswordChange} placeholder="أدخل كلمة المرور الجديدة" required autoFocus />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleCloseResetModal}>إلغاء</Button>
                            <Button variant="primary" type="submit" disabled={isResetting}>
                                {isResetting ? <Spinner as="span" size="sm" /> : "حفظ كلمة المرور"}
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal>
            )}
        </>
    );
}

export default UserManagement;