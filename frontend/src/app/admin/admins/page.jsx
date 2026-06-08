"use client";

import React, { useEffect, useState } from "react";

import AdminLayout from "@/components/layout/AdminLayout";
import AdminGuard from "@/app/admin/AdminGuard.jsx";

import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modals";
import InputField from "@/components/ui/InputField";
import Alert from "@/components/ui/Conformation";

import { ShieldCheck } from "lucide-react";

import adminApi from "@/services/adminApi";

export default function Master() {

    // =========================
    // MENU LIST
    // =========================

    const menuList = [
        // {
        //     label: "Dashboard",
        //     key: "dashboard",
        // },
        {
            label: "Partners",
            key: "partners",
        },
        {
            label: "Master",
            key: "master_module",
        },
        {
            label: "Customer",
            key: "customer",
        },
        {
            label: "Inquiry",
            key: "inquiry",
        },
        {
            label: "Admin's",
            key: "admins",
        },
        {
            label: "Reviews",
            key: "reviews",
        },
        {
            label: "Subscription",
            key: "subscription",
        },
        {
            label: "Account",
            key: "account",
        },
        {
            label: "Content",
            key: "content",
        },
    ];

    // =========================
    // STATES
    // =========================

    const [admins, setAdmins] = useState([]);

    const [loading, setLoading] = useState(false);

    const [openModal, setOpenModal] = useState(false);

    const [editingAdmin, setEditingAdmin] = useState(null);

    const [permissionModal, setPermissionModal] = useState(false);

    const [selectedAdmin, setSelectedAdmin] = useState(null);

    const [selectedPermissions, setSelectedPermissions] = useState({});

    const [deleteModal, setDeleteModal] = useState({
        open: false,
        data: null,
    });

    const [alert, setAlert] = useState({
        open: false,
        type: "success",
        title: "",
        message: "",
    });

    // =========================
    // FORM STATE
    // =========================

    const initialForm = {
        firstName: "",
        lastName: "",
        designation: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        address: "",
    };

    const [formData, setFormData] = useState(initialForm);

    const [submitAttempted, setSubmitAttempted] = useState(false);

    // =========================
    // FETCH ADMINS
    // =========================

    const fetchAdmins = async () => {

        try {

            setLoading(true);

            const res = await adminApi.getAdmins();

            setAdmins(res.data.data || []);

        } catch (error) {

            console.log(error);

        } finally {

            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    // =========================
    // HANDLE INPUT
    // =========================

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // =========================
    // ADD
    // =========================

    const handleAdd = () => {

        setEditingAdmin(null);

        setFormData(initialForm);

        setSubmitAttempted(false);

        setOpenModal(true);
    };

    // =========================
    // EDIT
    // =========================

    const handleEdit = (row) => {

        setEditingAdmin(row);

        setFormData({
            firstName: row.first_name || "",
            lastName: row.last_name || "",
            designation: row.designation || "",
            email: row.email || "",
            phone: row.phone || "",
            password: "",
            confirmPassword: "",
            address: row.address || "",
        });

        setOpenModal(true);
    };

    // =========================
    // DELETE
    // =========================

    const handleDelete = (row) => {

        setDeleteModal({
            open: true,
            data: row,
        });
    };

    const confirmDelete = async () => {

        try {

            const row = deleteModal.data;

            await adminApi.deleteAdmin(row.id);

            fetchAdmins();

            setDeleteModal({
                open: false,
                data: null,
            });

            setAlert({
                open: true,
                type: "success",
                title: "Deleted",
                message: "Admin deleted successfully",
            });

        } catch (error) {

            console.log(error);
        }
    };

    // =========================
    // STATUS UPDATE
    // =========================

    const handleStatusToggle = async (row) => {

        try {

            const newStatus = row.status === 1 ? 0 : 1;

            await adminApi.updateStatus(
                row.id,
                newStatus
            );

            setAdmins((prev) =>
                prev.map((item) =>
                    item.id === row.id
                        ? {
                            ...item,
                            status: newStatus,
                        }
                        : item
                )
            );

            setAlert({
                open: true,
                type: "success",
                title: "Updated",
                message: `Admin ${newStatus ? "activated" : "deactivated"
                    } successfully`,
            });

        } catch (error) {

            console.log(error);
        }
    };

    // =========================
    // PERMISSION MODAL
    // =========================

    const handlePermission = async (row) => {

        try {

            setLoading(true);

            const res = await adminApi.getAdminPermissions(row.id);

            console.log("PERMISSION RESPONSE =>", res.data);

            const permissions = res?.data?.data || {};

            setSelectedAdmin(row);

            setSelectedPermissions({
                dashboard: Number(permissions.dashboard ?? 0),
                partners: Number(permissions.partners ?? 0),
                master_module: Number(permissions.master_module ?? 0),
                customer: Number(permissions.customer ?? 0),
                inquiry: Number(permissions.inquiry ?? 0),
                admins: Number(permissions.admins ?? 0),
                reviews: Number(permissions.reviews ?? 0),
                subscription: Number(permissions.subscription ?? 0),
                account: Number(permissions.account ?? 0),
                content: Number(permissions.content ?? 0),
            });

            setPermissionModal(true);

        } catch (error) {

            console.log(error);

            // ✅ IF PERMISSIONS NOT FOUND
            if (error?.response?.status === 404) {

                setSelectedAdmin(row);

                setSelectedPermissions({
                    dashboard: 0,
                    partners: 0,
                    master_module: 0,
                    customer: 0,
                    inquiry: 0,
                    admins: 0,
                    reviews: 0,
                    subscription: 0,
                    account: 0,
                    content: 0,
                });

                // ✅ OPEN EMPTY MODAL
                setPermissionModal(true);

            } else {

                setAlert({
                    open: true,
                    type: "error",
                    title: "Error",
                    message:
                        error?.response?.data?.message ||
                        "Something went wrong",
                });

            }

        } finally {

            setLoading(false);
        }
    };
    // =========================
    // TOGGLE PERMISSION
    // =========================

    const togglePermission = (key) => {

        setSelectedPermissions((prev) => ({
            ...prev,
            [key]: Number(prev[key]) === 1 ? 0 : 1,
        }));
    };

    // =========================
    // UPDATE PERMISSION
    // =========================

    const handleUpdatePermissions = async () => {

        try {

            if (!selectedAdmin) return;

            // API CALL
            await adminApi.updatePermissions(
                selectedAdmin.id || selectedAdmin.admin_id,
                selectedPermissions
            );

            // UPDATE LOCAL STATE
            const updatedAdmins = admins.map((item) =>
                item.id === (selectedAdmin.id || selectedAdmin.admin_id)
                    ? {
                        ...item,
                        dashboard: selectedPermissions.dashboard,
                        partners: selectedPermissions.partners,
                        master_module: selectedPermissions.master_module,
                        customer: selectedPermissions.customer,
                        inquiry: selectedPermissions.inquiry,
                        admins: selectedPermissions.admins,
                        reviews: selectedPermissions.reviews,
                        subscription: selectedPermissions.subscription,
                        account: selectedPermissions.account,
                        content: selectedPermissions.content,
                    }
                    : item
            );

            setAdmins(updatedAdmins);

            setPermissionModal(false);

            setSelectedAdmin(null);

            setSelectedPermissions({});

            setAlert({
                open: true,
                type: "success",
                title: "Permissions Updated",
                message: "Admin permissions updated successfully",
            });

        } catch (error) {

            console.log(error);

            setAlert({
                open: true,
                type: "error",
                title: "Error",
                message:
                    error?.response?.data?.message ||
                    "Something went wrong",
            });
        }
    };

    // =========================
    // VALIDATIONS
    // =========================

    const validateName = (name) => {
        return /^[A-Za-z\s]+$/.test(name);
    };

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // const validatePhone = (phone) => {
    //     return /^(?:[0-9]{10}|(?:\+1\s?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4})$/.test(phone);
    // };

    // =========================
    // SUBMIT
    // =========================

    const handleSubmit = async () => {

        try {

            setSubmitAttempted(true);

            // =========================
            // REQUIRED
            // =========================

            if (
                !formData.firstName ||
                !formData.lastName ||
                !formData.designation ||
                !formData.email ||
                !formData.phone
            ) {

                setAlert({
                    open: true,
                    type: "error",
                    title: "Validation Error",
                    message: "All fields are required",
                });

                return;
            }

            // =========================
            // NAME VALIDATION
            // =========================

            if (!validateName(formData.firstName)) {

                setAlert({
                    open: true,
                    type: "error",
                    title: "Invalid First Name",
                    message: "Only alphabets are allowed in first name",
                });

                return;
            }

            if (!validateName(formData.lastName)) {

                setAlert({
                    open: true,
                    type: "error",
                    title: "Invalid Last Name",
                    message: "Only alphabets are allowed in last name",
                });

                return;
            }

            // =========================
            // EMAIL VALIDATION
            // =========================

            if (!validateEmail(formData.email)) {

                setAlert({
                    open: true,
                    type: "error",
                    title: "Invalid Email",
                    message: "Please enter valid email address",
                });

                return;
            }

            // =========================
            // PHONE VALIDATION
            // =========================

            if (!formData.phone) {

                setAlert({
                    open: true,
                    type: "error",
                    title: "Invalid Mobile",
                    message: "Please enter valid number",
                });

                return;
            }

            // =========================
            // PASSWORD VALIDATION
            // =========================

            if (!editingAdmin) {

                if (
                    !formData.password ||
                    !formData.confirmPassword
                ) {

                    setAlert({
                        open: true,
                        type: "error",
                        title: "Validation Error",
                        message: "Password fields are required",
                    });

                    return;
                }

                if (formData.password.length < 6) {

                    setAlert({
                        open: true,
                        type: "error",
                        title: "Weak Password",
                        message: "Password must be at least 6 characters",
                    });

                    return;
                }

                if (
                    formData.password !==
                    formData.confirmPassword
                ) {

                    setAlert({
                        open: true,
                        type: "error",
                        title: "Password Error",
                        message: "Passwords do not match",
                    });

                    return;
                }
            }

            // =========================
            // CREATE
            // =========================

            if (!editingAdmin) {

                await adminApi.createAdmin(formData);

                setAlert({
                    open: true,
                    type: "success",
                    title: "Created",
                    message: "Admin created successfully",
                });
            }

            // =========================
            // UPDATE
            // =========================

            else {

                await adminApi.updateAdmin(
                    editingAdmin.id,
                    formData
                );

                setAlert({
                    open: true,
                    type: "success",
                    title: "Updated",
                    message: "Admin updated successfully",
                });
            }

            setOpenModal(false);

            setFormData(initialForm);

            fetchAdmins();

        } catch (error) {

            console.log(error);

            setAlert({
                open: true,
                type: "error",
                title: "Error",
                message:
                    error?.response?.data?.message ||
                    "Something went wrong",
            });
        }
    };

    // =========================
    // TABLE COLUMNS
    // =========================

    const columns = [
        {
            label: "First Name",
            key: "first_name",
        },
        {
            label: "Last Name",
            key: "last_name",
        },
        {
            label: "Email",
            key: "email",
        },
        {
            label: "Phone",
            key: "phone",
        },

        {
            label: "Designation",
            key: "designation",
        },
        {
            label: "Permissions",
            key: "permissions",
            render: (_, row) => (
                <button
                    onClick={() => handlePermission(row)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700"
                >
                    <ShieldCheck size={16} />
                    Manage
                </button>
            ),
        },
    ];

    return (
        <>
            <AdminGuard>
                <AdminLayout>

                    <div className="p-4">

                        <DataTable
                            title="Admin List"
                            columns={columns}
                            data={admins}
                            loading={loading}
                            onCreate={handleAdd}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            exportable={false}
                        />

                    </div>

                    {/* ADD / EDIT MODAL */}

                    <Modal
                        open={openModal}
                        onClose={() => setOpenModal(false)}
                        title={
                            editingAdmin
                                ? "Edit Admin"
                                : "Add Admin"
                        }
                        width="max-w-3xl"
                        footer={
                            <div className="flex justify-end gap-3">

                                <button
                                    onClick={() =>
                                        setOpenModal(false)
                                    }
                                    className="px-5 py-2 rounded-lg border"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleSubmit}
                                    className="px-5 py-2 rounded-lg bg-blue-600 text-white"
                                >
                                    {editingAdmin
                                        ? "Update"
                                        : "Submit"}
                                </button>

                            </div>
                        }
                    >

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                            <InputField
                                label="First Name"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                                submitAttempted={submitAttempted}
                            />

                            <InputField
                                label="Last Name"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                                submitAttempted={submitAttempted}
                            />

                            <InputField
                                label="Designation"
                                name="designation"
                                value={formData.designation}
                                onChange={handleChange}
                                required
                                submitAttempted={submitAttempted}
                            />

                            <InputField
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                submitAttempted={submitAttempted}
                            />

                            <InputField
                                label="Phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                submitAttempted={submitAttempted}
                            />

                            {!editingAdmin && (
                                <>
                                    <InputField
                                        label="Password"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        submitAttempted={submitAttempted}
                                    />

                                    <InputField
                                        label="Confirm Password"
                                        name="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        submitAttempted={submitAttempted}
                                    />
                                </>
                            )}

                        </div>

                    </Modal>

                    {/* DELETE ALERT */}

                    <Alert
                        open={deleteModal.open}
                        type="warning"
                        title="Delete Admin?"
                        message={`Are you sure you want to permanently delete ${deleteModal?.data?.first_name || ""
                            } ${deleteModal?.data?.last_name || ""
                            } ?`}
                        onClose={() =>
                            setDeleteModal({
                                open: false,
                                data: null,
                            })
                        }
                        onConfirm={confirmDelete}
                    />

                    {/* SUCCESS ALERT */}

                    <Alert
                        open={alert.open}
                        type={alert.type}
                        title={alert.title}
                        message={alert.message}
                        onClose={() =>
                            setAlert((prev) => ({
                                ...prev,
                                open: false,
                            }))
                        }
                    />

                    {/* PERMISSION MODAL */}

                    <Modal
                        open={permissionModal}
                        onClose={() => {
                            setPermissionModal(false);
                            setSelectedAdmin(null);
                            setSelectedPermissions({});
                        }}
                        title={`Manage Permissions - ${selectedAdmin?.first_name || ""
                            }`}
                        width="max-w-2xl"
                        footer={
                            <div className="flex justify-end gap-3">

                                <button
                                    onClick={() =>
                                        setPermissionModal(false)
                                    }
                                    className="px-5 py-2 rounded-lg border"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={
                                        handleUpdatePermissions
                                    }
                                    className="px-5 py-2 rounded-lg bg-blue-600 text-white"
                                >
                                    Update Permissions
                                </button>

                            </div>
                        }
                    >

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            {menuList.map((menu, index) => {

                                const selected =
                                    Number(selectedPermissions[menu.key]) === 1;

                                return (
                                    <button
                                        key={index}
                                        onClick={() =>
                                            togglePermission(
                                                menu.key
                                            )
                                        }
                                        className={`border rounded-xl px-4 py-3 text-left ${selected
                                            ? "border-blue-600 bg-blue-50"
                                            : "border-gray-200"
                                            }`}
                                    >

                                        <div className="flex items-center justify-between">

                                            <span>
                                                {menu.label}
                                            </span>

                                            <input
                                                type="checkbox"
                                                checked={selected}
                                                readOnly
                                            />

                                        </div>

                                    </button>
                                );
                            })}

                        </div>

                    </Modal>

                </AdminLayout>
            </AdminGuard>
        </>
    );
}