"use client";

import { FiCheck, FiMoon, FiSun } from "react-icons/fi";
import { RiComputerLine } from "react-icons/ri";
import { useTheme, type ThemePreference } from "./themeProvider";

const options: Array<{
  value: ThemePreference;
  label: string;
  icon: typeof FiSun;
}> = [
  { value: "light", label: "Terang", icon: FiSun },
  { value: "dark", label: "Gelap", icon: FiMoon },
  { value: "system", label: "Sistem", icon: RiComputerLine },
];

export default function ThemeToggle({
  variant = "icon",
  className = "",
}: {
  variant?: "icon" | "panel";
  className?: string;
}) {
  const { theme, resolvedTheme, mounted, setTheme, toggleTheme } = useTheme();

  if (variant === "panel") {
    return (
      <div
        className={`grid grid-cols-3 gap-2 rounded-3xl bg-slate-100 p-1.5 dark:bg-slate-950 ${className}`}
        aria-label="Pilih tema tampilan"
      >
        {options.map((option) => {
          const Icon = option.icon;
          const selected = mounted && theme === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={`relative flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-black transition-[color,background-color,transform] duration-200 active:scale-95 ${
                selected
                  ? "bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-300"
                  : "text-slate-500 hover:bg-white/60 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
              }`}
              aria-pressed={selected}
            >
              <Icon className="h-5 w-5" />
              {option.label}
              {selected && (
                <FiCheck className="absolute right-2 top-2 h-3.5 w-3.5 text-blue-600 dark:text-blue-300" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`themeToggle grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-blue-100 bg-white text-blue-700 shadow-sm transition-[color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-blue-50 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-amber-300 dark:hover:bg-slate-800 ${className}`}
      aria-label={
        resolvedTheme === "dark" ? "Aktifkan tema terang" : "Aktifkan tema gelap"
      }
      title={
        resolvedTheme === "dark" ? "Gunakan tema terang" : "Gunakan tema gelap"
      }
    >
      {!mounted ? (
        <span className="h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-700" />
      ) : resolvedTheme === "dark" ? (
        <FiSun className="h-5 w-5" />
      ) : (
        <FiMoon className="h-5 w-5" />
      )}
    </button>
  );
}
