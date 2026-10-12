"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { appAlertCompat as Swal } from "@/libs/alertCompat";
import {
  RiAddLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCalendarScheduleLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiEditBoxLine,
  RiEyeLine,
  RiEyeOffLine,
  RiLoader4Line,
  RiRefreshLine,
  RiSearch2Line,
  RiTimeLine,
} from "react-icons/ri";
import {
  deleteScheduleAction,
  saveScheduleAction,
  toggleScheduleStatusAction,
} from "@/libs/schedules/action";
import type {
  JadwalDayValue,
  ScheduleDosenOption,
  ScheduleCourseOption,
  ScheduleForClient,
} from "@/types/scheduleManagement";
import { jadwalDayOptions } from "@/types/scheduleManagement";

type SortKey = "day" | "title" | "time" | "status";
type SortDirection = "asc" | "desc";

type SortConfig = {
  key: SortKey;
  direction: SortDirection;
};

type FormState = {
  day: JadwalDayValue;
  title: string;
  dosenId: string;
  mataKuliahId: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  isActive: boolean;
};

interface ScheduleManagementProps {
  initialSchedules: ScheduleForClient[];
  dosenOptions: ScheduleDosenOption[];
  courseOptions: ScheduleCourseOption[];
  access: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
}

const ITEMS_PER_PAGE = 8;

const dayRank: Record<JadwalDayValue, number> = {
  SENIN: 1,
  SELASA: 2,
  RABU: 3,
  KAMIS: 4,
  JUMAT: 5,
  SABTU: 6,
};

const emptyForm: FormState = {
  day: "SENIN",
  title: "",
  dosenId: "",
  mataKuliahId: "",
  startTime: "",
  endTime: "",
  location: "",
  description: "",
  isActive: true,
};

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100";

const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

function timeToMinutes(time: string) {
  const [hour = "0", minute = "0"] = time.split(":");

  return Number(hour) * 60 + Number(minute);
}

export default function ScheduleManagement({
  initialSchedules,
  dosenOptions,
  courseOptions,
  access,
}: ScheduleManagementProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [scheduleList, setScheduleList] =
    useState<ScheduleForClient[]>(initialSchedules);

  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState<JadwalDayValue | "SEMUA">("SEMUA");
  const [statusFilter, setStatusFilter] = useState<
    "SEMUA" | "AKTIF" | "NONAKTIF"
  >("SEMUA");

  const [currentPage, setCurrentPage] = useState(1);
  const [currentSchedule, setCurrentSchedule] =
    useState<ScheduleForClient | null>(null);

  const [formState, setFormState] = useState<FormState>(emptyForm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "day",
    direction: "asc",
  });

  const isFetching = isPending || isDeleting;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() =>
      setScheduleList(initialSchedules),
    );
    return () => window.cancelAnimationFrame(frame);
  }, [initialSchedules]);

  const showAlert = useMemo(() => {
    return Swal.mixin({
      background: "#ffffff",
      color: "#0f172a",
      confirmButtonColor: "#0284c7",
      cancelButtonColor: "#64748b",
    });
  }, []);

  const activeCount = useMemo(() => {
    return scheduleList.filter((schedule) => schedule.isActive).length;
  }, [scheduleList]);

  const inactiveCount = scheduleList.length - activeCount;

  const filteredSchedules = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return scheduleList.filter((schedule) => {
      const matchKeyword = keyword
        ? [
            schedule.title,
            schedule.dosenName || "",
            schedule.location || "",
            schedule.description || "",
            schedule.dayLabel,
          ]
            .join(" ")
            .toLowerCase()
            .includes(keyword)
        : true;

      const matchDay =
        dayFilter === "SEMUA" ? true : schedule.day === dayFilter;

      const matchStatus =
        statusFilter === "SEMUA"
          ? true
          : statusFilter === "AKTIF"
            ? schedule.isActive
            : !schedule.isActive;

      return matchKeyword && matchDay && matchStatus;
    });
  }, [scheduleList, search, dayFilter, statusFilter]);

  const sortedSchedules = useMemo(() => {
    const sorted = [...filteredSchedules];

    sorted.sort((a, b) => {
      let valueA: string | number = "";
      let valueB: string | number = "";

      if (sortConfig.key === "day") {
        valueA = dayRank[a.day];
        valueB = dayRank[b.day];
      }

      if (sortConfig.key === "title") {
        valueA = a.title.toLowerCase();
        valueB = b.title.toLowerCase();
      }

      if (sortConfig.key === "time") {
        valueA = timeToMinutes(a.startTime);
        valueB = timeToMinutes(b.startTime);
      }

      if (sortConfig.key === "status") {
        valueA = a.isActive ? 1 : 0;
        valueB = b.isActive ? 1 : 0;
      }

      if (valueA < valueB) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }

      if (valueA > valueB) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }

      return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    });

    return sorted;
  }, [filteredSchedules, sortConfig]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedSchedules.length / ITEMS_PER_PAGE),
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedSchedules = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return sortedSchedules.slice(startIndex, endIndex);
  }, [sortedSchedules, safeCurrentPage]);

  const startNumber =
    sortedSchedules.length === 0
      ? 0
      : (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;

  const endNumber = Math.min(
    safeCurrentPage * ITEMS_PER_PAGE,
    sortedSchedules.length,
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setCurrentPage(1));
    return () => window.cancelAnimationFrame(frame);
  }, [search, dayFilter, statusFilter, sortConfig]);

  function refreshPage() {
    startTransition(() => {
      router.refresh();
    });
  }

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function resetForm() {
    setCurrentSchedule(null);
    setFormState(emptyForm);
  }

  function openCreateModal() {
    resetForm();
    setIsModalOpen(true);
  }

  function openEditModal(schedule: ScheduleForClient) {
    setCurrentSchedule(schedule);
    setFormState({
      day: schedule.day,
      title: schedule.title,
      dosenId: schedule.dosenId ? String(schedule.dosenId) : "",
      mataKuliahId: schedule.mataKuliahId ? String(schedule.mataKuliahId) : "",
      startTime: schedule.startTime,
      endTime: schedule.endTime || "",
      location: schedule.location || "",
      description: schedule.description || "",
      isActive: schedule.isActive,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSubmitting) return;

    setIsModalOpen(false);
    resetForm();
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
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await saveScheduleAction(formData, currentSchedule?.id);

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
        text: "Jadwal gagal disimpan.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(schedule: ScheduleForClient) {
    const confirm = await showAlert.fire({
      title: "Hapus jadwal ini?",
      text: `${schedule.title} akan dihapus dari sistem.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    setIsDeleting(true);

    try {
      const result = await deleteScheduleAction(schedule.id);

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
        text: "Jadwal gagal dihapus.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleToggle(schedule: ScheduleForClient) {
    const result = await toggleScheduleStatusAction(
      schedule.id,
      !schedule.isActive,
    );

    if (result.success) {
      refreshPage();
      return;
    }

    await showAlert.fire({
      icon: "error",
      title: "Gagal",
      text: result.message,
    });
  }

  function renderSortableHeader(
    label: string,
    sortKey: SortKey,
    className = "",
  ) {
    const active = sortConfig.key === sortKey;

    return (
      <th className={`px-5 py-4 ${className}`}>
        <button
          type="button"
          onClick={() => handleSort(sortKey)}
          className={`group flex w-full items-center gap-2 text-left transition-all duration-300 hover:text-sky-600 ${
            active ? "text-sky-600" : "text-slate-500"
          }`}
        >
          <span>{label}</span>
          <span
            className={`text-[10px] transition-all duration-300 ${
              active ? "opacity-100" : "opacity-40 group-hover:opacity-100"
            }`}
          >
            {getSortIcon(sortKey)}
          </span>
        </button>
      </th>
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
                <RiCalendarScheduleLine />
                Schedule Control
              </p>

              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Jadwal Management
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Kelola jadwal kuliah dari dashboard admin. Data aktif akan
                tampil di halaman publik jadwal.
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
                  Tambah Jadwal
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-sky-50 p-5">
              <p className="text-sm font-medium text-slate-500">Total Jadwal</p>
              <h3 className="mt-2 text-3xl font-black text-slate-900">
                {scheduleList.length}
              </h3>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-cyan-50 p-5">
              <p className="text-sm font-medium text-slate-500">Aktif</p>
              <h3 className="mt-2 text-3xl font-black text-slate-900">
                {activeCount}
              </h3>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-blue-50 p-5">
              <p className="text-sm font-medium text-slate-500">Nonaktif</p>
              <h3 className="mt-2 text-3xl font-black text-slate-900">
                {inactiveCount}
              </h3>
            </div>
          </div>

          <div className="mt-8 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <RiSearch2Line className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari mata kuliah, dosen, lokasi..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <select
              value={dayFilter}
              onChange={(e) =>
                setDayFilter(e.target.value as JadwalDayValue | "SEMUA")
              }
              className={inputClass}
            >
              <option value="SEMUA">Semua Hari</option>
              {jadwalDayOptions.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "SEMUA" | "AKTIF" | "NONAKTIF",
                )
              }
              className={inputClass}
            >
              <option value="SEMUA">Semua Status</option>
              <option value="AKTIF">Aktif</option>
              <option value="NONAKTIF">Nonaktif</option>
            </select>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="app-table min-w-[960px] table-fixed">
                <thead>
                  <tr className="h-[56px] border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.16em]">
                    {renderSortableHeader("Hari", "day", "w-[14%]")}
                    {renderSortableHeader("Jadwal", "title", "w-[28%]")}
                    {renderSortableHeader("Waktu", "time", "w-[16%]")}
                    <th className="w-[20%] px-5 py-4 text-slate-500">Lokasi</th>
                    {renderSortableHeader("Status", "status", "w-[10%]")}
                    <th className="w-[12%] px-5 py-4 text-right text-slate-500">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {isFetching ? (
                    Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                      <tr
                        key={index}
                        className="h-[86px] animate-pulse border-b border-slate-100"
                      >
                        <td className="px-5 py-3">
                          <div className="h-6 w-20 rounded-full bg-slate-200" />
                        </td>
                        <td className="px-5 py-3">
                          <div className="space-y-2">
                            <div className="h-3 w-40 rounded-full bg-slate-200" />
                            <div className="h-3 w-28 rounded-full bg-slate-100" />
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="h-3 w-24 rounded-full bg-slate-200" />
                        </td>
                        <td className="px-5 py-3">
                          <div className="h-3 w-32 rounded-full bg-slate-200" />
                        </td>
                        <td className="px-5 py-3">
                          <div className="h-6 w-16 rounded-full bg-slate-200" />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-2">
                            <div className="h-10 w-10 rounded-2xl bg-slate-200" />
                            <div className="h-10 w-10 rounded-2xl bg-slate-200" />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : paginatedSchedules.length > 0 ? (
                    paginatedSchedules.map((schedule, index) => (
                      <tr
                        key={schedule.id}
                        style={{
                          animationDelay: `${index * 45}ms`,
                        }}
                        className="admin-row h-[86px] border-b border-slate-100 transition-all duration-300 hover:bg-sky-50/70"
                      >
                        <td className="px-5 py-3">
                          <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-black text-sky-600">
                            {schedule.dayLabel}
                          </span>
                        </td>

                        <td className="px-5 py-3">
                          <p className="line-clamp-1 font-black text-slate-900">
                            {schedule.title}
                          </p>
                          <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                            {schedule.dosenName || "Dosen belum diisi"}
                          </p>
                        </td>

                        <td className="px-5 py-3">
                          <div className="inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                            <RiTimeLine />
                            {schedule.startTime}
                            {schedule.endTime ? ` - ${schedule.endTime}` : ""}
                          </div>
                        </td>

                        <td className="px-5 py-3 text-sm text-slate-600">
                          <span className="line-clamp-1">
                            {schedule.location || "-"}
                          </span>
                        </td>

                        <td className="px-5 py-3">
                          <button
                            type="button"
                            onClick={() =>
                              access.update && handleToggle(schedule)
                            }
                            disabled={!access.update}
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black transition ${
                              schedule.isActive
                                ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            } disabled:cursor-default disabled:opacity-75`}
                          >
                            {schedule.isActive ? (
                              <RiEyeLine />
                            ) : (
                              <RiEyeOffLine />
                            )}
                            {schedule.isActive ? "Aktif" : "Nonaktif"}
                          </button>
                        </td>

                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-2">
                            {access.update && (
                              <button
                                onClick={() => openEditModal(schedule)}
                                className="grid h-10 w-10 place-items-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-100"
                                title="Edit jadwal"
                              >
                                <RiEditBoxLine size={18} />
                              </button>
                            )}

                            {access.delete && (
                              <button
                                onClick={() => handleDelete(schedule)}
                                className="grid h-10 w-10 place-items-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-100"
                                title="Hapus jadwal"
                              >
                                <RiDeleteBinLine size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-14 text-center">
                        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-sky-100 bg-sky-50 text-3xl">
                          📅
                        </div>
                        <h3 className="mt-4 text-lg font-bold text-slate-900">
                          Data jadwal tidak ditemukan
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Coba ubah filter atau buat jadwal baru.
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
                  {sortedSchedules.length}
                </span>{" "}
                jadwal
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={
                    safeCurrentPage === 1 || sortedSchedules.length === 0
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
                    sortedSchedules.length === 0
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

      {isModalOpen && (
        <div
          className="admin-backdrop fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 px-4 py-8 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="admin-modal max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white text-slate-800 shadow-2xl shadow-slate-400/30">
            <div className="border-b border-slate-200 bg-gradient-to-br from-white to-sky-50 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-600">
                    {currentSchedule ? "Update Schedule" : "Create Schedule"}
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-slate-900">
                    {currentSchedule ? "Edit Jadwal" : "Tambah Jadwal Baru"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Isi data jadwal kuliah yang akan tampil di halaman publik.
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
              className="max-h-[calc(90vh-120px)] space-y-5 overflow-y-auto p-5 sm:p-6"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Hari</label>
                  <select
                    name="day"
                    value={formState.day}
                    onChange={(e) =>
                      updateForm("day", e.target.value as JadwalDayValue)
                    }
                    className={inputClass}
                  >
                    {jadwalDayOptions.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Status</label>
                  <label className="flex min-h-[46px] cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formState.isActive}
                      onChange={(e) => updateForm("isActive", e.target.checked)}
                      className="h-4 w-4 accent-sky-500"
                    />
                    Tampilkan di halaman publik
                  </label>
                </div>
              </div>

              <div>
                <label className={labelClass}>Mata Kuliah</label>
                <select
                  name="mataKuliahId"
                  value={formState.mataKuliahId}
                  onChange={(e) => {
                    const selected = courseOptions.find(
                      (item) => String(item.id) === e.target.value,
                    );
                    updateForm("mataKuliahId", e.target.value);
                    updateForm("title", selected?.name || "");
                    if (formState.dosenId) {
                      const dosen = dosenOptions.find(
                        (item) => String(item.id) === formState.dosenId,
                      );
                      if (
                        selected &&
                        dosen &&
                        !dosen.mataKuliahIds.includes(selected.id)
                      ) {
                        updateForm("dosenId", "");
                      }
                    }
                  }}
                  required
                  className={inputClass}
                >
                  <option value="">Pilih mata kuliah</option>
                  {courseOptions.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} · {course.name} · {course.sks} SKS
                    </option>
                  ))}
                </select>
                <input type="hidden" name="title" value={formState.title} />
              </div>

              <div>
                <label className={labelClass}>Dosen / Pengampu</label>
                <select
                  name="dosenId"
                  value={formState.dosenId}
                  onChange={(e) => {
                    updateForm("dosenId", e.target.value);
                  }}
                  className={inputClass}
                >
                  <option value="">Pilih dosen</option>
                  {dosenOptions
                    .filter(
                      (dosen) =>
                        !formState.mataKuliahId ||
                        dosen.mataKuliahIds.includes(
                          Number(formState.mataKuliahId),
                        ),
                    )
                    .map((dosen) => (
                      <option key={dosen.id} value={dosen.id}>
                        {dosen.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Jam Mulai</label>
                  <input
                    type="time"
                    name="startTime"
                    value={formState.startTime}
                    onChange={(e) => updateForm("startTime", e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Jam Selesai</label>
                  <input
                    type="time"
                    name="endTime"
                    value={formState.endTime}
                    onChange={(e) => updateForm("endTime", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Lokasi</label>
                <input
                  name="location"
                  value={formState.location}
                  onChange={(e) => updateForm("location", e.target.value)}
                  placeholder="Contoh: Lab Komputer / Ruang 201"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Deskripsi</label>
                <textarea
                  name="description"
                  value={formState.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  placeholder="Catatan tambahan jadwal..."
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
                    : currentSchedule
                      ? "Update Jadwal"
                      : "Buat Jadwal"}
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
