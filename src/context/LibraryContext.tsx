import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Book,
  Member,
  Loan,
  CirculationSettings,
  VisitorLog,
  LiteracyJournal,
  BookReviewContest,
  LiteracyAmbassador,
  ReadingCornerClass,
  StaffDuty,
  AnnualWorkPlan,
  BudgetLog,
  BookCondition,
  SchoolInfo,
  INITIAL_SCHOOL_INFO,
} from '../types/library';
import {
  INITIAL_SETTINGS,
  INITIAL_BOOKS,
  INITIAL_MEMBERS,
  INITIAL_LOANS,
  INITIAL_VISITOR_LOGS,
  INITIAL_LITERACY_JOURNALS,
  INITIAL_CONTEST_ENTRIES,
  INITIAL_AMBASSADORS,
  INITIAL_READING_CORNERS,
  INITIAL_STAFF_DUTIES,
  INITIAL_ANNUAL_PLANS,
  INITIAL_BUDGET_LOGS,
} from '../data/initialData';
import { generateInventoryCode, generateBookBarcode, generateMemberCode } from '../utils/barcode';

interface LibraryContextType {
  schoolInfo: SchoolInfo;
  updateSchoolInfo: (info: Partial<SchoolInfo>) => void;
  books: Book[];
  members: Member[];
  loans: Loan[];
  settings: CirculationSettings;
  visitors: VisitorLog[];
  literacyJournals: LiteracyJournal[];
  contestEntries: BookReviewContest[];
  ambassadors: LiteracyAmbassador[];
  readingCorners: ReadingCornerClass[];
  staffDuties: StaffDuty[];
  annualPlans: AnnualWorkPlan[];
  budgetLogs: BudgetLog[];

  // Books Actions
  addBook: (bookData: Omit<Book, 'id' | 'inventoryCode' | 'barcode' | 'copiesAvailable' | 'dateAdded'>) => Book;
  addBooksBatch: (newBooks: Book[]) => void;
  updateBook: (id: string, updates: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  markBookCondition: (id: string, condition: BookCondition, notes?: string) => void;

  // Members Actions
  addMember: (memberData: Omit<Member, 'id' | 'memberCode' | 'joinDate' | 'status' | 'activeLoansCount'>) => Member;
  addMembersBatch: (newMembers: Member[]) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;

  // Circulation Actions
  borrowBook: (params: {
    bookId: string;
    memberId: string;
    customDurationDays?: number;
    notes?: string;
    staffName?: string;
  }) => { success: boolean; message: string; loan?: Loan };
  
  returnBook: (params: {
    loanId: string;
    isFinePaid?: boolean;
    returnedByStaff?: string;
    notes?: string;
  }) => { success: boolean; message: string; fineAmount: number };

  updateSettings: (newSettings: Partial<CirculationSettings>) => void;

  // Visitors Actions
  addVisitor: (visitorData: Omit<VisitorLog, 'id' | 'date' | 'time'>) => void;

  // Literacy Actions
  addLiteracyJournal: (journalData: Omit<LiteracyJournal, 'id' | 'date' | 'teacherVerified'>) => void;
  verifyLiteracyJournal: (id: string) => void;
  addContestEntry: (entryData: Omit<BookReviewContest, 'id' | 'submissionDate'>) => void;
  updateContestEntry: (id: string, updates: Partial<BookReviewContest>) => void;
  updateReadingCornerScore: (id: string, score: number, status: ReadingCornerClass['status']) => void;

  // Admin Actions
  addBudgetLog: (logData: Omit<BudgetLog, 'id' | 'date'>) => void;
  updateAnnualPlanStatus: (id: string, status: AnnualWorkPlan['status']) => void;
  resetAllData: () => void;
  getCompleteBackupPayload: () => any;
  restoreBackupData: (payload: any) => { success: boolean; message: string };
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SCHOOL_INFO: 'smpn2pml_school_info',
  BOOKS: 'smpn2pml_books',
  MEMBERS: 'smpn2pml_members',
  LOANS: 'smpn2pml_loans',
  SETTINGS: 'smpn2pml_settings',
  VISITORS: 'smpn2pml_visitors',
  JOURNALS: 'smpn2pml_journals',
  CONTESTS: 'smpn2pml_contests',
  AMBASSADORS: 'smpn2pml_ambassadors',
  CORNERS: 'smpn2pml_corners',
  STAFF: 'smpn2pml_staff',
  PLANS: 'smpn2pml_plans',
  BUDGET: 'smpn2pml_budget',
};

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SCHOOL_INFO);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_SCHOOL_INFO,
          ...parsed,
          dinasName:
            parsed.dinasName && parsed.dinasName !== 'DINAS PENDIDIKAN DAN KEBUDAYAAN'
              ? parsed.dinasName
              : INITIAL_SCHOOL_INFO.dinasName,
        };
      }
      return INITIAL_SCHOOL_INFO;
    } catch {
      return INITIAL_SCHOOL_INFO;
    }
  });

  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BOOKS);
      return saved ? JSON.parse(saved) : INITIAL_BOOKS;
    } catch {
      return INITIAL_BOOKS;
    }
  });

  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
    } catch {
      return INITIAL_MEMBERS;
    }
  });

  const [loans, setLoans] = useState<Loan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOANS);
      return saved ? JSON.parse(saved) : INITIAL_LOANS;
    } catch {
      return INITIAL_LOANS;
    }
  });

  const [settings, setSettings] = useState<CirculationSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [visitors, setVisitors] = useState<VisitorLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VISITORS);
      return saved ? JSON.parse(saved) : INITIAL_VISITOR_LOGS;
    } catch {
      return INITIAL_VISITOR_LOGS;
    }
  });

  const [literacyJournals, setLiteracyJournals] = useState<LiteracyJournal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.JOURNALS);
      return saved ? JSON.parse(saved) : INITIAL_LITERACY_JOURNALS;
    } catch {
      return INITIAL_LITERACY_JOURNALS;
    }
  });

  const [contestEntries, setContestEntries] = useState<BookReviewContest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONTESTS);
      return saved ? JSON.parse(saved) : INITIAL_CONTEST_ENTRIES;
    } catch {
      return INITIAL_CONTEST_ENTRIES;
    }
  });

  const [ambassadors] = useState<LiteracyAmbassador[]>(INITIAL_AMBASSADORS);
  const [readingCorners, setReadingCorners] = useState<ReadingCornerClass[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CORNERS);
      return saved ? JSON.parse(saved) : INITIAL_READING_CORNERS;
    } catch {
      return INITIAL_READING_CORNERS;
    }
  });

  const [staffDuties, setStaffDuties] = useState<StaffDuty[]>(INITIAL_STAFF_DUTIES);
  const [annualPlans, setAnnualPlans] = useState<AnnualWorkPlan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PLANS);
      return saved ? JSON.parse(saved) : INITIAL_ANNUAL_PLANS;
    } catch {
      return INITIAL_ANNUAL_PLANS;
    }
  });

  const [budgetLogs, setBudgetLogs] = useState<BudgetLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BUDGET);
      return saved ? JSON.parse(saved) : INITIAL_BUDGET_LOGS;
    } catch {
      return INITIAL_BUDGET_LOGS;
    }
  });

  // Save to localStorage when states update
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCHOOL_INFO, JSON.stringify(schoolInfo));
  }, [schoolInfo]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VISITORS, JSON.stringify(visitors));
  }, [visitors]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.JOURNALS, JSON.stringify(literacyJournals));
  }, [literacyJournals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONTESTS, JSON.stringify(contestEntries));
  }, [contestEntries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CORNERS, JSON.stringify(readingCorners));
  }, [readingCorners]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(annualPlans));
  }, [annualPlans]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(budgetLogs));
  }, [budgetLogs]);

  // Recalculate overdues on mount or date change
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(todayStr);

    setLoans((prevLoans) =>
      prevLoans.map((loan) => {
        if (loan.status === 'Kembali') return loan;

        const dueDate = new Date(loan.dueDate);
        const diffTime = today.getTime() - dueDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
          const fineAmount = settings.enableFines ? diffDays * settings.finePerDay : 0;
          return {
            ...loan,
            status: 'Terlambat',
            daysLate: diffDays,
            fineAmount,
          };
        } else {
          return {
            ...loan,
            status: 'Dipinjam',
            daysLate: 0,
            fineAmount: 0,
          };
        }
      })
    );
  }, [settings.enableFines, settings.finePerDay]);

  // Book management
  const addBook = (
    bookData: Omit<Book, 'id' | 'inventoryCode' | 'barcode' | 'copiesAvailable' | 'dateAdded'>
  ): Book => {
    const seq = books.length + 1;
    const inventoryCode = generateInventoryCode(seq);
    const barcode = generateBookBarcode(seq);
    const copiesAvailable =
      bookData.condition === 'Hilang' || bookData.condition === 'Rusak Berat' ? 0 : bookData.copiesTotal;

    const newBook: Book = {
      ...bookData,
      id: `bk-${Date.now()}-${seq}`,
      inventoryCode,
      barcode,
      copiesAvailable,
      dateAdded: new Date().toISOString().split('T')[0],
    };

    setBooks((prev) => [newBook, ...prev]);
    return newBook;
  };

  const addBooksBatch = (newBooks: Book[]) => {
    setBooks((prev) => [...newBooks, ...prev]);
  };

  const updateBook = (id: string, updates: Partial<Book>) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        return { ...b, ...updates };
      })
    );
  };

  const deleteBook = (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
  };

  const markBookCondition = (id: string, condition: BookCondition, notes?: string) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const copiesAvailable =
          condition === 'Hilang' || condition === 'Rusak Berat' ? 0 : b.copiesAvailable;
        return {
          ...b,
          condition,
          copiesAvailable,
          notes: notes ? `${b.notes ? b.notes + ' | ' : ''}${notes}` : b.notes,
        };
      })
    );
  };

  // Member management
  const addMember = (
    memberData: Omit<Member, 'id' | 'memberCode' | 'joinDate' | 'status' | 'activeLoansCount'>
  ): Member => {
    const seq = members.length + 1;
    const memberCode = generateMemberCode(memberData.type, seq);

    const newMember: Member = {
      ...memberData,
      id: `mem-${Date.now()}-${seq}`,
      memberCode,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'Aktif',
      activeLoansCount: 0,
    };

    setMembers((prev) => [newMember, ...prev]);
    return newMember;
  };

  const addMembersBatch = (newMembers: Member[]) => {
    setMembers((prev) => [...newMembers, ...prev]);
  };

  const updateMember = (id: string, updates: Partial<Member>) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        return { ...m, ...updates };
      })
    );
  };

  const deleteMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  // Circulation: Borrow Book
  const borrowBook = (params: {
    bookId: string;
    memberId: string;
    customDurationDays?: number;
    notes?: string;
    staffName?: string;
  }) => {
    const targetBook = books.find((b) => b.id === params.bookId);
    if (!targetBook) {
      return { success: false, message: 'Buku tidak ditemukan di sistem katalog.' };
    }

    if (targetBook.copiesAvailable <= 0) {
      return { success: false, message: 'Buku ini sedang tidak tersedia (semua eksemplar sedang dipinjam).' };
    }

    if (targetBook.condition === 'Rusak Berat' || targetBook.condition === 'Hilang') {
      return { success: false, message: `Buku tidak dapat dipinjam karena kondisi berstatus "${targetBook.condition}".` };
    }

    const targetMember = members.find((m) => m.id === params.memberId);
    if (!targetMember) {
      return { success: false, message: 'Data anggota tidak ditemukan.' };
    }

    if (targetMember.status !== 'Aktif') {
      return { success: false, message: 'Kartu anggota berstatus Nonaktif.' };
    }

    const maxLimit = targetMember.type === 'Guru' ? settings.maxBooksTeacher : settings.maxBooksStudent;
    if (targetMember.activeLoansCount >= maxLimit) {
      return {
        success: false,
        message: `Batas maksimal pinjam untuk ${targetMember.type} (${maxLimit} buku) telah tercapai. Harap kembalikan buku sebelumnya.`,
      };
    }

    // Calculate dates
    const now = new Date();
    const loanDate = now.toISOString().split('T')[0];
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const loanTime = `${hours}:${minutes}`;

    const durationDays =
      params.customDurationDays && params.customDurationDays > 0
        ? params.customDurationDays
        : targetMember.type === 'Guru'
        ? settings.teacherLoanDurationDays
        : settings.studentLoanDurationDays;

    const dueDateObj = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const dueDate = dueDateObj.toISOString().split('T')[0];

    const loanSeq = loans.length + 1;
    const loanCode = `PJ-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      loanSeq
    ).padStart(4, '0')}`;

    const newLoan: Loan = {
      id: `loan-${Date.now()}-${loanSeq}`,
      loanCode,
      bookId: targetBook.id,
      bookTitle: targetBook.title,
      bookInventoryCode: targetBook.inventoryCode,
      bookBarcode: targetBook.barcode,
      bookCategory: targetBook.category,
      memberId: targetMember.id,
      memberName: targetMember.name,
      memberType: targetMember.type,
      memberIdNumber: targetMember.idNumber,
      memberClassOrSubject: targetMember.classOrSubject,
      loanDate,
      loanTime,
      dueDate,
      status: 'Dipinjam',
      daysLate: 0,
      fineAmount: 0,
      isFinePaid: false,
      notes: params.notes || '',
      lentByStaff: params.staffName || 'Bambang Tri Atmojo, S.I.Pust.',
    };

    // Update book available copies
    setBooks((prev) =>
      prev.map((b) => (b.id === targetBook.id ? { ...b, copiesAvailable: b.copiesAvailable - 1 } : b))
    );

    // Update member active count
    setMembers((prev) =>
      prev.map((m) => (m.id === targetMember.id ? { ...m, activeLoansCount: m.activeLoansCount + 1 } : m))
    );

    // Append loan
    setLoans((prev) => [newLoan, ...prev]);

    return {
      success: true,
      message: `Peminjaman berhasil dicatat! Batas waktu pengembalian: ${dueDate} (${durationDays} hari).`,
      loan: newLoan,
    };
  };

  // Circulation: Return Book
  const returnBook = (params: {
    loanId: string;
    isFinePaid?: boolean;
    returnedByStaff?: string;
    notes?: string;
  }) => {
    const loan = loans.find((l) => l.id === params.loanId);
    if (!loan) {
      return { success: false, message: 'Transaksi peminjaman tidak ditemukan.', fineAmount: 0 };
    }

    if (loan.status === 'Kembali') {
      return { success: false, message: 'Buku ini sudah tercatat telah dikembalikan sebelumnya.', fineAmount: 0 };
    }

    const now = new Date();
    const returnDate = now.toISOString().split('T')[0];
    const returnTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Recalculate late days
    const dueDate = new Date(loan.dueDate);
    const actualReturn = new Date(returnDate);
    const diffDays = Math.ceil((actualReturn.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysLate = Math.max(0, diffDays);
    const fineAmount = settings.enableFines ? daysLate * settings.finePerDay : 0;

    // Update loan
    setLoans((prev) =>
      prev.map((l) => {
        if (l.id !== params.loanId) return l;
        return {
          ...l,
          status: 'Kembali',
          returnDate,
          returnTime,
          daysLate,
          fineAmount,
          isFinePaid: fineAmount > 0 ? (params.isFinePaid ?? true) : true,
          returnedByStaff: params.returnedByStaff || 'Bambang Tri Atmojo, S.I.Pust.',
          notes: params.notes ? `${l.notes ? l.notes + ' | ' : ''}${params.notes}` : l.notes,
        };
      })
    );

    // Restore book availability
    setBooks((prev) =>
      prev.map((b) => (b.id === loan.bookId ? { ...b, copiesAvailable: Math.min(b.copiesTotal, b.copiesAvailable + 1) } : b))
    );

    // Decrement member active loan count
    setMembers((prev) =>
      prev.map((m) =>
        m.id === loan.memberId ? { ...m, activeLoansCount: Math.max(0, m.activeLoansCount - 1) } : m
      )
    );

    // If fine collected and paid, add to budget log
    if (fineAmount > 0 && params.isFinePaid) {
      const budgetEntry: BudgetLog = {
        id: `bdg-${Date.now()}`,
        date: returnDate,
        type: 'Pemasukan',
        category: 'Denda Buku',
        amount: fineAmount,
        description: `Denda keterlambatan buku "${loan.bookTitle}" (${daysLate} hari) oleh ${loan.memberName}`,
        receiptNumber: `KWT-DND/${returnDate.replace(/-/g, '')}/${loan.loanCode.slice(-4)}`,
      };
      setBudgetLogs((prev) => [budgetEntry, ...prev]);
    }

    return {
      success: true,
      message:
        daysLate > 0
          ? `Buku berhasil dikembalikan. Terlambat ${daysLate} hari. Total denda: Rp ${fineAmount.toLocaleString('id-ID')}.`
          : 'Buku berhasil dikembalikan tepat waktu!',
      fineAmount,
    };
  };

  const updateSettings = (newSettings: Partial<CirculationSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Visitors
  const addVisitor = (visitorData: Omit<VisitorLog, 'id' | 'date' | 'time'>) => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newVisitor: VisitorLog = {
      ...visitorData,
      id: `vis-${Date.now()}`,
      date,
      time,
    };
    setVisitors((prev) => [newVisitor, ...prev]);
  };

  // Literacy
  const addLiteracyJournal = (journalData: Omit<LiteracyJournal, 'id' | 'date' | 'teacherVerified'>) => {
    const date = new Date().toISOString().split('T')[0];
    const newJournal: LiteracyJournal = {
      ...journalData,
      id: `lit-${Date.now()}`,
      date,
      teacherVerified: false,
    };
    setLiteracyJournals((prev) => [newJournal, ...prev]);
  };

  const verifyLiteracyJournal = (id: string) => {
    setLiteracyJournals((prev) =>
      prev.map((j) => (j.id === id ? { ...j, teacherVerified: true } : j))
    );
  };

  const addContestEntry = (entryData: Omit<BookReviewContest, 'id' | 'submissionDate'>) => {
    const date = new Date().toISOString().split('T')[0];
    const newEntry: BookReviewContest = {
      ...entryData,
      id: `rev-${Date.now()}`,
      submissionDate: date,
    };
    setContestEntries((prev) => [newEntry, ...prev]);
  };

  const updateContestEntry = (id: string, updates: Partial<BookReviewContest>) => {
    setContestEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const updateReadingCornerScore = (id: string, score: number, status: ReadingCornerClass['status']) => {
    const today = new Date().toISOString().split('T')[0];
    setReadingCorners((prev) =>
      prev.map((c) => (c.id === id ? { ...c, score, status, lastInspected: today } : c))
    );
  };

  // Admin
  const addBudgetLog = (logData: Omit<BudgetLog, 'id' | 'date'>) => {
    const date = new Date().toISOString().split('T')[0];
    const newLog: BudgetLog = {
      ...logData,
      id: `bdg-${Date.now()}`,
      date,
    };
    setBudgetLogs((prev) => [newLog, ...prev]);
  };

  const updateAnnualPlanStatus = (id: string, status: AnnualWorkPlan['status']) => {
    setAnnualPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );
  };

  const updateSchoolInfo = (info: Partial<SchoolInfo>) => {
    setSchoolInfo((prev) => ({ ...prev, ...info }));
  };

  const resetAllData = () => {
    localStorage.clear();
    setSchoolInfo(INITIAL_SCHOOL_INFO);
    setBooks(INITIAL_BOOKS);
    setMembers(INITIAL_MEMBERS);
    setLoans(INITIAL_LOANS);
    setSettings(INITIAL_SETTINGS);
    setVisitors(INITIAL_VISITOR_LOGS);
    setLiteracyJournals(INITIAL_LITERACY_JOURNALS);
    setContestEntries(INITIAL_CONTEST_ENTRIES);
    setReadingCorners(INITIAL_READING_CORNERS);
    setAnnualPlans(INITIAL_ANNUAL_PLANS);
    setBudgetLogs(INITIAL_BUDGET_LOGS);
  };

  const getCompleteBackupPayload = () => {
    return {
      version: '1.0.0',
      appName: 'Sistem Informasi Perpustakaan SMPN 2 Pemalang (Perpustakaan Mekar)',
      npsn: schoolInfo.npsn,
      schoolName: schoolInfo.name,
      libraryName: schoolInfo.libraryName,
      backupTimestamp: new Date().toISOString(),
      backupDateFormatted: new Date().toLocaleString('id-ID', {
        dateStyle: 'full',
        timeStyle: 'medium',
      }),
      googleDriveFolderId: '1fTbLPY6P0GnSf9M6Rp8NTHw8olI5AACj',
      counts: {
        totalBooks: books.length,
        totalCopies: books.reduce((acc, b) => acc + (b.copiesTotal || 1), 0),
        totalMembers: members.length,
        totalLoans: loans.length,
        activeLoans: loans.filter((l) => l.status === 'Dipinjam' || l.status === 'Terlambat').length,
        totalVisitors: visitors.length,
        totalBudgetLogs: budgetLogs.length,
      },
      data: {
        schoolInfo,
        books,
        members,
        loans,
        settings,
        visitors,
        literacyJournals,
        contestEntries,
        readingCorners,
        staffDuties,
        annualPlans,
        budgetLogs,
      },
    };
  };

  const restoreBackupData = (payload: any): { success: boolean; message: string } => {
    try {
      const data = payload?.data || payload;
      if (!data || (!data.books && !data.members && !data.schoolInfo)) {
        return {
          success: false,
          message: 'Format data cadangan tidak dikenali atau berkas cadangan rusak.',
        };
      }

      if (data.schoolInfo) setSchoolInfo(data.schoolInfo);
      if (Array.isArray(data.books)) setBooks(data.books);
      if (Array.isArray(data.members)) setMembers(data.members);
      if (Array.isArray(data.loans)) setLoans(data.loans);
      if (data.settings) setSettings(data.settings);
      if (Array.isArray(data.visitors)) setVisitors(data.visitors);
      if (Array.isArray(data.literacyJournals)) setLiteracyJournals(data.literacyJournals);
      if (Array.isArray(data.contestEntries)) setContestEntries(data.contestEntries);
      if (Array.isArray(data.readingCorners)) setReadingCorners(data.readingCorners);
      if (Array.isArray(data.staffDuties)) setStaffDuties(data.staffDuties);
      if (Array.isArray(data.annualPlans)) setAnnualPlans(data.annualPlans);
      if (Array.isArray(data.budgetLogs)) setBudgetLogs(data.budgetLogs);

      return {
        success: true,
        message: 'Data perpustakaan berhasil dipulihkan secara menyeluruh dari cadangan!',
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal memulihkan data: ${err.message || 'Kesalahan parsing'}`,
      };
    }
  };

  return (
    <LibraryContext.Provider
      value={{
        schoolInfo,
        updateSchoolInfo,
        books,
        members,
        loans,
        settings,
        visitors,
        literacyJournals,
        contestEntries,
        ambassadors,
        readingCorners,
        staffDuties,
        annualPlans,
        budgetLogs,
        addBook,
        addBooksBatch,
        updateBook,
        deleteBook,
        markBookCondition,
        addMember,
        addMembersBatch,
        updateMember,
        deleteMember,
        borrowBook,
        returnBook,
        updateSettings,
        addVisitor,
        addLiteracyJournal,
        verifyLiteracyJournal,
        addContestEntry,
        updateContestEntry,
        updateReadingCornerScore,
        addBudgetLog,
        updateAnnualPlanStatus,
        resetAllData,
        getCompleteBackupPayload,
        restoreBackupData,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
