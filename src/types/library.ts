/**
 * Perpustakaan MEKAR SMP Negeri 2 Pemalang
 * NPSN: 20324292 | Jalan Pemuda No 34, Mulyoharjo, Pemalang
 */

export interface SchoolInfo {
  name: string;
  libraryName: string;
  motto: string;
  npsn: string;
  dinasName: string;
  address: string;
  postalCode: string;
  email: string;
  phone: string;
  headmaster: string;
  headmasterNip: string;
  headOfLibrary: string;
  headOfLibraryNip: string;
  chiefLibrarian: string;
  logoUrl: string;
}

export const INITIAL_SCHOOL_INFO: SchoolInfo = {
  name: "SMP NEGERI 2 PEMALANG",
  libraryName: "PERPUSTAKAAN MEKAR",
  motto: "Maju, Edukatif, Kreatif, Agamis, Ramah (MEKAR)",
  npsn: "20324292",
  dinasName: "DINAS PENDIDIKAN PEMUDA, DAN OLAHRAGA",
  address: "Jalan Pemuda No 34, Mulyoharjo, Pemalang, Jawa Tengah",
  postalCode: "52313",
  email: "perpustakaan.smpn2pemalang@gmail.com",
  phone: "(0284) 321456",
  headmaster: "Drs. H. Sukarno, M.Pd.",
  headmasterNip: "19750814 200003 1 002",
  headOfLibrary: "Siti Rahmawati, S.Pd., M.A.",
  headOfLibraryNip: "19820310 200801 2 015",
  chiefLibrarian: "Bambang Tri Atmojo, S.I.Pust.",
  logoUrl: "/assets/aistudio/image_f7aba063.png",
};

export const SCHOOL_INFO: SchoolInfo = INITIAL_SCHOOL_INFO;

export type BookCategory =
  | "BUKU PAKET SISWA"
  | "BUKU PAKET GURU"
  | "AUDIO VISUAL"
  | "ARTIKEL/JURNAL"
  | "KODE 000: KARYA UMUM & KOMPUTER"
  | "KODE 100: FILSAFAT & PSIKOLOGI"
  | "KODE 200: AGAMA"
  | "KODE 300: ILMU SOSIAL"
  | "KODE 400: BAHASA"
  | "KODE 500: SAINS & MATEMATIKA"
  | "KODE 700: SENI & REKREASI"
  | "KODE 800: SASTRA"
  | "KODE 900: SEJARAH & GEOGRAFI";

export const BOOK_CATEGORIES: BookCategory[] = [
  "BUKU PAKET SISWA",
  "BUKU PAKET GURU",
  "AUDIO VISUAL",
  "ARTIKEL/JURNAL",
  "KODE 000: KARYA UMUM & KOMPUTER",
  "KODE 100: FILSAFAT & PSIKOLOGI",
  "KODE 200: AGAMA",
  "KODE 300: ILMU SOSIAL",
  "KODE 400: BAHASA",
  "KODE 500: SAINS & MATEMATIKA",
  "KODE 700: SENI & REKREASI",
  "KODE 800: SASTRA",
  "KODE 900: SEJARAH & GEOGRAFI",
];

export type BookCondition = "Baik" | "Rusak Ringan" | "Rusak Berat" | "Hilang";

export interface Book {
  id: string;
  inventoryCode: string; // e.g. "INV-SMPN2PML/2026/001"
  barcode: string;       // e.g. "SMPN2PML-BK-0001"
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  publishYear: number;
  category: BookCategory;
  ddcCode: string;       // e.g. "500.1", "813", "297"
  rackLocation: string;  // e.g. "Rak 03-B / DDC 500"
  copiesTotal: number;
  copiesAvailable: number;
  condition: BookCondition;
  source: "BOS Perpustakaan" | "APBD" | "Hibah/Sumbangan Alumni" | "Pengadaan Mandiri";
  priceEstimated: number; // in IDR
  dateAdded: string;     // YYYY-MM-DD
  notes?: string;
  coverImage?: string;
}

export type MemberType = "Siswa" | "Guru" | "Tenaga Kependidikan";

export interface Member {
  id: string;
  memberCode: string;   // e.g. "AGT-SIS-2401"
  idNumber: string;     // NIS/NISN or NIP/NUPTK
  name: string;
  type: MemberType;
  classOrSubject: string; // e.g. "Kelas VIII.A" or "Guru Bahasa Indonesia"
  gender: "Laki-laki" | "Perempuan";
  phone: string;
  email?: string;
  address: string;
  joinDate: string;
  status: "Aktif" | "Nonaktif";
  activeLoansCount: number;
  photoUrl?: string;
}

export type LoanStatus = "Dipinjam" | "Kembali" | "Terlambat";

export interface Loan {
  id: string;
  loanCode: string;     // e.g. "PINJAM-202610-001"
  bookId: string;
  bookTitle: string;
  bookInventoryCode: string;
  bookBarcode: string;
  bookCategory: BookCategory;
  memberId: string;
  memberName: string;
  memberType: MemberType;
  memberIdNumber: string;
  memberClassOrSubject: string;
  loanDate: string;     // YYYY-MM-DD
  loanTime: string;     // HH:mm
  dueDate: string;      // YYYY-MM-DD
  returnDate?: string;  // YYYY-MM-DD
  returnTime?: string;  // HH:mm
  status: LoanStatus;
  daysLate: number;
  fineAmount: number;   // IDR
  isFinePaid: boolean;
  notes?: string;
  returnedByStaff?: string;
  lentByStaff: string;
}

export interface CirculationSettings {
  studentLoanDurationDays: number; // default 7
  teacherLoanDurationDays: number; // default 14
  finePerDay: number;              // e.g. 1000 IDR
  enableFines: boolean;
  maxBooksStudent: number;         // default 2
  maxBooksTeacher: number;         // default 5
}

export interface VisitorLog {
  id: string;
  date: string;         // YYYY-MM-DD
  time: string;         // HH:mm
  memberId?: string;
  name: string;
  type: MemberType | "Umum/Tamu";
  idNumber?: string;
  classOrDept: string;
  purpose:
    | "Membaca di Tempat"
    | "Peminjaman / Pengembalian Buku"
    | "Mencari Referensi / Tugas"
    | "Diskusi Kelompok"
    | "Pojok Literasi Digital"
    | "Kunjungan Kelas / Observasi";
  bookReadOnSite?: string;
  notes?: string;
}

export interface LiteracyJournal {
  id: string;
  studentName: string;
  studentClass: string;
  nis: string;
  date: string;
  bookTitle: string;
  author: string;
  pagesRead: string; // e.g. "Hal. 1-25"
  summary: string;
  moralValue: string;
  teacherVerified: boolean;
}

export interface BookReviewContest {
  id: string;
  contestTitle: string;
  studentName: string;
  studentClass: string;
  bookTitle: string;
  author: string;
  reviewText: string;
  ratingStars: number;
  submissionDate: string;
  score?: number;
  rank?: "Juara 1" | "Juara 2" | "Juara 3" | "Harapan 1" | "Peserta";
  feedback?: string;
}

export interface LiteracyAmbassador {
  id: string;
  name: string;
  classLevel: string;
  role: "Duta Literasi Utama" | "Duta Literasi Favorit" | "Duta Literasi Kreatif";
  period: string;
  achievements: string;
  favoriteBook: string;
  motto: string;
  photoUrl: string;
}

export interface ReadingCornerClass {
  id: string;
  className: string;      // e.g. "Kelas VII.A"
  homeroomTeacher: string; // Wali Kelas
  cornerName: string;     // e.g. "Griya Baca Ar-Razi"
  bookCount: number;
  score: number;          // 0-100
  lastInspected: string;
  status: "Sangat Aktif" | "Aktif" | "Cukup" | "Perlu Pembinaan";
}

export interface StaffDuty {
  id: string;
  name: string;
  nip: string;
  position: string;
  roleDescription: string;
  schedule: string;
  contact: string;
}

export interface AnnualWorkPlan {
  id: string;
  programName: string;
  category: "Pengadaan & Pengolahan" | "Pelayanan Sirkulasi" | "Literasi & Budaya Baca" | "Sarana & Prasarana" | "Manajemen & TI";
  targetTimeline: string;
  budgetAllocated: number;
  status: "Selesai" | "Sedang Berjalan" | "Direncanakan";
  personInCharge: string;
}

export interface BudgetLog {
  id: string;
  date: string;
  type: "Pemasukan" | "Pengeluaran";
  category: "Dana BOS Perpustakaan" | "Denda Buku" | "Sumbangan Sukarela" | "Pembelian Buku Baru" | "Perawatan / Jilid Buku" | "Pengadaan ATK & Barcode" | "Hadiah Lomba Literasi";
  amount: number;
  description: string;
  receiptNumber: string;
}
