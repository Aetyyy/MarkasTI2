"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { appAlertCompat as Swal } from "@/libs/alertCompat";
import { useRouter } from "next/navigation";
import {
  RiAddLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiEditBoxLine,
  RiKey2Line,
  RiLoader4Line,
  RiRefreshLine,
  RiSearch2Line,
} from "react-icons/ri";
import {
  deletePermissionScopeAction,
  savePermissionScopeAction,
} from "@/libs/permissions/action";
import type { PermissionScopeForClient } from "@/types/permissionManagement";

type SortKey = "name" | "description" | "createdAt";
type SortDirection = "asc" | "desc";

type SortConfig = {
  key: SortKey;
  direction: SortDirection;
};

interface PermissionManagementProps {
  initialPermissions: PermissionScopeForClient[];
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

function formatDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PermissionManagement({
  initialPermissions,
  access,
}: PermissionManagementProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [permissionList, setPermissionList] =
    useState<PermissionScopeForClient[]>(initialPermissions);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPermission, setCurrentPermission] =
    useState<PermissionScopeForClient | null>(null);

  const [scopeName, setScopeName] = useState("");
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "name",
    direction: "asc",
  });

  const isFetching = isPending || isDeleting;

  useEffect(() => {
    setPermissionList(initialPermissions);
  }, [initialPermissions]);

  const showAlert = useMemo(() => {
    return Swal.mixin({
      background: "#ffffff",
      color: "#0f172a",
      confirmButtonColor: "#0284c7",
      cancelButtonColor: "#64748b",
    });
  }, []);

  const filteredPermissions = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return permissionList;

    return permissionList.filter((permission) =>
      [permission.name, permission.description || ""]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [permissionList, search]);

  const sortedPermissions = useMemo(() => {
    const sorted = [...filteredPermissions];

    sorted.sort((a, b) => {
      let valueA: string | number = "";
      let valueB: string | number = "";

      if (sortConfig.key === "name") {
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
      }

      if (sortConfig.key === "description") {
        valueA = (a.description || "").toLowerCase();
        valueB = (b.description || "").toLowerCase();
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
  }, [filteredPermissions, sortConfig]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedPermissions.length / ITEMS_PER_PAGE),
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedPermissions = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return sortedPermissions.slice(startIndex, endIndex);
  }, [sortedPermissions, safeCurrentPage]);

  const startNumber =
    sortedPermissions.length === 0
      ? 0
      : (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;

  const endNumber = Math.min(
    safeCurrentPage * ITEMS_PER_PAGE,
    sortedPermissions.length,
  );

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
    setCurrentPermission(null);
    setScopeName("");
    setDescription("");
  }

  function openCreateModal() {
    if (!access.create) return;
    resetFormState();
    setIsModalOpen(true);
  }

  function openEditModal(permission: PermissionScopeForClient) {
    if (!access.update) return;
    setCurrentPermission(permission);
    setScopeName(permission.name);
    setDescription(permission.description || "");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSubmitting) return;

    setIsModalOpen(false);
    resetFormState();
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
    if (currentPermission ? !access.update : !access.create) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await savePermissionScopeAction(
        formData,
        currentPermission?.id,
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
        text: currentPermission
          ? "Permission gagal diperbarui."
          : "Permission gagal dibuat.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(permission: PermissionScopeForClient) {
    if (!access.delete) return;

    const confirm = await showAlert.fire({
      title: "Hapus permission ini?",
      text: `Permission ${permission.name} akan dihapus dari sistem.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    setIsDeleting(true);

    try {
      const result = await deletePermissionScopeAction(permission.id);

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
        text: "Permission gagal dihapus.",
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
                  <div className="h-3 w-36 rounded-full bg-slate-200" />
                  <div className="h-3 w-20 rounded-full bg-slate-100" />
                </div>
              </div>
            </td>

            <td className="h-[76px] px-5 py-3">
              <div className="h-3 w-56 rounded-full bg-slate-200" />
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
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1 text-xs font-bold uppercase tracking-[0.25em] text-sky-600">
                <RiKey2Line />
                Permission Scope
              </p>

              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Permission Management
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Buat permission scope terlebih dahulu. Setelah itu scope ini
                bisa dipilih saat membuat role.
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
                  Tambah Permission
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-sky-50 p-5">
              <p className="text-sm font-medium text-slate-500">
                Total Permission
              </p>

              <h3 className="mt-2 text-3xl font-black text-slate-900">
                {permissionList.length}
              </h3>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-cyan-50 p-5">
              <p className="text-sm font-medium text-slate-500">
                Permission Aktif
              </p>

              <h3 className="mt-2 text-3xl font-black text-slate-900">
                {filteredPermissions.length}
              </h3>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <RiSearch2Line className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari permission atau deskripsi..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="app-table min-w-[800px] table-fixed overflow-hidden">
                <thead>
                  <tr className="h-[56px] border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.16em]">
                    <SortableHeader
                      label="Permission"
                      sortKey="name"
                      className="w-[32%]"
                    />

                    <SortableHeader
                      label="Deskripsi"
                      sortKey="description"
                      className="w-[38%]"
                    />

                    <SortableHeader
                      label="Dibuat"
                      sortKey="createdAt"
                      className="w-[16%]"
                    />

                    {(access.update || access.delete) && (
                      <th className="w-[14%] px-5 py-4 text-right text-slate-500">
                        Aksi
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {isFetching ? (
                    <TableSkeleton
                      rowCount={
                        paginatedPermissions.length > 0
                          ? paginatedPermissions.length
                          : ITEMS_PER_PAGE
                      }
                    />
                  ) : paginatedPermissions.length > 0 ? (
                    paginatedPermissions.map((permission, index) => (
                      <tr
                        key={permission.id}
                        style={{ animationDelay: `${index * 45}ms` }}
                        className="admin-row h-[76px] border-b border-slate-100 transition-all duration-300 hover:bg-sky-50/70"
                      >
                        <td className="h-[76px] px-5 py-3">
                          <div className="flex h-full items-center gap-3">
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-sky-100 bg-sky-50 text-sm font-black text-sky-600">
                              {permission.name.charAt(0).toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-bold text-slate-900">
                                {permission.name}
                              </p>

                              <p className="truncate text-xs text-slate-400">
                                ID: {permission.id.slice(0, 8)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="h-[76px] px-5 py-3 text-sm text-slate-600">
                          <span className="block truncate">
                            {permission.description || "-"}
                          </span>
                        </td>

                        <td className="h-[76px] px-5 py-3 text-sm text-slate-500">
                          {formatDate(permission.createdAt)}
                        </td>

                        {(access.update || access.delete) && (
                          <td className="h-[76px] px-5 py-3">
                            <div className="flex justify-end gap-2">
                              {access.update && (
                                <button
                                  onClick={() => openEditModal(permission)}
                                  className="grid h-10 w-10 place-items-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-100"
                                  title="Edit permission"
                                >
                                  <RiEditBoxLine size={18} />
                                </button>
                              )}

                              {access.delete && (
                                <button
                                  onClick={() => handleDelete(permission)}
                                  className="grid h-10 w-10 place-items-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-100"
                                  title="Hapus permission"
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
                        colSpan={access.update || access.delete ? 4 : 3}
                        className="px-5 py-14 text-center"
                      >
                        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-sky-100 bg-sky-50 text-3xl">
                          📂
                        </div>

                        <h3 className="mt-4 text-lg font-bold text-slate-900">
                          Data permission tidak ditemukan
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Coba ubah pencarian atau buat permission baru.
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
                  {sortedPermissions.length}
                </span>{" "}
                permission
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={
                    safeCurrentPage === 1 || sortedPermissions.length === 0
                  }
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
                    safeCurrentPage === totalPages ||
                    sortedPermissions.length === 0
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

      {isModalOpen && (currentPermission ? access.update : access.create) && (
        <div
          className="admin-backdrop fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 px-4 py-8 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="admin-modal w-full max-w-xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white text-slate-800 shadow-2xl shadow-slate-400/30">
            <div className="relative border-b border-slate-200 bg-gradient-to-br from-white to-sky-50 p-5 sm:p-6">
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-600">
                    {currentPermission
                      ? "Update Permission"
                      : "Create Permission"}
                  </p>

                  <h3 className="mt-2 text-2xl font-black text-slate-900">
                    {currentPermission
                      ? "Edit Permission"
                      : "Tambah Permission Baru"}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Permission ini nantinya dipilih saat membuat role.
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
              <div>
                <label className={labelClass}>Nama Permission Scope</label>

                <input
                  name="name"
                  value={scopeName}
                  onChange={(e) => setScopeName(e.target.value)}
                  placeholder="Contoh: dashboard_access"
                  required
                  className={inputClass}
                />

                <p className="mt-2 text-xs text-slate-400">
                  Spasi otomatis diubah menjadi underscore dan huruf kecil.
                </p>
              </div>

              <div>
                <label className={labelClass}>Deskripsi</label>

                <textarea
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Akses untuk halaman dashboard admin"
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
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
                    : currentPermission
                      ? "Update Permission"
                      : "Buat Permission"}
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
