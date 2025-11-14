import Link from 'next/link'
import Image from 'next/image'
import { RiArrowDropDownLine } from "react-icons/ri";

export default function navbar() {
    return (
        <div className='w-full shadow-xl bg-rose-600 fixed z-50'>
            <div className="mx-auto container px-4">
                <div className="flex flex-wrap justify-between items-center">
                    <Link href={'/'}>
                        <Image
                            preload
                            quality={75}
                            src={'/logo.webp'}
                            alt={'logo'}
                            width={0}
                            height={0}
                            style={{ width: '250px', height: 'auto' }}
                            unoptimized={true} />
                    </Link>
                    <div className="hidden md:flex px-4 text-white">
                        <div className="relative group inline-block">
                            <button className="flex items-center font-semibold px-1 hover:text-rose-300">
                                Tentang
                                <RiArrowDropDownLine className="transition-transform duration-200 group-hover:rotate-180 w-8 h-8" />
                            </button>
                            <div className="absolute left-0 top-full z-50 rounded-xl bg-white shadow-lg overflow-hidden max-h-0 transition-[max-height] duration-300 ease-in-out group-hover:max-h-40">
                                <Link href={"/"} className="block px-4 py-2 whitespace-nowrap font-semibold text-rose-600 hover:bg-rose-600 hover:text-white">
                                    Struktur Kelas
                                </Link>
                                <Link href={"/"} className="block px-4 py-2 font-semibold text-rose-600 hover:bg-rose-600 hover:text-white">
                                    Anggota
                                </Link>
                                <Link href={"/"} className="block px-4 py-2 font-semibold text-rose-600 hover:bg-rose-600 hover:text-white">
                                    Aturan
                                </Link>
                            </div>
                        </div>
                        <Link href={'/jadwal'} className="font-semibold px-1 py-1 mr-2 hover:text-rose-300">Jadwal</Link>
                        <Link href={'/gallery'} className="font-semibold px-1 py-1 hover:text-rose-300">Gallery</Link>
                    </div>
                    <div className="hidden md:flex space-x-5 px-4">
                        <div className="bg-white py-2 px-4 rounded-xl text-rose-600 font-medium hover:scale-105 duration-300 transition-all cursor-pointer">Login</div>
                        <div className="bg-rose-800 shadaow-md py-2 px-4 rounded-xl text-white font-medium hover:scale-105 duration-300 transition-all cursor-pointer">Register</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
