"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { appAlertCompat as Swal } from "@/libs/alertCompat";
import {
  RiAddLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiEditBoxLine,
  RiLoader4Line,
  RiRefreshLine,
  RiSearch2Line,
  RiShieldUserLine,
} from "react-icons/ri";
import { deleteUserAction, saveUserAction } from "@/libs/users/action";
import type { RoleOption, UserForClient } from "@/types/userManagement";

type SortKey = "name" | "nim" | "email" | "role" | "createdAt";
type SortDirection = "asc" | "desc";

type SortConfig = {
  key: SortKey;
  direction: SortDirection;
};

interface UserManagementProps {
  initialUsers: UserForClient[];
  initialRoles: RoleOption[];
  access: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
}

const ITEMS_PER_PAGE = 8;

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100";

const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

function getInitial(name?: string | null) {
  return name?.trim()?.charAt(0)?.toUpperCase() || "U";
}

function formatDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getRoleText(user: UserForClient) {
  return user.roles.map((role) => role.name).join(", ");
}

export default function UserManagement({
  initialUsers,
  initialRoles,
  access,
}: UserManagementProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserForClient | null>(null);

  const [userList, setUserList] = useState<UserForClient[]>(initialUsers);
  const [rolesList, setRolesList] = useState<RoleOption[]>(initialRoles);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "createdAt",
    direction: "desc",
  });

  const isFetching = isPending || isDeleting;

  const showAlert = useMemo(() => {
    return Swal.mixin({
      background: "#ffffff",
      color: "#0f172a",
      confirmButtonColor: "#0284c7",
      cancelButtonColor: "#64748b",
    });
  }, []);

  useEffect(() => {
    setUserList(initialUsers);
  }, [initialUsers]);

  useEffect(() => {
    setRolesList(initialRoles);
  }, [initialRoles]);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return userList;

    return userList.filter((user) => {
      const roleNames = getRoleText(user);

      return [user.name, user.nim, user.email, roleNames]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [search, userList]);

  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers];

    sorted.sort((a, b) => {
      let valueA: string | number = "";
      let valueB: string | number = "";

      if (sortConfig.key === "name") {
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
      }

      if (sortConfig.key === "nim") {
        valueA = a.nim.toLowerCase();
        valueB = b.nim.toLowerCase();
      }

      if (sortConfig.key === "email") {
        valueA = a.email.toLowerCase();
        valueB = b.email.toLowerCase();
      }

      if (sortConfig.key === "role") {
        valueA = getRoleText(a).toLowerCase();
        valueB = getRoleText(b).toLowerCase();
      }

      if (sortConfig.key === "createdAt") {
        valueA = new Date(a.createdAt).getTime();
        valueB = new Date(b.createdAt).getTime();
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
  }, [filteredUsers, sortConfig]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedUsers.length / ITEMS_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedUsers = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return sortedUsers.slice(startIndex, endIndex);
  }, [sortedUsers, safeCurrentPage]);

  const startNumber =
    sortedUsers.length === 0 ? 0 : (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;

  const endNumber = Math.min(
    safeCurrentPage * ITEMS_PER_PAGE,
    sortedUsers.length,
  );

  const adminCount = useMemo(() => {
    return userList.filter((user) =>
      user.roles.some((role) => role.name.toLowerCase().includes("admin")),
    ).length;
  }, [userList]);

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

  function openModal(user?: UserForClient) {
    if (user ? !access.update : !access.create) return;

    setCurrentUser(user || null);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSubmitting) return;

    setIsModalOpen(false);
    setCurrentUser(null);
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
    if (sortConfig.key !== key) {
      return "↕";
    }

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

    if (currentUser ? !access.update : !access.create) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await saveUserAction(formData, currentUser?.id);

      if (result.success) {
        setIsModalOpen(false);
        setCurrentUser(null);

        await showAlert.fire({
          icon: "success",
          title: "Berhasil!",
          text: result.message,
          timer: 1500,
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
        text: "User gagal disimpan.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(user: UserForClient) {
    if (!access.delete) return;

    const confirm = await showAlert.fire({
      title: "Hapus user ini?",
      text: `Data ${user.name} tidak bisa dikembalikan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    setIsDeleting(true);

    try {
      const result = await deleteUserAction(user.id);

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
        text: "User gagal dihapus.",
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
            className="h-[76px] animate-pulse border-b border-slate-100"
          >
            <td className="h-[76px] px-5 py-3">
              <div className="flex h-full items-center gap-3">
                <div className="h-11 w-11 shrink-0 rounded-2xl bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-3 w-32 rounded-full bg-slate-200" />
                  <div className="h-3 w-20 rounded-full bg-slate-100" />
                </div>
              </div>
            </td>

            <td className="h-[76px] px-5 py-3">
              <div className="h-3 w-28 rounded-full bg-slate-200" />
            </td>

            <td className="h-[76px] px-5 py-3">
              <div className="h-3 w-44 rounded-full bg-slate-200" />
            </td>

            <td className="h-[76px] px-5 py-3">
              <div className="h-7 w-24 rounded-full bg-slate-200" />
            </td>

            <td className="h-[76px] px-5 py-3">
              <div className="h-3 w-24 rounded-full bg-slate-200" />
            </td>

            <td className="h-[76px] px-5 py-3">
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
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1 text-xs font-bold uppercase tracking-[0.25em] text-sky-600">
                <RiShieldUserLine />
                Admin Panel
              </p>

              <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Manajemen User
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Kelola akun, NIM, email, role, dan password user. Klik header
                tabel untuk mengurutkan data.
              </p>
            </div>

            {access.create && (
              <button
                onClick={() => openModal()}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-sky-600"
              >
                <RiAddLine className="text-xl transition-transform duration-300 group-hover:rotate-90" />
                Tambah User
              </button>
            )}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-sky-50 p-5">
              <p className="text-sm font-medium text-slate-500">Total User</p>
              <h3 className="mt-2 text-3xl font-black text-slate-900">
                {userList.length}
              </h3>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-cyan-50 p-5">
              <p className="text-sm font-medium text-slate-500">Total Role</p>
              <h3 className="mt-2 text-3xl font-black text-slate-900">
                {rolesList.length}
              </h3>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-blue-50 p-5">
              <p className="text-sm font-medium text-slate-500">Admin</p>
              <h3 className="mt-2 text-3xl font-black text-slate-900">
                {adminCount}
              </h3>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <RiSearch2Line className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, NIM, email, atau role..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </div>

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
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="app-table min-w-[900px] table-fixed overflow-hidden">
                <thead>
                  <tr className="h-[56px] border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.16em]">
                    <SortableHeader
                      label="User"
                      sortKey="name"
                      className="w-[25%]"
                    />
                    <SortableHeader
                      label="NIM"
                      sortKey="nim"
                      className="w-[14%]"
                    />
                    <SortableHeader
                      label="Email"
                      sortKey="email"
                      className="w-[24%]"
                    />
                    <SortableHeader
                      label="Role"
                      sortKey="role"
                      className="w-[15%]"
                    />
                    <SortableHeader
                      label="Dibuat"
                      sortKey="createdAt"
                      className="w-[12%]"
                    />
                    {(access.update || access.delete) && (
                      <th className="w-[10%] px-5 py-4 text-right text-slate-500">
                        Aksi
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {isFetching ? (
                    <TableSkeleton
                      rowCount={
                        paginatedUsers.length > 0
                          ? paginatedUsers.length
                          : ITEMS_PER_PAGE
                      }
                    />
                  ) : paginatedUsers.length > 0 ? (
                    paginatedUsers.map((user, index) => (
                      <tr
                        key={user.id}
                        style={{ animationDelay: `${index * 45}ms` }}
                        className="admin-row h-[76px] border-b border-slate-100 transition-all duration-300 hover:bg-sky-50/70"
                      >
                        <td className="h-[76px] px-5 py-3">
                          <div className="flex h-full items-center gap-3">
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-sky-100 bg-sky-50 text-sm font-black text-sky-600">
                              {getInitial(user.name)}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-bold text-slate-900">
                                {user.name}
                              </p>
                              <p className="truncate text-xs text-slate-400">
                                ID: {user.id.slice(0, 8)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="h-[76px] px-5 py-3 text-sm text-slate-600">
                          <span className="block truncate">{user.nim}</span>
                        </td>

                        <td className="h-[76px] px-5 py-3 text-sm text-slate-600">
                          <span className="block truncate">{user.email}</span>
                        </td>

                        <td className="h-[76px] px-5 py-3">
                          <div className="flex flex-wrap gap-2">
                            {user.roles.length > 0 ? (
                              user.roles.map((role) => (
                                <span
                                  key={role.id}
                                  className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-600"
                                >
                                  {role.name}
                                </span>
                              ))
                            ) : (
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500">
                                Tanpa Role
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="h-[76px] px-5 py-3 text-sm text-slate-500">
                          {formatDate(user.createdAt)}
                        </td>

                        {(access.update || access.delete) && (
                          <td className="h-[76px] px-5 py-3">
                            <div className="flex justify-end gap-2">
                              {access.update && (
                                <button
                                  onClick={() => openModal(user)}
                                  className="grid h-10 w-10 place-items-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-100"
                                  title="Edit user"
                                >
                                  <RiEditBoxLine size={18} />
                                </button>
                              )}

                              {access.delete && (
                                <button
                                  onClick={() => handleDelete(user)}
                                  className="grid h-10 w-10 place-items-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-100"
                                  title="Hapus user"
                                >
                                  <RiDeleteBinLine size={18} />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={access.update || access.delete ? 6 : 5}
                        className="px-5 py-14 text-center"
                      >
                        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-sky-100 bg-sky-50 text-3xl">
                          📂
                        </div>

                        <h3 className="mt-4 text-lg font-bold text-slate-900">
                          Data tidak ditemukan
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Coba ubah pencarian, sort, atau tambahkan user baru.
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
                  {sortedUsers.length}
                </span>{" "}
                user
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={safeCurrentPage === 1 || sortedUsers.length === 0}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all duration-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RiArrowLeftSLine size={22} />
                </button>

                {safeCurrentPage > 2 && (
                  <>
                    <button
                      onClick={() => setCurrentPage(1)}
                      className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition-all duration-300 hover:bg-sky-50"
                    >
                      1
                    </button>

                    {safeCurrentPage > 3 && (
                      <span className="px-1 text-slate-400">...</span>
                    )}
                  </>
                )}

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

                {safeCurrentPage < totalPages - 1 && (
                  <>
                    {safeCurrentPage < totalPages - 2 && (
                      <span className="px-1 text-slate-400">...</span>
                    )}

                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition-all duration-300 hover:bg-sky-50"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={
                    safeCurrentPage === totalPages || sortedUsers.length === 0
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

      {isModalOpen && (currentUser ? access.update : access.create) && (
        <div
          className="admin-backdrop fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 px-4 py-8 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="admin-modal w-full max-w-2xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white text-slate-800 shadow-2xl shadow-slate-400/30">
            <div className="relative border-b border-slate-200 bg-gradient-to-br from-white to-sky-50 p-5 sm:p-6">
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-600">
                    {currentUser ? "Update Data" : "Create Data"}
                  </p>

                  <h3 className="mt-2 text-2xl font-black text-slate-900">
                    {currentUser ? "Edit User" : "Tambah User Baru"}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {currentUser
                      ? "Ubah data user yang sudah terdaftar."
                      : "Tambahkan user baru ke sistem."}
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

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Nama</label>
                  <input
                    name="name"
                    defaultValue={currentUser?.name ?? ""}
                    required
                    placeholder="Masukkan nama user"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>NIM</label>
                  <input
                    name="nim"
                    defaultValue={currentUser?.nim ?? ""}
                    required
                    placeholder="Masukkan NIM"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Email</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={currentUser?.email ?? ""}
                  required
                  placeholder="nama@email.com"
                  className={inputClass}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Role</label>
                  <select
                    name="roleId"
                    defaultValue={currentUser?.roles[0]?.id ?? ""}
                    required
                    className={inputClass}
                  >
                    <option value="" disabled>
                      Pilih role
                    </option>

                    {rolesList.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    Password{" "}
                    {currentUser && (
                      <span className="text-xs font-normal text-slate-400">
                        (kosongkan jika tidak diubah)
                      </span>
                    )}
                  </label>

                  <input
                    name="password"
                    type="password"
                    required={!currentUser}
                    placeholder={
                      currentUser
                        ? "Password baru opsional"
                        : "Masukkan password"
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition-all duration-300 hover:bg-slate-50 disabled:opacity-60"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-sky-100 transition-all duration-300 hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting && <RiLoader4Line className="animate-spin" />}
                  {isSubmitting ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
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
