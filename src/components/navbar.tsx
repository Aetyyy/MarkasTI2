"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { RiArrowDropDownLine } from "react-icons/ri";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isTentangOpen, setIsTentangOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen((prev) => {
            const next = !prev;
            if (!next) setIsTentangOpen(false);
            return next;
        });
    };

    return (
        <div className="w-full shadow-xl bg-rose-600 fixed z-50" onDragStart={(e) => e.preventDefault()}>
            <div className="mx-auto container px-4">
                <div className="flex flex-wrap justify-between items-center py-2">
                    <Link href={"/"}>
                        <Image
                            loading="eager"
                            quality={75}
                            src={"/logo.webp"}
                            alt={"logo"}
                            width={0}
                            height={0}
                            style={{ height: "auto" }}
                            unoptimized={true}
                            className="w-[180px] sm:w-[250px]"
                        />
                    </Link>

                    {/* Desktop */}
                    <div className="hidden md:flex px-4 text-white items-center">
                        <div className="relative group inline-block">
                            <button className="flex items-center font-semibold px-1 hover:text-rose-300">
                                Tentang
                                <RiArrowDropDownLine className="transition-transform duration-200 group-hover:rotate-180 w-8 h-8" />
                            </button>
                            <div className="absolute left-0 top-full z-50 rounded-xl bg-white shadow-lg overflow-hidden max-h-0 transition-[max-height] duration-300 ease-in-out group-hover:max-h-40">
                                <Link
                                    href={"/struktur-kelas"}
                                    className="block px-4 py-2 whitespace-nowrap font-semibold text-rose-600 hover:bg-rose-600 hover:text-white"
                                >
                                    Struktur Kelas
                                </Link>
                                <Link
                                    href={"/"}
                                    className="block px-4 py-2 font-semibold text-rose-600 hover:bg-rose-600 hover:text-white"
                                >
                                    Anggota
                                </Link>
                                <Link
                                    href={"/"}
                                    className="block px-4 py-2 font-semibold text-rose-600 hover:bg-rose-600 hover:text-white"
                                >
                                    Aturan
                                </Link>
                            </div>
                        </div>
                        <Link
                            href={"/jadwal"}
                            className="font-semibold px-1 py-1 mr-2 hover:text-rose-300"
                        >
                            Jadwal
                        </Link>
                        <Link
                            href={"/gallery"}
                            className="font-semibold px-1 py-1 hover:text-rose-300"
                        >
                            Gallery
                        </Link>
                    </div>

                    {/* Button Auth - Desktop */}
                    <div className="hidden md:flex space-x-5 px-4">
                        <div className="bg-white py-2 px-4 rounded-xl text-rose-600 font-medium hover:scale-105 duration-300 transition-all cursor-pointer">
                            Login
                        </div>
                    </div>

                    {/* Hamburger */}
                    <button
                        type="button"
                        className="md:hidden flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border border-white/40"
                        onClick={toggleMenu}
                        aria-label="Toggle menu"
                    >
                        <span className={`block h-0.5 w-6 bg-white rounded-full transform transition duration-300 ${isOpen ? "translate-y-2 rotate-45" : ""}`} />
                        <span className={`block h-0.5 w-6 bg-white rounded-full transition duration-300 ${isOpen ? "opacity-0" : "opacity-100"}`} />
                        <span className={`block h-0.5 w-6 bg-white rounded-full transform transition duration-300 ${isOpen ? "-translate-y-2 -rotate-45" : ""}`} />
                    </button>
                </div>

                {/* Dropdown */}
                <div className={`md:hidden overflow-hidden transition-all duration-300 origin-top ${isOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"}`}>
                    <div className="flex flex-col gap-2 pb-4 text-white font-semibold">
                        <div className="border-t border-rose-500">
                            <button
                                type="button"
                                onClick={() => setIsTentangOpen((prev) => !prev)}
                                className="flex w-full items-center justify-between"
                            >
                                <p className="text-xs uppercase tracking-wide text-rose-100">
                                    Tentang
                                </p>
                                <RiArrowDropDownLine
                                    className={`w-6 h-6 transition-transform duration-300 ${isTentangOpen ? "rotate-180" : null}`} />
                            </button>
                            <div className={`pl-1 flex flex-col gap-1 overflow-hidden transition-all duration-300 
                                ${isTentangOpen ? "max-h-32 opacity-100" : "max-h-0 opacity-0"}`}>
                                <Link href={"/struktur-kelas"} className="hover:text-rose-200 text-sm">
                                    Struktur Kelas
                                </Link>
                                <Link href={"/"} className="hover:text-rose-200 text-sm">
                                    Anggota
                                </Link>
                                <Link href={"/"} className="hover:text-rose-200 text-sm">
                                    Aturan
                                </Link>
                            </div>
                        </div>
                        <div className="border-t border-rose-500 flex flex-col gap-1">
                            <Link href={"/jadwal"} className="hover:text-rose-200">
                                Jadwal
                            </Link>
                            <Link href={"/gallery"} className="hover:text-rose-200">
                                Gallery
                            </Link>
                        </div>
                        <div className="border-t border-rose-500 pt-3 flex flex-col gap-2">
                            <div className="bg-white py-2 px-4 rounded-xl text-rose-600 font-medium text-center">
                                Login
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
