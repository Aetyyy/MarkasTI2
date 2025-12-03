export type Ratio = "16:9" | "9:16" | "1:1" | "4:3";

export type GalleryItem = {
  id: number;
  src: string;
  title: string;
  category: string;
  description?: string;
  year?: string;
  ratio: Ratio;
  resolution: string;
};

export type Jadwal = {
  id?: number;
  title: string;
  date: string;
  time?: string;
  description?: string;
  location?: string;
  createdAt?: Date;
};

export type StrukturKelas = {
  id?: number;
  name: string;
  role: string;
  photo?: string;
  year?: string;
  contact?: string;
};

export type Dosen = {
  id?: number;
  name: string;
  nip?: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt?: Date;
};

export type Attendance = {
  id?: number;
  dosenId: number;
  date: string;
  time: string;
  status: "hadir" | "tidak_hadir";
  keterangan?: string;
  createdAt?: Date;
};

export type KasMasuk = {
  id?: number;
  dosenId?: number;
  amount: number;
  description: string;
  paymentMethod: "cash" | "transfer" | "qrcode";
  qrcodeData?: string;
  date: string;
  createdAt?: Date;
};

export type KasKeluar = {
  id?: number;
  description: string;
  amount: number;
  category: string;
  date: string;
  approvedBy?: number;
  createdAt?: Date;
};

export type AdminUser = {
  id?: number;
  email: string;
  password: string;
  role: "admin" | "operator";
  createdAt?: Date;
};
