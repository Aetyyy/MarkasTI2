"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { appAlertCompat as Swal } from "@/libs/alertCompat";
import { useRouter } from "next/navigation";
import { createClientId } from "@/libs/clientId";
import {
  RiAddLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCheckboxCircleLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiEditBoxLine,
  RiEyeLine,
  RiLoader4Line,
  RiRefreshLine,
  RiSearch2Line,
  RiShieldKeyholeLine,
} from "react-icons/ri";
import {
  deleteRoleAction,
  saveRoleWithPermissionsAction,
} from "@/libs/roles/action";
import type {
  PermissionScopeOption,
  RoleWithPermissionsForClient,
} from "@/types/roleManagement";

type PermissionKey = "create" | "read" | "update" | "delete";
type RightsPreset = "read" | "manage" | "full";

type SortKey = "name" | "permission" | "rights" | "totalPermission";
type SortDirection = "asc" | "desc";

type SortConfig = {
  key: SortKey;
  direction: SortDirection;
};

type PermissionItem = {
  key: PermissionKey;
  title: string;
  description: string;
  icon: ReactNode;
};

type ScopeForm = {
  uid: string;
  scopeId: string;
  name: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
};

interface RoleManagementProps {
  initialRoles: RoleWithPermissionsForClient[];
  initialPermissionScopes: PermissionScopeOption[];
  access: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
}

const ITEMS_PER_PAGE = 8;

const rightsPresets: Record<RightsPreset, Pick<ScopeForm, PermissionKey>> = {
  read: { create: false, read: true, update: false, delete: false },
  manage: { create: true, read: true, update: true, delete: false },
  full: { create: true, read: true, update: true, delete: true },
};

const permissionItems: PermissionItem[] = [
  {
    key: "create",
    title: "Create",
    description: "Boleh menambahkan data baru.",
    icon: <RiAddLine />,
  },
  {
    key: "read",
    title: "Read",
    description: "Boleh melihat dan membaca data.",
    icon: <RiEyeLine />,
  },
  {
    key: "update",
    title: "Update",
    description: "Boleh mengubah data yang sudah ada.",
    icon: <RiEditBoxLine />,
  },
  {
    key: "delete",
    title: "Delete",
    description: "Boleh menghapus data.",
    icon: <RiDeleteBinLine />,
  },
];

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100";

const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

function getPermissionText(role: RoleWithPermissionsForClient) {
  if (role.permissions.length === 0) return "tanpa_permission";

  return role.permissions.map((permission) => permission.name).join(", ");
}

function getRights(role: RoleWithPermissionsForClient) {
  const rights: Record<PermissionKey, boolean> = {
    create: false,
    read: false,
    update: false,
    delete: false,
  };

  role.permissions.forEach((permission) => {
    if (permission.create) rights.create = true;
    if (permission.read) rights.read = true;
    if (permission.update) rights.update = true;
    if (permission.delete) rights.delete = true;
  });

  return rights;
}

function getRightsCount(role: RoleWithPermissionsForClient) {
  const rights = getRights(role);

  return Object.values(rights).filter(Boolean).length;
}

function getScopeRightsCount(scope: ScopeForm) {
  return [scope.create, scope.read, scope.update, scope.delete].filter(Boolean)
    .length;
}

function getScopeOptionText(scope: PermissionScopeOption) {
  return scope.description
    ? `${scope.name} — ${scope.description}`
    : scope.name;
}

export default function RoleManagement({
  initialRoles,
  initialPermissionScopes,
  access,
}: RoleManagementProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [roleList, setRoleList] =
    useState<RoleWithPermissionsForClient[]>(initialRoles);

  const [permissionScopeOptions, setPermissionScopeOptions] = useState<
    PermissionScopeOption[]
  >(initialPermissionScopes);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRole, setCurrentRole] =
    useState<RoleWithPermissionsForClient | null>(null);

  const [roleName, setRoleName] = useState("");
  const [scopeForms, setScopeForms] = useState<ScopeForm[]>([]);
  const [selectedScopeIds, setSelectedScopeIds] = useState<string[]>([]);
  const [scopeSearch, setScopeSearch] = useState("");
  const [rightsPreset, setRightsPreset] = useState<RightsPreset>("read");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "name",
    direction: "asc",
  });

  const isFetching = isPending || isDeleting;

  useEffect(() => {
    setRoleList(initialRoles);
  }, [initialRoles]);

  useEffect(() => {
    setPermissionScopeOptions(initialPermissionScopes);
  }, [initialPermissionScopes]);

  const selectedCount = useMemo(() => {
    return scopeForms.reduce((total, scope) => {
      return total + getScopeRightsCount(scope);
    }, 0);
  }, [scopeForms]);

  const permissionScopesJson = useMemo(() => {
    return JSON.stringify(
      scopeForms.map((scope) => ({
        scopeId: scope.scopeId,
        create: scope.create,
        read: scope.read,
        update: scope.update,
        delete: scope.delete,
      })),
    );
  }, [scopeForms]);

  const availableScopeOptions = useMemo(() => {
    const usedScopeIds = new Set(scopeForms.map((scope) => scope.scopeId));
    const keyword = scopeSearch.trim().toLowerCase();

    return permissionScopeOptions.filter((scope) => {
      if (usedScopeIds.has(scope.id)) return false;
      if (!keyword) return true;

      return `${scope.name} ${scope.description ?? ""}`
        .toLowerCase()
        .includes(keyword);
    });
  }, [permissionScopeOptions, scopeForms, scopeSearch]);

  const showAlert = useMemo(() => {
    return Swal.mixin({
      background: "#ffffff",
      color: "#0f172a",
      confirmButtonColor: "#0284c7",
      cancelButtonColor: "#64748b",
    });
  }, []);

  const filteredRoles = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return roleList;

    return roleList.filter((role) => {
      const permissionText = getPermissionText(role);

      const rightsText = permissionItems
        .filter((item) => getRights(role)[item.key])
        .map((item) => item.title)
        .join(" ");

      return [role.name, permissionText, rightsText]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [roleList, search]);

  const sortedRoles = useMemo(() => {
    const sorted = [...filteredRoles];

    sorted.sort((a, b) => {
      let valueA: string | number = "";
      let valueB: string | number = "";

      if (sortConfig.key === "name") {
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
      }

      if (sortConfig.key === "permission") {
        valueA = getPermissionText(a).toLowerCase();
        valueB = getPermissionText(b).toLowerCase();
      }

      if (sortConfig.key === "rights") {
        valueA = getRightsCount(a);
        valueB = getRightsCount(b);
      }

      if (sortConfig.key === "totalPermission") {
        valueA = a.permissions.length;
        valueB = b.permissions.length;
      }

      if (valueA < valueB) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }

      if (valueA > valueB) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }

      return 0;
    });

    return sorted;
  }, [filteredRoles, sortConfig]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedRoles.length / ITEMS_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRoles = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return sortedRoles.slice(startIndex, endIndex);
  }, [sortedRoles, safeCurrentPage]);

  const startNumber =
    sortedRoles.length === 0 ? 0 : (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;

  const endNumber = Math.min(
    safeCurrentPage * ITEMS_PER_PAGE,
    sortedRoles.length,
  );

  const rolePermissionCount = useMemo(() => {
    return roleList.reduce((total, role) => total + role.permissions.length, 0);
  }, [roleList]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortConfig]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function refreshPage() {
    startTransition(() => {
      router.refresh();
    });
  }

  function resetFormState() {
    setCurrentRole(null);
    setRoleName("");
    setScopeForms([]);
    setSelectedScopeIds([]);
    setScopeSearch("");
    setRightsPreset("read");
  }

  function openCreateModal() {
    if (!access.create) return;
    resetFormState();
    setIsModalOpen(true);
  }

  function openEditModal(role: RoleWithPermissionsForClient) {
    if (!access.update) return;
    setCurrentRole(role);
    setRoleName(role.name);
    setSelectedScopeIds([]);
    setScopeSearch("");

    setScopeForms(
      role.permissions.map((permission) => ({
        uid: `existing-${permission.id}`,
        scopeId: permission.scopeId,
        name: permission.name,
        create: permission.create,
        read: permission.read,
        update: permission.update,
        delete: permission.delete,
      })),
    );

    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSubmitting) return;

    setIsModalOpen(false);
    resetFormState();
  }

  async function addExistingScopes() {
    const usedScopeIds = new Set(scopeForms.map((scope) => scope.scopeId));
    const selectedScopes = permissionScopeOptions.filter(
      (scope) =>
        selectedScopeIds.includes(scope.id) && !usedScopeIds.has(scope.id),
    );

    if (selectedScopes.length === 0) {
      await showAlert.fire({
        icon: "warning",
        title: "Pilih scope dulu",
        text: "Pilih satu atau beberapa permission scope yang ingin dipakai.",
      });

      return;
    }

    setScopeForms((prev) => [
      ...prev,
      ...selectedScopes.map((scope) => ({
        uid: `scope-${scope.id}-${createClientId()}`,
        scopeId: scope.id,
        name: scope.name,
        ...rightsPresets[rightsPreset],
      })),
    ]);

    setSelectedScopeIds([]);
    setScopeSearch("");
  }

  function toggleSelectedScope(scopeId: string) {
    setSelectedScopeIds((prev) =>
      prev.includes(scopeId)
        ? prev.filter((id) => id !== scopeId)
        : [...prev, scopeId],
    );
  }

  function applyPresetToAll(preset: RightsPreset) {
    setScopeForms((prev) =>
      prev.map((scope) => ({ ...scope, ...rightsPresets[preset] })),
    );
  }

  function removeScope(uid: string) {
    setScopeForms((prev) => prev.filter((scope) => scope.uid !== uid));
  }

  function toggleScopeRight(uid: string, key: PermissionKey) {
    setScopeForms((prev) =>
      prev.map((scope) =>
        scope.uid === uid
          ? key === "read" && scope.read
            ? {
                ...scope,
                create: false,
                read: false,
                update: false,
                delete: false,
              }
            : {
                ...scope,
                [key]: !scope[key],
                read: true,
              }
          : scope,
      ),
    );
  }

  function handleSort(key: SortKey) {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key,
        direction: "asc",
      };
    });
  }

  function getSortIcon(key: SortKey) {
    if (sortConfig.key !== key) return "↕";

    return sortConfig.direction === "asc" ? "▲" : "▼";
  }

  function getPageNumbers() {
    const pages: number[] = [];

    const start = Math.max(1, safeCurrentPage - 1);
    const end = Math.min(totalPages, safeCurrentPage + 1);

    for (let page = start; page <= end; page++) {
      pages.push(page);
    }

    return pages;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (currentRole ? !access.update : !access.create) return;

    if (scopeForms.length === 0) {
      await showAlert.fire({
        icon: "warning",
        title: "Permission belum dipilih",
        text: "Role harus memiliki minimal satu permission scope.",
      });

      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await saveRoleWithPermissionsAction(
        formData,
        currentRole?.id,
      );

      if (result.success) {
        await showAlert.fire({
          icon: "success",
          title: "Berhasil!",
          text: result.message,
          timer: 1500,
          showConfirmButton: false,
        });

        closeModal();
        refreshPage();
      } else {
        await showAlert.fire({
          icon: "error",
          title: "Gagal",
          text: result.message,
        });
      }
    } catch (error) {
      console.error(error);

      await showAlert.fire({
        icon: "error",
        title: "Terjadi kesalahan",
        text: currentRole ? "Role gagal diperbarui." : "Role gagal dibuat.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(role: RoleWithPermissionsForClient) {
    if (!access.delete) return;

    const confirm = await showAlert.fire({
      title: "Hapus role ini?",
      text: `Role ${role.name} akan dihapus dari sistem.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    setIsDeleting(true);

    try {
      const result = await deleteRoleAction(role.id);

      if (result.success) {
        await showAlert.fire({
          icon: "success",
          title: "Terhapus!",
          text: result.message,
          timer: 1400,
          showConfirmButton: false,
        });

        refreshPage();
      } else {
        await showAlert.fire({
          icon: "error",
          title: "Gagal",
          text: result.message,
        });
      }
    } catch (error) {
      console.error(error);

      await showAlert.fire({
        icon: "error",
        title: "Terjadi kesalahan",
        text: "Role gagal dihapus.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  function SortableHeader({
    label,
    sortKey,
    className = "",
  }: {
    label: string;
    sortKey: SortKey;
    className?: string;
  }) {
    const isActive = sortConfig.key === sortKey;

    return (
      <th className={`px-5 py-4 ${className}`}>
        <button
          type="button"
          onClick={() => handleSort(sortKey)}
          className={`group flex w-full items-center gap-2 text-left transition-all duration-300 hover:text-sky-600 ${
            isActive ? "text-sky-600" : "text-slate-500"
          }`}
          title={`Urutkan berdasarkan ${label}`}
        >
          <span>{label}</span>

          <span
            className={`text-[10px] transition-all duration-300 ${
              isActive ? "opacity-100" : "opacity-40 group-hover:opacity-100"
            }`}
          >
            {getSortIcon(sortKey)}
          </span>
        </button>
      </th>
    );
  }

  function TableSkeleton({ rowCount }: { rowCount: number }) {
    return (
      <>
        {Array.from({ length: rowCount }).map((_, index) => (
          <tr
            key={index}
            className="h-[88px] animate-pulse border-b border-slate-100"
          >
            <td className="h-[88px] px-5 py-3">
              <div className="flex h-full items-center gap-3">
                <div className="h-11 w-11 shrink-0 rounded-2xl bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-3 w-32 rounded-full bg-slate-200" />
                  <div className="h-3 w-20 rounded-full bg-slate-100" />
                </div>
              </div>
            </td>

            <td className="h-[88px] px-5 py-3">
              <div className="space-y-2">
                <div className="h-6 w-36 rounded-full bg-slate-200" />
                <div className="h-6 w-24 rounded-full bg-slate-100" />
              </div>
            </td>

            <td className="h-[88px] px-5 py-3">
              <div className="flex gap-2">
                <div className="h-7 w-16 rounded-full bg-slate-200" />
                <div className="h-7 w-16 rounded-full bg-slate-200" />
              </div>
            </td>

            <td className="h-[88px] px-5 py-3">
              <div className="h-3 w-20 rounded-full bg-slate-200" />
            </td>

            <td className="h-[88px] px-5 py-3">
              <div className="flex justify-end gap-2">
                <div className="h-10 w-10 rounded-2xl bg-slate-200" />
                <div className="h-10 w-10 rounded-2xl bg-slate-200" />
              </div>
            </td>
          </tr>
        ))}
      </>
    );
  }

  return (
    <>
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-sky-100 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-cyan-100 blur-3xl" />

        <div className="relative p-5 sm:p-8">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1 text-xs font-bold uppercase tracking-[0.25em] text-sky-600">
                <RiShieldKeyholeLine />
                Role Access
              </p>

              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Role Management
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Role hanya memilih permission scope yang sudah dibuat di halaman
                Permission Management.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={refreshPage}
                disabled={isFetching}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RiRefreshLine
                  className={isFetching ? "animate-spin text-sky-500" : ""}
                />
                Refresh
              </button>

              {access.create && (
                <button
                  onClick={openCreateModal}
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-sky-600"
                >
                  <RiAddLine className="text-xl transition-transform duration-300 group-hover:rotate-90" />
                  Tambah Role
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-sky-50 p-5">
              <p className="text-sm font-medium text-slate-500">Total Role</p>
              <h3 className="mt-2 text-3xl font-black text-slate-900">
                {roleList.length}
              </h3>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-cyan-50 p-5">
              <p className="text-sm font-medium text-slate-500">
                Permission Role
              </p>
              <h3 className="mt-2 text-3xl font-black text-slate-900">
                {rolePermissionCount}
              </h3>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-blue-50 p-5">
              <p className="text-sm font-medium text-slate-500">
                Scope Tersedia
              </p>
              <h3 className="mt-2 text-3xl font-black text-slate-900">
                {permissionScopeOptions.length}
              </h3>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <RiSearch2Line className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari role, permission, atau hak akses..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="app-table min-w-[900px] table-fixed overflow-hidden">
                <thead>
                  <tr className="h-[56px] border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.16em]">
                    <SortableHeader
                      label="Role"
                      sortKey="name"
                      className="w-[24%]"
                    />

                    <SortableHeader
                      label="Permission Scope"
                      sortKey="permission"
                      className="w-[30%]"
                    />

                    <SortableHeader
                      label="Hak Akses"
                      sortKey="rights"
                      className="w-[24%]"
                    />

                    <SortableHeader
                      label="Total"
                      sortKey="totalPermission"
                      className="w-[10%]"
                    />

                    {(access.update || access.delete) && (
                      <th className="w-[12%] px-5 py-4 text-right text-slate-500">
                        Aksi
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {isFetching ? (
                    <TableSkeleton
                      rowCount={
                        paginatedRoles.length > 0
                          ? paginatedRoles.length
                          : ITEMS_PER_PAGE
                      }
                    />
                  ) : paginatedRoles.length > 0 ? (
                    paginatedRoles.map((role, index) => {
                      const roleRights = getRights(role);

                      return (
                        <tr
                          key={role.id}
                          style={{ animationDelay: `${index * 45}ms` }}
                          className="admin-row h-[88px] border-b border-slate-100 transition-all duration-300 hover:bg-sky-50/70"
                        >
                          <td className="h-[88px] px-5 py-3">
                            <div className="flex h-full items-center gap-3">
                              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-sky-100 bg-sky-50 text-sm font-black text-sky-600">
                                {role.name.charAt(0).toUpperCase()}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate font-bold text-slate-900">
                                  {role.name}
                                </p>
                                <p className="truncate text-xs text-slate-400">
                                  ID: {role.id.slice(0, 8)}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="h-[88px] px-5 py-3">
                            <div className="flex flex-wrap gap-2">
                              {role.permissions.length > 0 ? (
                                role.permissions.map((permission) => (
                                  <span
                                    key={permission.id}
                                    className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-600"
                                  >
                                    {permission.name}
                                  </span>
                                ))
                              ) : (
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500">
                                  Tanpa Permission
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="h-[88px] px-5 py-3">
                            <div className="flex flex-wrap gap-2">
                              {permissionItems.map((item) => (
                                <span
                                  key={item.key}
                                  className={`rounded-full border px-3 py-1 text-xs font-bold ${
                                    roleRights[item.key]
                                      ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                                      : "border-slate-200 bg-slate-50 text-slate-400"
                                  }`}
                                >
                                  {item.title}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="h-[88px] px-5 py-3 text-sm font-bold text-slate-600">
                            {role.permissions.length} scope
                          </td>

                          {(access.update || access.delete) && (
                            <td className="h-[88px] px-5 py-3">
                              <div className="flex justify-end gap-2">
                                {access.update && (
                                  <button
                                    onClick={() => openEditModal(role)}
                                    className="grid h-10 w-10 place-items-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-100"
                                    title="Edit role"
                                  >
                                    <RiEditBoxLine size={18} />
                                  </button>
                                )}

                                {access.delete && (
                                  <button
                                    onClick={() => handleDelete(role)}
                                    className="grid h-10 w-10 place-items-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-100"
                                    title="Hapus role"
                                  >
                                    <RiDeleteBinLine size={18} />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={access.update || access.delete ? 5 : 4}
                        className="px-5 py-14 text-center"
                      >
                        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-sky-100 bg-sky-50 text-3xl">
                          📂
                        </div>

                        <h3 className="mt-4 text-lg font-bold text-slate-900">
                          Data role tidak ditemukan
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Coba ubah pencarian atau buat role baru.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Menampilkan{" "}
                <span className="font-bold text-slate-800">{startNumber}</span>
                {" - "}
                <span className="font-bold text-slate-800">{endNumber}</span>
                {" dari "}
                <span className="font-bold text-slate-800">
                  {sortedRoles.length}
                </span>{" "}
                role
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={safeCurrentPage === 1 || sortedRoles.length === 0}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all duration-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RiArrowLeftSLine size={22} />
                </button>

                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`grid h-10 w-10 place-items-center rounded-xl border text-sm font-bold transition-all duration-300 ${
                      page === safeCurrentPage
                        ? "border-sky-500 bg-sky-500 text-white shadow-lg shadow-sky-100"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-sky-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={
                    safeCurrentPage === totalPages || sortedRoles.length === 0
                  }
                  className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all duration-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RiArrowRightSLine size={22} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {isModalOpen && (currentRole ? access.update : access.create) && (
        <div
          className="admin-backdrop fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 px-4 py-8 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="admin-modal max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white text-slate-800 shadow-2xl shadow-slate-400/30">
            <div className="relative border-b border-slate-200 bg-gradient-to-br from-white to-sky-50 p-5 sm:p-6">
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-600">
                    {currentRole ? "Update Role" : "Create Role"}
                  </p>

                  <h3 className="mt-2 text-2xl font-black text-slate-900">
                    {currentRole ? "Edit Role" : "Tambah Role Baru"}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Role hanya bisa memakai permission scope yang sudah dibuat.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-all duration-300 hover:bg-rose-50 hover:text-rose-600"
                >
                  <RiCloseLine size={20} />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="max-h-[calc(90vh-120px)] space-y-6 overflow-y-auto p-5 sm:p-6"
            >
              <input
                type="hidden"
                name="permissionScopesJson"
                value={permissionScopesJson}
              />

              <div>
                <label className={labelClass}>Nama Role</label>

                <input
                  name="name"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Contoh: Admin"
                  required
                  className={inputClass}
                />

                <p className="mt-2 text-xs text-slate-400">
                  Role disimpan sesuai input, tidak otomatis uppercase.
                </p>
              </div>

              <div className="rounded-3xl border border-sky-100 bg-sky-50 p-4 sm:p-5">
                <label className={labelClass}>Tambah Permission Scope</label>

                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-[1fr_220px]">
                    <div className="relative">
                      <RiSearch2Line className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={scopeSearch}
                        onChange={(event) => setScopeSearch(event.target.value)}
                        placeholder="Cari scope halaman atau fitur..."
                        className={`${inputClass} pl-11`}
                      />
                    </div>

                    <select
                      value={rightsPreset}
                      onChange={(event) =>
                        setRightsPreset(event.target.value as RightsPreset)
                      }
                      className={inputClass}
                      aria-label="Preset hak akses"
                    >
                      <option value="read">Preset: Lihat</option>
                      <option value="manage">Preset: Kelola</option>
                      <option value="full">Preset: Akses penuh</option>
                    </select>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 px-4 py-3">
                      <p className="text-xs font-bold text-slate-500">
                        {selectedScopeIds.length} scope dipilih
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedScopeIds(
                              availableScopeOptions.map((scope) => scope.id),
                            )
                          }
                          className="text-xs font-black text-sky-600 hover:text-sky-700"
                        >
                          Pilih semua
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedScopeIds([])}
                          className="text-xs font-black text-slate-400 hover:text-slate-600"
                        >
                          Kosongkan
                        </button>
                      </div>
                    </div>

                    <div className="grid max-h-56 gap-2 overflow-y-auto p-3 sm:grid-cols-2">
                      {availableScopeOptions.map((scope) => {
                        const checked = selectedScopeIds.includes(scope.id);

                        return (
                          <label
                            key={scope.id}
                            title={getScopeOptionText(scope)}
                            className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition ${
                              checked
                                ? "border-sky-300 bg-sky-50"
                                : "border-slate-100 hover:border-sky-200 hover:bg-sky-50/50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSelectedScope(scope.id)}
                              className="mt-1 h-4 w-4 accent-sky-500"
                            />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-black text-slate-800">
                                {scope.name}
                              </span>
                              <span className="mt-1 block text-xs leading-5 text-slate-500">
                                {scope.description || "Scope akses khusus"}
                              </span>
                            </span>
                          </label>
                        );
                      })}

                      {availableScopeOptions.length === 0 && (
                        <p className="col-span-full py-6 text-center text-sm font-semibold text-slate-400">
                          Semua scope sudah dipakai atau tidak ditemukan.
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addExistingScopes}
                    disabled={selectedScopeIds.length === 0}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-100 transition-all duration-300 hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RiAddLine />
                    Tambahkan {selectedScopeIds.length || ""} Scope
                  </button>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Pilih beberapa scope sekaligus, tentukan preset haknya, lalu
                  tambahkan dalam satu kali proses.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-black text-slate-900">
                      Permission Scope Role Ini
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Atur hak akses untuk setiap permission scope.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {scopeForms.length > 0 &&
                      (["read", "manage", "full"] as RightsPreset[]).map(
                        (preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => applyPresetToAll(preset)}
                            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:border-sky-300 hover:text-sky-600"
                          >
                            {preset === "read"
                              ? "Semua: Lihat"
                              : preset === "manage"
                                ? "Semua: Kelola"
                                : "Semua: Penuh"}
                          </button>
                        ),
                      )}
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-emerald-600">
                      <RiCheckboxCircleLine />
                      {selectedCount} hak aktif
                    </div>
                  </div>
                </div>

                {scopeForms.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-8 text-center">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl border border-sky-100 bg-sky-50 text-2xl">
                      📂
                    </div>

                    <h4 className="mt-4 font-black text-slate-900">
                      Belum ada permission scope
                    </h4>

                    <p className="mt-1 text-sm text-slate-500">
                      Pilih scope dari dropdown di atas, lalu klik Tambahkan.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scopeForms.map((scope) => (
                      <div
                        key={scope.uid}
                        className="permission-card rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600">
                              Permission Scope
                            </p>

                            <h4 className="mt-1 text-lg font-black text-slate-900">
                              {scope.name}
                            </h4>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeScope(scope.uid)}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 transition-all duration-300 hover:bg-rose-100"
                          >
                            <RiDeleteBinLine />
                            Hapus
                          </button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          {permissionItems.map((item) => {
                            const isChecked = scope[item.key];

                            return (
                              <label
                                key={`${scope.uid}-${item.key}`}
                                className={`group relative cursor-pointer rounded-3xl border p-4 transition-all duration-300 ${
                                  isChecked
                                    ? "border-sky-300 bg-white shadow-lg shadow-sky-100"
                                    : "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/40"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() =>
                                    toggleScopeRight(scope.uid, item.key)
                                  }
                                  className="sr-only"
                                />

                                <div className="flex items-start justify-between gap-3">
                                  <div
                                    className={`grid h-11 w-11 place-items-center rounded-2xl text-xl transition-all duration-300 ${
                                      isChecked
                                        ? "bg-sky-500 text-white"
                                        : "bg-slate-100 text-slate-500 group-hover:bg-sky-100 group-hover:text-sky-600"
                                    }`}
                                  >
                                    {item.icon}
                                  </div>

                                  <RiCheckboxCircleLine
                                    className={`text-xl transition-all duration-300 ${
                                      isChecked
                                        ? "scale-100 text-sky-500 opacity-100"
                                        : "scale-75 text-slate-300 opacity-0 group-hover:opacity-100"
                                    }`}
                                  />
                                </div>

                                <h4 className="mt-4 font-black text-slate-900">
                                  {item.title}
                                </h4>

                                <p className="mt-1 text-sm leading-5 text-slate-500">
                                  {item.description}
                                </p>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition-all duration-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-sky-100 transition-all duration-300 hover:-translate-y-0.5 hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting && <RiLoader4Line className="animate-spin" />}
                  {isSubmitting
                    ? "Menyimpan..."
                    : currentRole
                      ? "Update Role"
                      : "Buat Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes permissionPop {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes adminFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes adminScaleUp {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes adminSlideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .permission-card {
          animation: permissionPop 260ms ease-out both;
        }

        .admin-backdrop {
          animation: adminFadeIn 180ms ease-out both;
        }

        .admin-modal {
          animation: adminScaleUp 260ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .admin-row {
          opacity: 0;
          animation: adminSlideUp 260ms ease-out both;
        }
      `}</style>
    </>
  );
}
