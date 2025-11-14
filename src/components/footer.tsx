export default function footer() {
    return (
        <footer className="border-t border-rose-100 bg-white bottom-0">
            <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex flex-wrap">
                    <div className="flex flex-col gap-8">
                        <span>© {new Date().getFullYear()} Kelas Teknik Informatika 2</span>
                        <span>Created by </span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
