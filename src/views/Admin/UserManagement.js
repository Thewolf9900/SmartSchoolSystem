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
        if (loading) { return (<tr><td colSpan="7" className="text-center"><Spinner animation="border" /></td></tr>); }
        if (filteredUsers.length === 0) {
            if (searchQuery) { return (<tr><td colSpan="7" className="text-center">لا يوجد مستخدمون يطابقون بحثك.</td></tr>); }
            return (<tr><td colSpan="7" className="text-center">لا توجد بيانات لعرضها.</td></tr>);
        }
        return filteredUsers.map((user) => (
            <tr key={user.userId}>
                <td><Form.Check type="checkbox" checked={selectedUsers.includes(user.userId)} onChange={() => handleSelectUser(user.userId)} /></td>
                <td>{user.userId}</td>
                <td>{user.firstName}</td>
                <td>{user.lastName}</td>
                <td>{user.email}</td>
                <td>{roleIdToNameMap[user.role]}</td>
                <td>
                    <Button variant="warning" size="sm" className="ml-1" onClick={() => handleShowResetModal(user)} title="إعادة تعيين كلمة المرور">
                        <i className="fas fa-key"></i>
                    </Button>
                    <Button variant="info" size="sm" onClick={() => handleShowEditModal(user)}>
                        <i className="fas fa-edit"></i>
                    </Button>
                </td>
            </tr>
        ));
    };

    return (
        <>
            <Container fluid>
                <Row>
                    <Col md="12">
                        <Card className="str-table-with-hover">
                            <Card.Header>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div><Card.Title as="h4">إدارة المستخدمين</Card.Title><p className="card-category">عرض وتصفية المستخدمين في النظام</p></div>
                                </div>
                                <Row className="mt-3 align-items-center">
                                    <Col xs={12} md={4}><Form.Group className="mb-0"><Form.Control type="text" placeholder="ابحث بالاسم أو البريد الإلكتروني..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></Form.Group></Col>
                                    <Col xs={12} md={4}><ButtonGroup className="mr-2"><Button variant={filter === 'Students' ? 'primary' : 'outline-primary'} onClick={() => setFilter("Students")}>الطلاب</Button><Button variant={filter === 'Teachers' ? 'primary' : 'outline-primary'} onClick={() => setFilter("Teachers")}>المدرسون</Button></ButtonGroup></Col>
                                    <Col xs={12} md={4} className="d-flex justify-content-end">
                                        <Button variant="success" onClick={handleShowAddModal} className="mr-2"><i className="fas fa-plus mr-1"></i> إضافة مستخدم</Button>
                                        <Button variant="danger" disabled={selectedUsers.length === 0} onClick={handleDeleteSelected}><i className="fas fa-trash mr-1"></i> حذف المحدد</Button>
                                    </Col>
                                </Row>
                            </Card.Header>
                            <Card.Body className="table-full-width table-responsive px-0">
                                <Table className="table-hover">
                                    <thead><tr><th className="border-0" style={{ width: '5%' }}><Form.Check type="checkbox" onChange={handleSelectAll} checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length} /></th><th className="border-0">#</th><th className="border-0">الاسم الأول</th><th className="border-0">اسم العائلة</th><th className="border-0">البريد الإلكتروني</th><th className="border-0">الدور</th><th className="border-0">إجراءات</th></tr></thead>
                                    <tbody>{renderTableBody()}</tbody>
                                </Table>
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