import * as XLSX from 'xlsx';
import { Book, Member, Loan, BookCategory, BOOK_CATEGORIES } from '../types/library';
import { generateInventoryCode, generateBookBarcode, generateMemberCode } from './barcode';

/**
 * Generates and downloads Excel template for book collection
 */
export function downloadBookExcelTemplate() {
  const sampleData = [
    {
      'Judul Buku': 'Matematika untuk SMP/MTs Kelas VII',
      'Pengarang': 'Tim Abdi Guru',
      'Penerbit': 'Erlangga',
      'Tahun Terbit': 2023,
      'Kategori': 'BUKU PAKET SISWA',
      'Nomor Klasifikasi DDC': '510',
      'ISBN': '978-602-298-501-1',
      'Lokasi Rak': 'Rak 01-A / Buku Paket',
      'Jumlah Eksemplar': 40,
      'Kondisi (Baik/Rusak Ringan/Rusak Berat/Hilang)': 'Baik',
      'Sumber Buku': 'BOS Perpustakaan',
      'Perkiraan Harga (Rp)': 65000,
      'Keterangan': 'Buku Kurikulum Merdeka Cetakan Revisi',
    },
    {
      'Judul Buku': 'Ilmu Pengetahuan Alam SMP Kelas VIII',
      'Pengarang': 'Victoriani Inabuy dkk.',
      'Penerbit': 'Pusat Kurikulum dan Perbukuan Kemendikbud',
      'Tahun Terbit': 2021,
      'Kategori': 'BUKU PAKET SISWA',
      'Nomor Klasifikasi DDC': '500',
      'ISBN': '978-602-244-785-6',
      'Lokasi Rak': 'Rak 01-B / Buku Paket',
      'Jumlah Eksemplar': 35,
      'Kondisi (Baik/Rusak Ringan/Rusak Berat/Hilang)': 'Baik',
      'Sumber Buku': 'BOS Perpustakaan',
      'Perkiraan Harga (Rp)': 58000,
      'Keterangan': 'Edisi Siswa Kemendikbudristek',
    },
    {
      'Judul Buku': 'Laskar Pelangi',
      'Pengarang': 'Andrea Hirata',
      'Penerbit': 'Bentang Pustaka',
      'Tahun Terbit': 2020,
      'Kategori': 'KODE 800: SASTRA',
      'Nomor Klasifikasi DDC': '813',
      'ISBN': '978-979-1227-89-6',
      'Lokasi Rak': 'Rak 05-A / Sastra',
      'Jumlah Eksemplar': 8,
      'Kondisi (Baik/Rusak Ringan/Rusak Berat/Hilang)': 'Baik',
      'Sumber Buku': 'Hibah/Sumbangan Alumni',
      'Perkiraan Harga (Rp)': 89000,
      'Keterangan': 'Novel Inspirasi Pendidikan',
    },
    {
      'Judul Buku': 'Ensiklopedi Sains Islami & Penemuan Muslim',
      'Pengarang': 'Dr. Ahmad Dahlan',
      'Penerbit': 'Mizan Pustaka',
      'Tahun Terbit': 2022,
      'Kategori': 'KODE 200: AGAMA',
      'Nomor Klasifikasi DDC': '297.2',
      'Lokasi Rak': 'Rak 02-C / Agama',
      'Jumlah Eksemplar': 5,
      'Kondisi (Baik/Rusak Ringan/Rusak Berat/Hilang)': 'Baik',
      'Sumber Buku': 'BOS Perpustakaan',
      'Perkiraan Harga (Rp)': 145000,
      'Keterangan': 'Koleksi Referensi Penunjang',
    },
    {
      'Judul Buku': 'Atlas Indonesia dan Dunia Edisi 38 Provinsi',
      'Pengarang': 'Drs. Supriadi',
      'Penerbit': 'Balai Pustaka',
      'Tahun Terbit': 2024,
      'Kategori': 'KODE 900: SEJARAH & GEOGRAFI',
      'Nomor Klasifikasi DDC': '912',
      'ISBN': '978-602-098-112-9',
      'Lokasi Rak': 'Rak 06-B / Geografi',
      'Jumlah Eksemplar': 10,
      'Kondisi (Baik/Rusak Ringan/Rusak Berat/Hilang)': 'Baik',
      'Sumber Buku': 'Pengadaan Mandiri',
      'Perkiraan Harga (Rp)': 120000,
      'Keterangan': 'Atlas Terbaru Pemekaran Wilayah',
    },
  ];

  // Worksheet instructions
  const instructions = [
    { 'PANDUAN PENGISIAN TEMPLATE EXCEL BUKU': 'PERPUSTAKAAN MEKAR SMPN 2 PEMALANG' },
    { 'PANDUAN PENGISIAN TEMPLATE EXCEL BUKU': '1. Jangan mengubah nama kolom pada header baris pertama.' },
    { 'PANDUAN PENGISIAN TEMPLATE EXCEL BUKU': '2. Kategori buku harus dipilih dari daftar resmi berikut:' },
    ...BOOK_CATEGORIES.map(cat => ({ 'PANDUAN PENGISIAN TEMPLATE EXCEL BUKU': `   - ${cat}` })),
    { 'PANDUAN PENGISIAN TEMPLATE EXCEL BUKU': '3. Kolom Kondisi diisi: Baik, Rusak Ringan, Rusak Berat, atau Hilang.' },
    { 'PANDUAN PENGISIAN TEMPLATE EXCEL BUKU': '4. Kode Inventaris dan Barcode akan dibuatkan secara otomatis oleh sistem.' },
  ];

  const wb = XLSX.utils.book_new();
  const wsData = XLSX.utils.json_to_sheet(sampleData);
  const wsGuide = XLSX.utils.json_to_sheet(instructions);

  XLSX.utils.book_append_sheet(wb, wsData, 'Data Buku');
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Panduan Pengisian');

  XLSX.writeFile(wb, 'Template_Koleksi_Buku_SMPN2Pemalang.xlsx');
}

/**
 * Parses uploaded Excel/CSV file for Books
 */
export async function parseBookExcelFile(file: File, existingBookCount: number): Promise<Book[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          throw new Error('File Excel kosong atau format tidak sesuai.');
        }

        const parsedBooks: Book[] = [];
        let seq = existingBookCount + 1;

        for (const row of rawJson) {
          const title = String(row['Judul Buku'] || row['Judul'] || row['title'] || '').trim();
          if (!title) continue;

          const author = String(row['Pengarang'] || row['Penulis'] || row['author'] || 'Anonim').trim();
          const publisher = String(row['Penerbit'] || row['publisher'] || 'Perpustakaan').trim();
          const publishYear = parseInt(row['Tahun Terbit'] || row['Tahun'] || '2023', 10) || 2023;
          
          let rawCategory = String(row['Kategori'] || row['category'] || 'BUKU PAKET SISWA').trim().toUpperCase();
          let matchedCategory: BookCategory = 'BUKU PAKET SISWA';
          const found = BOOK_CATEGORIES.find(c => c.toUpperCase().includes(rawCategory) || rawCategory.includes(c.toUpperCase()));
          if (found) {
            matchedCategory = found;
          } else if (rawCategory.includes('GURU')) {
            matchedCategory = 'BUKU PAKET GURU';
          } else if (rawCategory.includes('AUDIO')) {
            matchedCategory = 'AUDIO VISUAL';
          } else if (rawCategory.includes('ARTIKEL') || rawCategory.includes('JURNAL')) {
            matchedCategory = 'ARTIKEL/JURNAL';
          } else if (rawCategory.includes('500') || rawCategory.includes('SAINS') || rawCategory.includes('MATEMATIKA')) {
            matchedCategory = 'KODE 500: SAINS & MATEMATIKA';
          } else if (rawCategory.includes('800') || rawCategory.includes('SASTRA') || rawCategory.includes('NOVEL')) {
            matchedCategory = 'KODE 800: SASTRA';
          } else if (rawCategory.includes('200') || rawCategory.includes('AGAMA')) {
            matchedCategory = 'KODE 200: AGAMA';
          } else if (rawCategory.includes('300') || rawCategory.includes('SOSIAL')) {
            matchedCategory = 'KODE 300: ILMU SOSIAL';
          } else if (rawCategory.includes('400') || rawCategory.includes('BAHASA')) {
            matchedCategory = 'KODE 400: BAHASA';
          } else if (rawCategory.includes('700') || rawCategory.includes('SENI')) {
            matchedCategory = 'KODE 700: SENI & REKREASI';
          } else if (rawCategory.includes('900') || rawCategory.includes('SEJARAH') || rawCategory.includes('GEOGRAFI')) {
            matchedCategory = 'KODE 900: SEJARAH & GEOGRAFI';
          } else if (rawCategory.includes('100') || rawCategory.includes('FILSAFAT')) {
            matchedCategory = 'KODE 100: FILSAFAT & PSIKOLOGI';
          } else if (rawCategory.includes('000') || rawCategory.includes('KOMPUTER')) {
            matchedCategory = 'KODE 000: KARYA UMUM & KOMPUTER';
          }

          const ddcCode = String(row['Nomor Klasifikasi DDC'] || row['DDC'] || row['Klasifikasi'] || '000').trim();
          const isbn = String(row['ISBN'] || row['isbn'] || '-').trim();
          const rackLocation = String(row['Lokasi Rak'] || row['Rak'] || 'Rak Koleksi Umum').trim();
          const copiesTotal = Math.max(1, parseInt(row['Jumlah Eksemplar'] || row['Eksemplar'] || '1', 10) || 1);
          
          let conditionStr = String(row['Kondisi (Baik/Rusak Ringan/Rusak Berat/Hilang)'] || row['Kondisi'] || 'Baik').trim();
          let condition: Book['condition'] = 'Baik';
          if (conditionStr.toLowerCase().includes('rusak berat')) condition = 'Rusak Berat';
          else if (conditionStr.toLowerCase().includes('rusak')) condition = 'Rusak Ringan';
          else if (conditionStr.toLowerCase().includes('hilang')) condition = 'Hilang';

          const priceEstimated = parseInt(row['Perkiraan Harga (Rp)'] || row['Harga'] || '50000', 10) || 50000;
          const notes = String(row['Keterangan'] || row['Catatan'] || '').trim();

          const inventoryCode = generateInventoryCode(seq);
          const barcode = generateBookBarcode(seq);

          parsedBooks.push({
            id: `book-${Date.now()}-${seq}`,
            inventoryCode,
            barcode,
            isbn,
            title,
            author,
            publisher,
            publishYear,
            category: matchedCategory,
            ddcCode,
            rackLocation,
            copiesTotal,
            copiesAvailable: condition === 'Hilang' || condition === 'Rusak Berat' ? 0 : copiesTotal,
            condition,
            source: 'BOS Perpustakaan',
            priceEstimated,
            dateAdded: new Date().toISOString().split('T')[0],
            notes,
          });

          seq++;
        }

        resolve(parsedBooks);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Export Books to formatted Excel file
 */
export function exportBooksToExcel(books: Book[]) {
  const exportData = books.map((b, idx) => ({
    'No': idx + 1,
    'Kode Inventaris': b.inventoryCode,
    'Barcode': b.barcode,
    'Judul Buku': b.title,
    'Pengarang': b.author,
    'Penerbit': b.publisher,
    'Tahun': b.publishYear,
    'Kategori': b.category,
    'No. DDC': b.ddcCode,
    'Lokasi Rak': b.rackLocation,
    'Total Eks': b.copiesTotal,
    'Tersedia': b.copiesAvailable,
    'Kondisi': b.condition,
    'ISBN': b.isbn,
    'Sumber': b.source,
    'Estimasi Harga (Rp)': b.priceEstimated,
    'Tgl Input': b.dateAdded,
    'Catatan': b.notes || '-',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  XLSX.utils.book_append_sheet(wb, ws, 'Daftar Koleksi Buku');
  XLSX.writeFile(wb, `Koleksi_Buku_SMPN2Pemalang_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Downloads Member Excel Template
 */
export function downloadMemberExcelTemplate() {
  const sampleData = [
    {
      'Tipe Anggota (Siswa/Guru/Tenaga Kependidikan)': 'Siswa',
      'Nomor Identitas (NISN / NIP)': '0098765432',
      'Nama Lengkap': 'Aditya Pratama Nugraha',
      'Kelas / Jabatan': 'Kelas VIII.A',
      'Jenis Kelamin (Laki-laki / Perempuan)': 'Laki-laki',
      'Nomor WhatsApp / HP': '081234567890',
      'Email': 'aditya.pratama@siswa.smpn2pemalang.sch.id',
      'Alamat Rumah': 'Jl. Kenanga No. 12, Kebondalem, Pemalang',
    },
    {
      'Tipe Anggota (Siswa/Guru/Tenaga Kependidikan)': 'Siswa',
      'Nomor Identitas (NISN / NIP)': '0098765433',
      'Nama Lengkap': 'Aisyah Putri Azzahra',
      'Kelas / Jabatan': 'Kelas VII.B',
      'Jenis Kelamin (Laki-laki / Perempuan)': 'Perempuan',
      'Nomor WhatsApp / HP': '081398765432',
      'Email': 'aisyah.azzahra@siswa.smpn2pemalang.sch.id',
      'Alamat Rumah': 'Perum Pemalang Indah Blok C-5, Mulyoharjo',
    },
    {
      'Tipe Anggota (Siswa/Guru/Tenaga Kependidikan)': 'Guru',
      'Nomor Identitas (NISN / NIP)': '197805122005011004',
      'Nama Lengkap': 'Dra. Endang Sulistyowati, M.Pd.',
      'Kelas / Jabatan': 'Guru Bahasa Indonesia',
      'Jenis Kelamin (Laki-laki / Perempuan)': 'Perempuan',
      'Nomor WhatsApp / HP': '085290123456',
      'Email': 'endang.sulistyowati@guru.smpn2pemalang.sch.id',
      'Alamat Rumah': 'Jl. Sudirman No. 45, Bojongbata, Pemalang',
    },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleData);
  XLSX.utils.book_append_sheet(wb, ws, 'Template Anggota');
  XLSX.writeFile(wb, 'Template_Anggota_SMPN2Pemalang.xlsx');
}

/**
 * Parses uploaded Excel/CSV file for Members
 */
export async function parseMemberExcelFile(file: File, existingMemberCount: number): Promise<Member[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          throw new Error('File Excel kosong atau format tidak sesuai.');
        }

        const parsedMembers: Member[] = [];
        let seq = existingMemberCount + 1;

        for (const row of rawJson) {
          const name = String(row['Nama Lengkap'] || row['Nama'] || row['name'] || '').trim();
          if (!name) continue;

          let rawType = String(row['Tipe Anggota (Siswa/Guru/Tenaga Kependidikan)'] || row['Tipe'] || row['type'] || 'Siswa').trim();
          let type: Member['type'] = 'Siswa';
          if (rawType.toLowerCase().includes('guru')) type = 'Guru';
          else if (rawType.toLowerCase().includes('staf') || rawType.toLowerCase().includes('tenaga') || rawType.toLowerCase().includes('kependidikan')) {
            type = 'Tenaga Kependidikan';
          }

          const idNumber = String(row['Nomor Identitas (NISN / NIP)'] || row['NIS'] || row['NISN'] || row['NIP'] || '12345').trim();
          const classOrSubject = String(row['Kelas / Jabatan'] || row['Kelas'] || row['Jabatan'] || (type === 'Siswa' ? 'Kelas VII' : 'Guru Mapel')).trim();
          
          let genderStr = String(row['Jenis Kelamin (Laki-laki / Perempuan)'] || row['Jenis Kelamin'] || row['JK'] || 'Laki-laki').trim();
          const gender: Member['gender'] = genderStr.toLowerCase().startsWith('p') ? 'Perempuan' : 'Laki-laki';

          const phone = String(row['Nomor WhatsApp / HP'] || row['HP'] || row['Telepon'] || '-').trim();
          const email = String(row['Email'] || '').trim();
          const address = String(row['Alamat Rumah'] || row['Alamat'] || 'Pemalang').trim();

          const memberCode = generateMemberCode(type, seq);

          parsedMembers.push({
            id: `member-${Date.now()}-${seq}`,
            memberCode,
            idNumber,
            name,
            type,
            classOrSubject,
            gender,
            phone,
            email: email || undefined,
            address,
            joinDate: new Date().toISOString().split('T')[0],
            status: 'Aktif',
            activeLoansCount: 0,
          });

          seq++;
        }

        resolve(parsedMembers);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Export Members to Excel
 */
export function exportMembersToExcel(members: Member[]) {
  const exportData = members.map((m, idx) => ({
    'No': idx + 1,
    'Kode Anggota': m.memberCode,
    'Tipe': m.type,
    'NIS / NIP': m.idNumber,
    'Nama Lengkap': m.name,
    'Kelas / Mapel': m.classOrSubject,
    'Jenis Kelamin': m.gender,
    'No. WhatsApp': m.phone,
    'Email': m.email || '-',
    'Alamat': m.address,
    'Tgl Bergabung': m.joinDate,
    'Status': m.status,
    'Buku Sedang Dipinjam': m.activeLoansCount,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  XLSX.utils.book_append_sheet(wb, ws, 'Data Anggota Perpustakaan');
  XLSX.writeFile(wb, `Anggota_Perpustakaan_SMPN2Pemalang_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Export Circulation (Loans & Returns) to Excel
 */
export function exportLoansToExcel(loans: Loan[]) {
  const exportData = loans.map((l, idx) => ({
    'No': idx + 1,
    'Kode Transaksi': l.loanCode,
    'Barcode Buku': l.bookBarcode,
    'Judul Buku': l.bookTitle,
    'No. Inventaris': l.bookInventoryCode,
    'Kategori Buku': l.bookCategory,
    'Nama Peminjam': l.memberName,
    'Tipe Anggota': l.memberType,
    'Identitas (NIS/NIP)': l.memberIdNumber,
    'Kelas/Jabatan': l.memberClassOrSubject,
    'Tgl Pinjam': `${l.loanDate} ${l.loanTime}`,
    'Batas Waktu (Jatuh Tempo)': l.dueDate,
    'Tgl Kembali': l.returnDate ? `${l.returnDate} ${l.returnTime || ''}` : '-',
    'Status': l.status,
    'Terlambat (Hari)': l.daysLate > 0 ? l.daysLate : 0,
    'Nominal Denda (Rp)': l.fineAmount,
    'Status Denda': l.fineAmount > 0 ? (l.isFinePaid ? 'Lunas' : 'Belum Lunas') : 'Tidak Ada Denda',
    'Petugas Peminjaman': l.lentByStaff,
    'Petugas Pengembalian': l.returnedByStaff || '-',
    'Keterangan': l.notes || '-',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Sirkulasi');
  XLSX.writeFile(wb, `Laporan_Sirkulasi_SMPN2Pemalang_${new Date().toISOString().split('T')[0]}.xlsx`);
}
