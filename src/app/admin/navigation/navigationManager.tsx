"use client";

import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import type { IconType } from "react-icons";
import {
  FiActivity,
  FiBookOpen,
  FiCalendar,
  FiCheck,
  FiCreditCard,
  FiDatabase,
  FiDollarSign,
  FiEdit3,
  FiGrid,
  FiHome,
  FiLayers,
  FiLock,
  FiMenu,
  FiPlus,
  FiRefreshCcw,
  FiSave,
  FiShield,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";
import { confirmDanger, showError, showSuccess } from "@/libs/swal";

type Option = { id: string; name: string; nim?: string };
type Access = { create: boolean; read: boolean; update: boolean; delete: boolean };
type NavItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: string;
  badge: string | null;
  sortOrder: number;
  isActive: boolean;
  categoryId: string;
  requiredScope: Option | null;
  requiredAction: string | null;
  roles: Option[];
  allowedUsers: Option[];
};
type Category = {
  id: string;
  title: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  items: NavItem[];
};

const emptyItem = {
  id: "",
  label: "",
  description: "",
  href: "/admin/",
  icon: "layers",
  badge: "",
  sortOrder: 0,
  categoryId: "",
  requiredScopeId: "",
  requiredAction: "read",
  roleIds: [] as string[],
  userIds: [] as string[],
  isActive: true,
};

const iconOptions: Array<{ value: string; label: string; Icon: IconType }> = [
  { value: "home", label: "Home", Icon: FiHome },
  { value: "activity", label: "Activity", Icon: FiActivity },
  { value: "book", label: "Dosen", Icon: FiBookOpen },
  { value: "calendar", label: "Jadwal", Icon: FiCalendar },
  { value: "users", label: "Users", Icon: FiUsers },
  { value: "team", label: "Team", Icon: FiUsers },
  { value: "layers", label: "Layers", Icon: FiLayers },
  { value: "attendance", label: "Kehadiran", Icon: FiCheck },
  { value: "shield", label: "Shield", Icon: FiShield },
  { value: "lock", label: "Lock", Icon: FiLock },
  { value: "menu", label: "Menu", Icon: FiMenu },
  { value: "grid", label: "Grid", Icon: FiGrid },
  { value: "dollar", label: "Kas", Icon: FiDollarSign },
  { value: "credit-card", label: "Kartu", Icon: FiCreditCard },
  { value: "database", label: "Database", Icon: FiDatabase },
];

function getIcon(value: string) {
  return iconOptions.find((item) => item.value === value)?.Icon || FiLayers;
}

function NavigationIcon({ name }: { name: string }) {
  return createElement(getIcon(name), { className: "h-5 w-5" });
}

function MultiChoice({
  options,
  selected,
  onChange,
  emptyText,
}: {
  options: Option[];
  selected: string[];
  onChange: (ids: string[]) => void;
  emptyText: string;
}) {
  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((item) => item !== id)
        : [...selected, id],
    );
  }

  return (
    <div className="max-h-52 space-y-2 overflow-y-auto rounded-2xl border border-blue-100 bg-blue-50/50 p-2">
      {options.length === 0 && (
        <p className="px-3 py-5 text-center text-xs font-bold text-slate-400">
          {emptyText}
        </p>
      )}
      {options.map((option) => {
        const active = selected.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => toggle(option.id)}
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
              active
                ? "border-blue-300 bg-white text-blue-700 shadow-sm"
                : "border-transparent bg-white/60 text-slate-600 hover:border-blue-100 hover:bg-white"
            }`}
          >
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg border text-xs ${
                active
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-blue-100 bg-blue-50 text-transparent"
              }`}
            >
              <FiCheck />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black">
                {option.name}
              </span>
              {option.nim && (
                <span className="block text-[11px] font-semibold text-slate-400">
                  {option.nim}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function notifyNavigationChanged() {
  const version = String(Date.now());
  window.localStorage.setItem("markasti-navigation-version", version);
  window.dispatchEvent(new CustomEvent("markasti-navigation-updated"));

  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel("markasti-navigation");
    channel.postMessage({ type: "updated", version });
    channel.close();
  }
}

export default function NavigationManager({ access }: { access: Access }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [roles, setRoles] = useState<Option[]>([]);
  const [scopes, setScopes] = useState<Option[]>([]);
  const [users, setUsers] = useState<Option[]>([]);
  const [form, setForm] = useState(emptyItem);
  const [categoryTitle, setCategoryTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/navigation?manage=1", { cache: "no-store" });
    const result = await response.json();
    if (response.ok && result.ok) {
      setCategories(result.data);
      setRoles(result.roles);
      setScopes(result.scopes);
      setUsers(result.users);
      setForm((current) => ({
        ...current,
        categoryId: current.categoryId || result.data[0]?.id || "",
      }));
    } else {
      setMessage(result.message || "Gagal memuat menu.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const itemCount = useMemo(
    () => categories.reduce((total, category) => total + category.items.length, 0),
    [categories],
  );

  async function request(method: string, body: object) {
    const allowed =
      method === "POST"
        ? access.create
        : method === "PATCH"
          ? access.update
          : method === "DELETE"
            ? access.delete
            : access.read;
    if (!allowed) {
      await showError("Akses ditolak", "Permission untuk aksi ini tidak tersedia.");
      return false;
    }
    setMessage("");
    const response = await fetch("/api/admin/navigation", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    setMessage(result.ok ? "Perubahan menu berhasil disimpan." : result.message);
    if (result.ok) {
      await showSuccess("Perubahan tersimpan");
      notifyNavigationChanged();
      await load();
    } else {
      await showError("Perubahan gagal", result.message);
    }
    return Boolean(result.ok);
  }

  async function removeCategory(id: string) {
    if (!access.delete) return;
    if (await confirmDanger("Hapus kategori?", "Seluruh menu di dalam kategori ini juga akan dihapus.")) {
      await request("DELETE", { type: "category", id });
    }
  }

  async function removeItem(item: NavItem) {
    if (!access.delete) return;
    if (await confirmDanger(`Hapus menu ${item.label}?`, "Menu akan langsung hilang dari sidebar pengguna.")) {
      await request("DELETE", { type: "item", id: item.id });
    }
  }

  async function saveItem(event: React.FormEvent) {
    event.preventDefault();
    const editing = Boolean(form.id);
    if (editing ? !access.update : !access.create) return;
    const ok = await request(editing ? "PATCH" : "POST", { type: "item", ...form });
    if (ok) setForm({ ...emptyItem, categoryId: categories[0]?.id || "" });
  }

  function editItem(item: NavItem) {
    if (!access.update) return;
    setForm({
      id: item.id,
      label: item.label,
      description: item.description,
      href: item.href,
      icon: item.icon,
      badge: item.badge || "",
      sortOrder: item.sortOrder,
      categoryId: item.categoryId,
      requiredScopeId: item.requiredScope?.id || "",
      requiredAction: item.requiredAction || "read",
      roleIds: item.roles.map((role) => role.id),
      userIds: item.allowedUsers.map((user) => user.id),
      isActive: item.isActive,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-6 pb-12 text-[var(--app-text)]">
      <section className="rounded-4xl bg-white p-6 shadow-lg shadow-blue-900/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-xs font-black uppercase tracking-widest text-blue-700"><FiMenu /> Menu Database</span>
            <h1 className="mt-4 text-3xl font-black">Pengaturan Sidebar</h1>
            <p className="mt-2 text-sm text-slate-500">{categories.length} kategori · {itemCount} menu. Permission mengamankan halaman; role dan akun khusus hanya menyaring visibilitas menu.</p>
          </div>
          <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700"><FiRefreshCcw className={loading ? "animate-spin" : ""} /> Refresh</button>
        </div>
      </section>

      {message && <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">{message}</p>}

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4 rounded-4xl bg-white p-6 shadow-lg shadow-blue-900/5">
          <h2 className="text-xl font-black">Kategori</h2>
          {access.create && <div className="flex gap-2">
            <input value={categoryTitle} onChange={(event) => setCategoryTitle(event.target.value)} placeholder="Nama kategori" className="min-w-0 flex-1 rounded-2xl border border-blue-100 px-4 py-3 outline-none focus:border-blue-400" />
            <button onClick={async () => { if (!categoryTitle.trim()) return; if (await request("POST", { type: "category", title: categoryTitle, icon: "layers", sortOrder: categories.length })) setCategoryTitle(""); }} className="rounded-2xl bg-blue-600 px-4 text-white"><FiPlus /></button>
          </div>}
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category.id} className="rounded-2xl border border-blue-100 p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_110px_auto]">
                  <input disabled={!access.update} value={category.title} onChange={(event) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, title: event.target.value } : item))} className="rounded-xl bg-blue-50 px-3 py-2 font-bold disabled:opacity-70" />
                  <input disabled={!access.update} type="number" value={category.sortOrder} onChange={(event) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, sortOrder: Number(event.target.value) } : item))} className="rounded-xl bg-blue-50 px-3 py-2 disabled:opacity-70" />
                  <div className="flex gap-2">
                    {access.update && <button onClick={() => void request("PATCH", { type: "category", ...category })} className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><FiSave /></button>}
                    {access.delete && <button onClick={() => void removeCategory(category.id)} className="rounded-xl bg-rose-50 p-3 text-rose-600"><FiTrash2 /></button>}
                  </div>
                </div>
                <p className="mt-2 text-xs font-bold text-slate-400">{category.items.length} menu</p>
              </div>
            ))}
          </div>
        </div>

        {(access.create || access.update) && <form onSubmit={saveItem} className="space-y-4 rounded-4xl bg-white p-6 shadow-lg shadow-blue-900/5">
          <div className="flex items-center justify-between"><h2 className="text-xl font-black">{form.id ? "Edit Menu" : "Buat Menu"}</h2>{form.id && <button type="button" onClick={() => setForm({ ...emptyItem, categoryId: categories[0]?.id || "" })} className="text-xs font-black text-blue-600">Batal edit</button>}</div>
          <div className="grid gap-3 md:grid-cols-2">
            <input required value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} placeholder="Label menu" className="rounded-2xl border border-blue-100 px-4 py-3" />
            <input required value={form.href} onChange={(event) => setForm({ ...form, href: event.target.value })} placeholder="/admin/halaman" className="rounded-2xl border border-blue-100 px-4 py-3" />
            <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Deskripsi" className="rounded-2xl border border-blue-100 px-4 py-3" />
            <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white"><NavigationIcon name={form.icon} /></span><span className="text-sm font-black text-slate-700">{form.icon}</span></div>
            <select required value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} className="rounded-2xl border border-blue-100 px-4 py-3"><option value="">Pilih kategori</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}</select>
            <input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} placeholder="Urutan" className="rounded-2xl border border-blue-100 px-4 py-3" />
          </div>
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-wider text-blue-700">Pilih Icon</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {iconOptions.map(({ value, label, Icon }) => (
                <button key={value} type="button" onClick={() => setForm({ ...form, icon: value })} className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-[11px] font-black transition ${form.icon === value ? "border-blue-400 bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "border-blue-100 bg-blue-50/60 text-slate-600 hover:border-blue-300 hover:bg-white"}`}>
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-black uppercase text-blue-700">Permission</p>
              <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-2xl border border-blue-100 bg-blue-50/50 p-2">
                <button type="button" onClick={() => setForm({ ...form, requiredScopeId: "" })} className={`rounded-xl px-3 py-2 text-xs font-black ${!form.requiredScopeId ? "bg-blue-600 text-white" : "bg-white text-slate-600"}`}>Tanpa permission</button>
                {scopes.map((scope) => <button key={scope.id} type="button" onClick={() => setForm({ ...form, requiredScopeId: scope.id })} className={`rounded-xl px-3 py-2 text-xs font-black ${form.requiredScopeId === scope.id ? "bg-blue-600 text-white" : "bg-white text-slate-600"}`}>{scope.name}</button>)}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-black uppercase text-blue-700">Aksi Permission</p>
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-blue-100 bg-blue-50/50 p-2">
                {["read", "create", "update", "delete"].map((action) => <button key={action} type="button" onClick={() => setForm({ ...form, requiredAction: action })} className={`rounded-xl px-3 py-2 text-xs font-black capitalize ${form.requiredAction === action ? "bg-blue-600 text-white" : "bg-white text-slate-600"}`}>{action}</button>)}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-black uppercase text-blue-700">Role yang diizinkan</p>
              <MultiChoice options={roles} selected={form.roleIds} onChange={(roleIds) => setForm({ ...form, roleIds })} emptyText="Belum ada role" />
            </div>
            <div>
              <p className="mb-2 text-xs font-black uppercase text-blue-700">Akun khusus</p>
              <MultiChoice options={users} selected={form.userIds} onChange={(userIds) => setForm({ ...form, userIds })} emptyText="Belum ada akun" />
            </div>
          </div>
          <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 font-black text-white"><FiSave /> {form.id ? "Simpan Perubahan" : "Tambahkan Menu"}</button>
        </form>}
      </section>

      <section className="space-y-5">
        {categories.map((category) => (
          <div key={category.id} className="rounded-4xl bg-white p-5 shadow-lg shadow-blue-900/5">
            <h2 className="text-lg font-black">{category.title}</h2>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {category.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-blue-100 p-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700"><NavigationIcon name={item.icon} /></span>
                  <div className="min-w-0 flex-1"><p className="font-black">{item.label}</p><p className="truncate text-xs text-slate-500">{item.href} · {item.requiredScope?.name || "umum"}</p></div>
                  {access.update && <button onClick={() => editItem(item)} className="rounded-xl bg-blue-50 p-3 text-blue-700"><FiEdit3 /></button>}
                  {access.delete && <button onClick={() => void removeItem(item)} className="rounded-xl bg-rose-50 p-3 text-rose-600"><FiTrash2 /></button>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
