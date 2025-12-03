"use client";

import { useEffect, useState } from "react";

interface DashboardStats {
  totalDosen: number;
  totalKehadiran: number;
  kasMasukTotal: number;
  kasKeluarTotal: number;
  saldoKas: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalDosen: 0,
    totalKehadiran: 0,
    kasMasukTotal: 0,
    kasKeluarTotal: 0,
    saldoKas: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [dosenRes, attendanceRes, kasMasukRes, kasKeluarRes] = await Promise.all([
          fetch("/api/dosen"),
          fetch("/api/attendance"),
          fetch("/api/kas-masuk"),
          fetch("/api/kas-keluar"),
        ]);

        const dosenData = await dosenRes.json();
        const attendanceData = await attendanceRes.json();
        const kasMasukData = await kasMasukRes.json();
        const kasKeluarData = await kasKeluarRes.json();

        const kasMasukTotal = kasMasukData.total || 0;
        const kasKeluarTotal = kasKeluarData.total || 0;

        setStats({
          totalDosen: dosenData.data?.length || 0,
          totalKehadiran: attendanceData.data?.length || 0,
          kasMasukTotal,
          kasKeluarTotal,
          saldoKas: kasMasukTotal - kasKeluarTotal,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="text-center py-8">Loading...</div>;

  const cards = [
    { label: "Total Dosen", value: stats.totalDosen, color: "bg-blue-500" },
    { label: "Total Kehadiran", value: stats.totalKehadiran, color: "bg-green-500" },
    { label: "Kas Masuk", value: `Rp ${stats.kasMasukTotal.toLocaleString()}`, color: "bg-emerald-500" },
    { label: "Kas Keluar", value: `Rp ${stats.kasKeluarTotal.toLocaleString()}`, color: "bg-orange-500" },
    { label: "Saldo Kas", value: `Rp ${stats.saldoKas.toLocaleString()}`, color: "bg-purple-500" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((card) => (
          <div key={card.label} className={`${card.color} text-white p-6 rounded-lg shadow-lg`}>
            <h3 className="text-sm font-semibold opacity-90">{card.label}</h3>
            <p className="text-3xl font-bold mt-2">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
