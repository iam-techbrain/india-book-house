import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Package,
  Save,
  X,
  Ban,
  RefreshCw,
  Upload,
  Download,
  FileSpreadsheet,
  Eye,
  BookOpen,
  School
} from 'lucide-react';
import { studentsAPI, schoolsAPI, mastersAPI } from '../../services/api';

export default function StudentsManager() {
  const queryClient = useQueryClient();

  // Active form filter selections
  const [schoolId, setSchoolId] = useState('');
  const [classId, setClassId] = useState(1);
  const [sectionId, setSectionId] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Applied filters triggered explicitly by the Search button
  const [appliedFilters, setAppliedFilters] = useState({
    schoolId: '',
    classId: 1,
    sectionId: '',
    paymentStatus: ''
  });

  // Debounced auto-save timers & saving indicator state per student
  const saveTimeoutsRef = useRef({});
  const [savingStatus, setSavingStatus] = useState({});

  // Inline table edits for Concession & Paid Amount: { [studentId]: { concession, paid_amount, isDirty: boolean } }
  const [rowEdits, setRowEdits] = useState({});
  const [savingRows, setSavingRows] = useState({});

  // TanStack Query for dynamic Master Lookup Tables
  const { data: mastersData } = useQuery({
    queryKey: ['masters-all'],
    queryFn: async () => {
      const res = await mastersAPI.getAll();
      return res.data || {};
    }
  });
  const classesList = mastersData?.classes || [];

  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Details & Concessions Modal State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [checklistItems, setChecklistItems] = useState([]);
  const [concession, setConcession] = useState(0);
  const [concessionReason, setConcessionReason] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);

  // Register Student Modal
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    student_id: '',
    student_name: '',
    father_name: '',
    email: '',
    auto_check_all: false
  });

  // Excel Roster Upload State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadSchoolId, setUploadSchoolId] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);

  // TanStack Query for Schools Dropdown (Cached)
  const { data: schools = [] } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      const res = await schoolsAPI.getAll();
      return res.data || [];
    }
  });

  // Set default school when schools list is loaded
  useEffect(() => {
    if (schools.length > 0) {
      const isValidCurrentSchool = schools.some((s) => s.id === Number(schoolId));
      if (!schoolId || !isValidCurrentSchool) {
        setSchoolId(schools[0].id);
        setAppliedFilters((prev) => ({ ...prev, schoolId: schools[0].id }));
      }
      const isValidUploadSchool = schools.some((s) => s.id === Number(uploadSchoolId));
      if (!uploadSchoolId || !isValidUploadSchool) {
        setUploadSchoolId(String(schools[0].id));
      }
    }
  }, [schools, schoolId, uploadSchoolId]);

  // Current selected school object for curriculum & board auto-detection
  const currentSchool = schools.find((s) => s.id === Number(schoolId)) || schools[0];

  // TanStack Query for Student Roster using appliedFilters
  const {
    data: rosterData,
    isLoading: loading,
    refetch: refetchRoster
  } = useQuery({
    queryKey: [
      'students-roster',
      appliedFilters.schoolId,
      appliedFilters.classId,
      appliedFilters.sectionId,
      appliedFilters.paymentStatus
    ],
    queryFn: async () => {
      const params = {
        school_id: appliedFilters.schoolId,
        class_id: appliedFilters.classId,
        section_id: appliedFilters.sectionId
      };
      if (appliedFilters.paymentStatus) params.payment_status = appliedFilters.paymentStatus;

      const res = await studentsAPI.getRoster(params);
      return res.data || null;
    },
    enabled: hasSearched && Boolean(appliedFilters.schoolId)
  });

  // Handle explicit Search / Filter button click in the top filter bar
  const handleApplyFilter = (e) => {
    if (e) e.preventDefault();
    setHasSearched(true);
    setAppliedFilters({
      schoolId: Number(schoolId),
      classId: Number(classId),
      sectionId: sectionId ? Number(sectionId) : '',
      paymentStatus: paymentStatusFilter
    });
  };

  // TanStack Mutation for Updating Student Checklist via Details modal
  const updateChecklistMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      return await studentsAPI.updateChecklist(id, payload);
    },
    onSuccess: (res) => {
      setSuccessMsg(res?.message || 'Checklist updated successfully');
      setSelectedStudent(null);
      queryClient.invalidateQueries({ queryKey: ['students-roster'] });
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to update checklist');
    }
  });

  // Inline book checkbox toggle directly in the table row
  const handleInlineToggle = async (student, itemIndex) => {
    let items = student.items_checklist || [];
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch (e) { items = []; }
    }
    const updatedItems = items.map((it, idx) => {
      if (idx === itemIndex) {
        const newPurchased = !it.purchased;
        const price = parseFloat(it.price) || 0;
        const qty = parseInt(it.qty) || 1;
        return {
          ...it,
          purchased: newPurchased,
          status: newPurchased ? 'YES' : 'NO',
          reason: newPurchased ? 'Purchased' : 'Not purchased',
          subtotal: newPurchased ? (price * qty) : 0
        };
      }
      return it;
    });

    // Calculate real-time numbers locally
    const gross = updatedItems.reduce((acc, it) => acc + (parseFloat(it.subtotal) || 0), 0);
    const conc = parseFloat(student.concession) || 0;
    const net = Math.max(0, gross - conc);
    const paid = parseFloat(student.paid_amount) || 0;
    const due = Math.max(0, net - paid);
    let status = 'UNPAID';
    if (due === 0 && net > 0) status = 'PAID';
    else if (paid > 0 && due > 0) status = 'PARTIAL';

    // Optimistically update cached roster
    queryClient.setQueryData(
      [
        'students-roster',
        appliedFilters.schoolId,
        appliedFilters.classId,
        appliedFilters.sectionId,
        appliedFilters.paymentStatus
      ],
      (old) => {
        if (!old || !old.students) return old;
        const updatedStudents = old.students.map((s) => {
          if (s.id === student.id) {
            return {
              ...s,
              items_checklist: updatedItems,
              purchased_items_count: updatedItems.filter((i) => i.purchased).length,
              total_payment: gross,
              net_payable: net,
              due_amount: due,
              payment_status: status
            };
          }
          return s;
        });
        return { ...old, students: updatedStudents };
      }
    );

    // Debounced Auto-Save to avoid high-frequency database thrashing
    setSavingStatus((prev) => ({ ...prev, [student.id]: 'saving' }));

    if (saveTimeoutsRef.current[student.id]) {
      clearTimeout(saveTimeoutsRef.current[student.id]);
    }

    saveTimeoutsRef.current[student.id] = setTimeout(async () => {
      try {
        await studentsAPI.updateChecklist(student.id, { checked_items: updatedItems });
        setSavingStatus((prev) => ({ ...prev, [student.id]: 'saved' }));
        setTimeout(() => {
          setSavingStatus((prev) => {
            const next = { ...prev };
            delete next[student.id];
            return next;
          });
        }, 2000);
      } catch (err) {
        setErrorMsg(err.message || 'Failed to update item checklist');
        queryClient.invalidateQueries({ queryKey: ['students-roster'] });
        setSavingStatus((prev) => {
          const next = { ...prev };
          delete next[student.id];
          return next;
        });
      }
    }, 600);
  };

  // Inline Select All or Clear All for a student's row
  const handleInlineToggleAll = async (student, selectAll) => {
    let items = student.items_checklist || [];
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch (e) { items = []; }
    }
    const updatedItems = items.map((it) => {
      if (it.status === 'OUT_OF_STOCK') return it;
      const newPurchased = selectAll;
      const price = parseFloat(it.price) || 0;
      const qty = parseInt(it.qty) || 1;
      return {
        ...it,
        purchased: newPurchased,
        status: newPurchased ? 'YES' : 'NO',
        reason: newPurchased ? 'Purchased' : 'Not purchased',
        subtotal: newPurchased ? (price * qty) : 0
      };
    });

    const gross = updatedItems.reduce((acc, it) => acc + (parseFloat(it.subtotal) || 0), 0);
    const conc = parseFloat(student.concession) || 0;
    const net = Math.max(0, gross - conc);
    const paid = parseFloat(student.paid_amount) || 0;
    const due = Math.max(0, net - paid);
    let status = 'UNPAID';
    if (due === 0 && net > 0) status = 'PAID';
    else if (paid > 0 && due > 0) status = 'PARTIAL';

    queryClient.setQueryData(
      [
        'students-roster',
        appliedFilters.schoolId,
        appliedFilters.classId,
        appliedFilters.sectionId,
        appliedFilters.paymentStatus
      ],
      (old) => {
        if (!old || !old.students) return old;
        const updatedStudents = old.students.map((s) => {
          if (s.id === student.id) {
            return {
              ...s,
              items_checklist: updatedItems,
              purchased_items_count: updatedItems.filter((i) => i.purchased).length,
              total_payment: gross,
              net_payable: net,
              due_amount: due,
              payment_status: status
            };
          }
          return s;
        });
        return { ...old, students: updatedStudents };
      }
    );

    // Debounced Auto-Save for toggle all
    setSavingStatus((prev) => ({ ...prev, [student.id]: 'saving' }));

    if (saveTimeoutsRef.current[student.id]) {
      clearTimeout(saveTimeoutsRef.current[student.id]);
    }

    saveTimeoutsRef.current[student.id] = setTimeout(async () => {
      try {
        await studentsAPI.updateChecklist(student.id, { checked_items: updatedItems });
        setSavingStatus((prev) => ({ ...prev, [student.id]: 'saved' }));
        setTimeout(() => {
          setSavingStatus((prev) => {
            const next = { ...prev };
            delete next[student.id];
            return next;
          });
        }, 2000);
      } catch (err) {
        setErrorMsg(err.message || 'Failed to update all items');
        queryClient.invalidateQueries({ queryKey: ['students-roster'] });
        setSavingStatus((prev) => {
          const next = { ...prev };
          delete next[student.id];
          return next;
        });
      }
    }, 600);
  };

  // TanStack Mutation for Registering Student
  const registerStudentMutation = useMutation({
    mutationFn: async (payload) => {
      return await studentsAPI.register(payload);
    },
    onSuccess: (res) => {
      setSuccessMsg(res?.message || 'Student registered successfully');
      setHasSearched(true);
      setIsRegisterOpen(false);
      setRegisterForm({
        student_id: '',
        student_name: '',
        father_name: '',
        email: '',
        auto_check_all: false
      });
      queryClient.invalidateQueries({ queryKey: ['students-roster'] });
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to register student');
    }
  });

  // TanStack Mutation for Excel Upload
  const uploadRosterMutation = useMutation({
    mutationFn: async ({ schoolId: targetSchoolId, file }) => {
      const formData = new FormData();
      formData.append('school_id', targetSchoolId);
      formData.append('file', file);
      return await studentsAPI.uploadExcel(formData);
    },
    onSuccess: (res) => {
      const msg = res?.message || 'Students roster uploaded successfully!';
      setSuccessMsg(msg);
      setUploadStatus({ type: 'success', message: msg });
      const targetSchool = res?.data?.school_id || Number(uploadSchoolId) || Number(schoolId);
      if (targetSchool) {
        setSchoolId(Number(targetSchool));
        setAppliedFilters((prev) => ({ ...prev, schoolId: Number(targetSchool) }));
      }
      setHasSearched(true);
      setUploadFile(null);
      queryClient.invalidateQueries({ queryKey: ['students-roster'] });
      setTimeout(() => {
        setIsUploadOpen(false);
        setUploadStatus(null);
      }, 2000);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to upload students roster';
      setErrorMsg(msg);
      setUploadStatus({ type: 'error', message: msg });
    }
  });

  const handleUploadRoster = (e) => {
    e.preventDefault();
    if (!schools || schools.length === 0) {
      setUploadStatus({ type: 'error', message: 'No schools found in the list! Please register a school first.' });
      return;
    }
    const targetId = schools.some((s) => s.id === Number(uploadSchoolId))
      ? Number(uploadSchoolId)
      : (schools.some((s) => s.id === Number(schoolId)) ? Number(schoolId) : schools[0]?.id);
    if (!targetId) {
      setUploadStatus({ type: 'error', message: 'Please select a target school.' });
      return;
    }
    if (!uploadFile) {
      setUploadStatus({ type: 'error', message: 'Please select an Excel file to upload.' });
      return;
    }
    setUploadStatus(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    uploadRosterMutation.mutate({ schoolId: targetId, file: uploadFile });
  };

  const students = rosterData?.students || [];
  const finSummary = rosterData?.section_financial_summary;
  const curriculumInfo = rosterData?.class_curriculum;

  // Calculate aggregated financial summary considering any live row edits
  const displaySummary = useMemo(() => {
    if (!students || students.length === 0) return finSummary;
    let totalPayment = 0;
    let totalConcession = 0;
    let totalPaid = 0;
    let totalDue = 0;

    students.forEach((s) => {
      const edit = rowEdits[s.id];
      const conc = edit !== undefined ? Math.max(0, parseFloat(edit.concession) || 0) : (parseFloat(s.concession) || 0);
      const paid = edit !== undefined ? Math.max(0, parseFloat(edit.paid_amount) || 0) : (parseFloat(s.paid_amount) || 0);
      const gross = parseFloat(s.total_payment) || 0;
      const net = Math.max(0, gross - conc);
      const due = Math.max(0, net - paid);

      totalPayment += gross;
      totalConcession += conc;
      totalPaid += paid;
      totalDue += due;
    });

    return {
      total_students_in_roster: students.length,
      grand_total_payment: totalPayment,
      grand_concession_given: totalConcession,
      grand_paid_collected: totalPaid,
      grand_due_balance: totalDue
    };
  }, [students, finSummary, rowEdits]);

  // Handle inline typing of Concession, Paid Amount, Concession Reason or Remarks
  const handleRowFinanceChange = (student, field, value) => {
    setRowEdits((prev) => {
      const existing = prev[student.id] || {
        concession: student.concession ?? 0,
        paid_amount: student.paid_amount ?? 0,
        concession_reason: student.concession_reason || '',
        remarks: student.remarks || ''
      };
      return {
        ...prev,
        [student.id]: {
          ...existing,
          [field]: value,
          isDirty: true
        }
      };
    });
  };

  // Save inline financial edits & remarks for a student row
  const handleSaveStudentFinance = async (student) => {
    const edit = rowEdits[student.id];
    if (!edit) return;
    setSavingRows((prev) => ({ ...prev, [student.id]: true }));
    setErrorMsg(null);
    setSuccessMsg(null);

    const concVal = Math.max(0, parseFloat(edit.concession) || 0);
    const paidVal = Math.max(0, parseFloat(edit.paid_amount) || 0);
    const concReason = edit.concession_reason !== undefined ? edit.concession_reason : (student.concession_reason || '');
    const remarksVal = edit.remarks !== undefined ? edit.remarks : (student.remarks || '');

    try {
      await studentsAPI.updateChecklist(student.id, {
        concession: concVal,
        paid_amount: paidVal,
        concession_reason: concReason,
        remarks: remarksVal
      });
      setRowEdits((prev) => {
        const next = { ...prev };
        delete next[student.id];
        return next;
      });
      setSuccessMsg(`Financials & remarks saved for ${student.student_name}!`);
      queryClient.invalidateQueries({ queryKey: ['students-roster'] });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save financial updates');
    } finally {
      setSavingRows((prev) => {
        const next = { ...prev };
        delete next[student.id];
        return next;
      });
    }
  };

  // Real-time search filter for students inside the table card
  const filteredStudents = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const id = (s.student_id || '').toLowerCase();
    const name = (s.student_name || '').toLowerCase();
    const father = (s.father_name || '').toLowerCase();
    return id.includes(q) || name.includes(q) || father.includes(q);
  });

  // Open Details Modal
  const openDetailsModal = (student) => {
    setSelectedStudent(student);
    let items = student.items_checklist || [];
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch (e) { items = []; }
    }
    setChecklistItems(JSON.parse(JSON.stringify(items)));
    setConcession(student.concession || 0);
    setConcessionReason(student.concession_reason || '');
    setPaidAmount(student.paid_amount || 0);
  };

  // Modal toggle item
  const toggleItem = (index) => {
    const updated = [...checklistItems];
    const item = updated[index];
    const newPurchased = !item.purchased;
    const price = parseFloat(item.price) || 0;
    const qty = parseInt(item.qty) || 1;

    item.purchased = newPurchased;
    item.status = newPurchased ? 'YES' : 'NO';
    item.reason = newPurchased ? 'Purchased' : 'Pending Selection';
    item.subtotal = newPurchased ? (price * qty) : 0;

    setChecklistItems(updated);
  };

  // Modal mark out of stock
  const markOutOfStock = (index) => {
    const updated = [...checklistItems];
    const item = updated[index];
    item.purchased = false;
    item.status = 'OUT_OF_STOCK';
    item.reason = 'Out of stock in library';
    item.subtotal = 0;
    setChecklistItems(updated);
  };

  // Calculate real-time numbers in Details modal
  const calcGross = checklistItems.reduce((acc, it) => acc + (parseFloat(it.subtotal) || 0), 0);
  const parsedConcession = Math.max(0, parseFloat(concession) || 0);
  const calcNet = Math.max(0, calcGross - parsedConcession);
  const parsedPaid = Math.max(0, parseFloat(paidAmount) || 0);
  const calcDue = Math.max(0, calcNet - parsedPaid);

  let dynamicPaymentStatus = 'UNPAID';
  if (calcDue === 0 && calcNet > 0) dynamicPaymentStatus = 'PAID';
  else if (parsedPaid > 0 && calcDue > 0) dynamicPaymentStatus = 'PARTIAL';

  // Save Modal Checklist & Concession
  const handleSaveChecklist = () => {
    if (!selectedStudent) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    updateChecklistMutation.mutate({
      id: selectedStudent.id,
      payload: {
        checked_items: checklistItems,
        concession: parsedConcession,
        concession_reason: concessionReason,
        paid_amount: parsedPaid
      }
    });
  };

  // Register Student submit
  const handleRegister = (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    registerStudentMutation.mutate({
      school_id: schoolId,
      class_id: classId,
      section_id: sectionId,
      student_id: registerForm.student_id,
      student_name: registerForm.student_name,
      father_name: registerForm.father_name,
      email: registerForm.email,
      auto_check_all: registerForm.auto_check_all
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            <span>Manage Students & Book Checklist</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Multi-school roster filter with auto-detected curriculum, inline book checkboxes, and real-time fee calculation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => refetchRoster()}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh Roster Cache"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Download Student Roster Excel Template */}
          <a
            href={studentsAPI.downloadTemplate()}
            download
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Roster Template</span>
          </a>

          {/* Upload Excel Button */}
          <div className="relative inline-flex items-center">
            <button
              onClick={() => {
                setUploadStatus(null);
                setUploadFile(null);
                const activeId = schools.some((s) => s.id === Number(schoolId))
                  ? String(schoolId)
                  : (schools[0]?.id ? String(schools[0].id) : '');
                setUploadSchoolId(activeId);
                setIsUploadOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-300 text-blue-800 bg-blue-50 hover:bg-blue-100 text-xs font-semibold shadow-sm transition"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Upload Roster</span>
            </button>
          </div>

          <button
            onClick={() => setIsRegisterOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Register Student</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold text-sm leading-none">&times;</button>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-red-700 hover:text-red-900 font-bold text-sm leading-none">&times;</button>
        </div>
      )}

      {/* Workflow Step Notification: Displayed when no schools exist */}
      {schools.length === 0 && (
        <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs shadow-xs space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Important Setup Steps: No school is registered in the system yet!</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-slate-700">
            <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/60 shadow-2xs">
              <span className="font-extrabold text-amber-700 block text-[11px] uppercase tracking-wide">Step 1 (Mandatory)</span>
              <p className="mt-0.5 text-slate-800 font-medium">Go to Manage Schools and register your first affiliated school.</p>
            </div>
            <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/60 opacity-80 shadow-2xs">
              <span className="font-extrabold text-slate-500 block text-[11px] uppercase tracking-wide">Step 2</span>
              <p className="mt-0.5 text-slate-800 font-medium">Upload the Student Roster Excel file or enroll students manually.</p>
            </div>
            <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/60 opacity-80 shadow-2xs">
              <span className="font-extrabold text-slate-500 block text-[11px] uppercase tracking-wide">Step 3</span>
              <p className="mt-0.5 text-slate-800 font-medium">Click Search to display students, manage the book checklist & collect fees.</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar with School, Class, Section, Payment Status & Curriculum Auto-Detection */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        {/* Row 1: Dropdown Filters & Search Button */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-3 items-end">
          {/* School Selector */}
          <div className="sm:col-span-2 md:col-span-2 lg:col-span-4">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Select School
            </label>
            <select
              value={schoolId}
              onChange={(e) => setSchoolId(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Class Selector */}
          <div className="sm:col-span-1 md:col-span-1 lg:col-span-3">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Class Grade
            </label>
            <select
              value={classId}
              onChange={(e) => setClassId(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            >
              {classesList.length === 0 ? (
                <option value={1}>Class 1</option>
              ) : (
                classesList.map((c) => (
                  <option key={c.id} value={c.class_number || c.id}>{c.name}</option>
                ))
              )}
            </select>
          </div>

          {/* Section Selector */}
          <div className="sm:col-span-1 md:col-span-1 lg:col-span-2">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Section
            </label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sections</option>
              <option value={1}>Sec A</option>
              <option value={2}>Sec B</option>
              <option value={3}>Sec C</option>
              <option value={4}>Sec D</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="sm:col-span-1 md:col-span-1 lg:col-span-2">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Payment Status
            </label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-medium outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="PAID">PAID</option>
              <option value="PARTIAL">PARTIAL</option>
              <option value="UNPAID">UNPAID</option>
            </select>
          </div>

          {/* Search Action Button */}
          <div className="sm:col-span-1 md:col-span-1 lg:col-span-1 flex items-end">
            <button
              type="button"
              onClick={handleApplyFilter}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm transition"
              title="Apply filters & load roster"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Auto-detected Board & Curriculum Pill */}
        {currentSchool && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-purple-50/70 border border-blue-200/80 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-blue-900 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>{currentSchool.name}</span>
                <span className="font-mono text-[11px] text-slate-500 font-normal">({currentSchool.code})</span>
              </span>

              <span className="text-slate-300 hidden sm:inline">&bull;</span>

              <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                Affiliated Board:
                <span className="px-2 py-0.5 rounded-full font-bold bg-white text-blue-700 border border-blue-200 text-[11px]">
                  {currentSchool.board_type || 'CBSE'}
                </span>
              </span>

              <span className="text-slate-300 hidden sm:inline">&bull;</span>

              <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                Auto-detected Curriculum:
                <span className="px-2 py-0.5 rounded-full font-extrabold bg-indigo-600 text-white shadow-xs text-[11px] uppercase tracking-wide">
                  {currentSchool.curriculum || 'NCERT'}
                </span>
              </span>
            </div>

            {curriculumInfo && (
              <div className="text-right text-[11px] font-semibold text-slate-600">
                <span>Standard Kit: </span>
                <span className="font-bold text-slate-900">₹{curriculumInfo.full_package_cost_per_student}</span>
                <span className="text-slate-400"> ({curriculumInfo.total_package_items_count} items)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Roster & Financial Section: Revealed ONLY after clicking Search */}
      {!hasSearched ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Search to View Student Roster</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Select School, Class Grade & Section above, then click &ldquo;Search&rdquo; to load and display the students roster and book checklist.
          </p>
          <button
            type="button"
            onClick={handleApplyFilter}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition"
          >
            <Search className="w-4 h-4" />
            <span>Search Roster</span>
          </button>
        </div>
      ) : (
        <>
          {/* Financial Section Summary */}
          {displaySummary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-lg bg-white border border-slate-200">
            <div className="text-[10px] uppercase font-bold text-slate-500">Roster Students</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{displaySummary.total_students_in_roster}</div>
          </div>
          <div className="p-3 rounded-lg bg-white border border-slate-200">
            <div className="text-[10px] uppercase font-bold text-slate-500">Gross Kit Total</div>
            <div className="text-xl font-bold text-slate-900 mt-1">₹{displaySummary.grand_total_payment}</div>
          </div>
          <div className="p-3 rounded-lg bg-white border border-slate-200">
            <div className="text-[10px] uppercase font-bold text-amber-600">Total Concession</div>
            <div className="text-xl font-bold text-amber-600 mt-1">₹{displaySummary.grand_concession_given}</div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="text-[10px] uppercase font-bold text-emerald-700">Collected</div>
            <div className="text-xl font-bold text-emerald-700 mt-1">₹{displaySummary.grand_paid_collected}</div>
          </div>
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="text-[10px] uppercase font-bold text-red-700">Due Balance</div>
            <div className="text-xl font-bold text-red-700 mt-1">₹{displaySummary.grand_due_balance}</div>
          </div>
        </div>
      )}

      {/* Student Roster Table with Sub-line Checklist & Real-time Calculation */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>Class {appliedFilters.classId} &bull; {appliedFilters.sectionId ? `Section ${appliedFilters.sectionId === 1 ? 'A' : appliedFilters.sectionId === 2 ? 'B' : appliedFilters.sectionId === 3 ? 'C' : 'D'}` : 'All Sections'} Roster</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {currentSchool?.curriculum || 'NCERT'}
            </span>
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Student Input inside this Table Card */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student by name or ID..."
                className="w-full pl-8 pr-7 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-600 text-sm font-bold leading-none"
                  title="Clear search"
                >
                  &times;
                </button>
              )}
            </div>

            <span className="text-xs font-semibold text-slate-600 shrink-0 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200/60">
              {searchQuery.trim()
                ? `${filteredStudents.length} of ${students.length} students enrolled`
                : `${students.length} students enrolled`}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-2 whitespace-nowrap w-[260px]">Student Details</th>
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[320px]">Books Checklist (Items Sub-line)</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap w-[210px]">Fees & Payment</th>
                <th className="py-2.5 px-2 text-center whitespace-nowrap w-[240px]">Details & Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-10 text-center text-slate-400">
                    {searchQuery.trim()
                      ? `No students found matching "${searchQuery}".`
                      : 'No students found. Select school/class and click "Search" or click "Register Student".'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  let items = student.items_checklist || [];
                  if (typeof items === 'string') {
                    try { items = JSON.parse(items); } catch (e) { items = []; }
                  }
                  const checkedCount = items.filter((i) => i.purchased).length;

                  // Financial calculations for the row
                  const currentEdit = rowEdits[student.id];
                  const rowConcession = currentEdit !== undefined && currentEdit.concession !== undefined ? currentEdit.concession : (student.concession ?? 0);
                  const rowPaid = currentEdit !== undefined && currentEdit.paid_amount !== undefined ? currentEdit.paid_amount : (student.paid_amount ?? 0);
                  const rowConcReason = currentEdit !== undefined && currentEdit.concession_reason !== undefined ? currentEdit.concession_reason : (student.concession_reason || '');
                  const rowRemarks = currentEdit !== undefined && currentEdit.remarks !== undefined ? currentEdit.remarks : (student.remarks || '');
                  const isRowDirty = Boolean(currentEdit?.isDirty);

                  const grossTotal = parseFloat(student.total_payment) || 0;
                  const parsedConc = Math.max(0, parseFloat(rowConcession) || 0);
                  const rowNet = Math.max(0, grossTotal - parsedConc);
                  const parsedPaid = Math.max(0, parseFloat(rowPaid) || 0);
                  const rowDue = Math.max(0, rowNet - parsedPaid);

                  let rowStatus = 'UNPAID';
                  if (rowDue === 0 && rowNet > 0) rowStatus = 'PAID';
                  else if (parsedPaid > 0 && rowDue > 0) rowStatus = 'PARTIAL';

                  const hasConcession = parsedConc > 0;

                  // Whole card border & background highlight when edited/unsaved
                  const cardHighlightClass = isRowDirty
                    ? 'border-2 border-red-400 bg-red-50/30 shadow-xs'
                    : 'border border-slate-200/90 bg-slate-50/80 group-hover:bg-white shadow-2xs';

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors align-top group">
                      {/* 1. Student Details Card: Disabled read-only boxes, filled height, h-[165px] */}
                      <td className="py-2 px-1.5 whitespace-nowrap align-top w-[260px]">
                        <div className={`w-full h-[165px] p-2.5 rounded-xl flex flex-col justify-between transition-all ${cardHighlightClass}`}>
                          {/* 1. Header: Student Name & Section Badge + Unsaved Indicator */}
                          <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-200/80 shrink-0">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-extrabold text-slate-900 text-xs truncate max-w-[140px]" title={student.student_name}>
                                {student.student_name}
                              </span>
                              {isRowDirty && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-red-100 text-red-700 border border-red-300 animate-pulse shrink-0">
                                  Unsaved
                                </span>
                              )}
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                              Sec {student.section || 'A'}
                            </span>
                          </div>

                          {/* 4 Clean Disabled/Read-only Info Boxes filling the height evenly */}
                          <div className="space-y-1 flex-1 pt-1">
                            {/* Row 1: ID */}
                            <div className="flex items-center gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 w-11 shrink-0 select-none">
                                ID:
                              </label>
                              <div className="flex-1 bg-slate-100/90 border border-slate-200/90 rounded-md px-2 py-0.5 text-right font-mono font-bold text-blue-700 text-xs select-none cursor-default truncate">
                                {student.student_id}
                              </div>
                            </div>

                            {/* Row 2: Class */}
                            <div className="flex items-center gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 w-11 shrink-0 select-none">
                                Class:
                              </label>
                              <div className="flex-1 bg-slate-100/90 border border-slate-200/90 rounded-md px-2 py-0.5 text-right text-xs font-semibold text-slate-700 select-none cursor-default truncate">
                                {student.class_grade ? (student.class_grade.startsWith('Class') ? student.class_grade : `Class ${student.class_grade}`) : 'Class 1'}
                              </div>
                            </div>

                            {/* Row 3: Roll */}
                            <div className="flex items-center gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 w-11 shrink-0 select-none">
                                Roll:
                              </label>
                              <div className="flex-1 bg-slate-100/90 border border-slate-200/90 rounded-md px-2 py-0.5 text-right text-xs font-semibold text-slate-700 select-none cursor-default truncate">
                                {student.roll_no ? `Roll #${student.roll_no}` : (student.student_id ? `#${student.student_id.slice(-3)}` : '-')}
                              </div>
                            </div>

                            {/* Row 4: Father */}
                            <div className="flex items-center gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 w-11 shrink-0 select-none">
                                Father:
                              </label>
                              <div className="flex-1 bg-slate-100/90 border border-slate-200/90 rounded-md px-2 py-0.5 text-right text-xs font-semibold text-slate-800 select-none cursor-default truncate" title={student.father_name || '-'}>
                                {student.father_name || '-'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Interactive Sub-line Books Checklist: Full width, scrollable items, exact h-[165px] */}
                      <td className="py-2 px-1.5 align-top">
                        {items.length === 0 ? (
                          <div className={`w-full h-[165px] p-3 text-center text-[11px] text-slate-400 italic rounded-xl border flex items-center justify-center ${cardHighlightClass}`}>
                            No books mapped for this class
                          </div>
                        ) : (
                          <div className={`w-full h-[165px] rounded-xl p-2.5 flex flex-col transition-all ${cardHighlightClass}`}>
                            {/* Header with Quick All / None Selection and Live Auto-Save Indicator */}
                            <div className="flex items-center justify-between text-[10px] font-bold pb-1.5 mb-1 border-b border-slate-200 shrink-0">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-600">
                                  Selected: <span className="text-blue-700 font-extrabold">{checkedCount}</span> / {items.length}
                                </span>
                                {savingStatus[student.id] === 'saving' && (
                                  <span className="text-[10px] text-blue-600 font-bold animate-pulse flex items-center gap-0.5">
                                    💾 Saving...
                                  </span>
                                )}
                                {savingStatus[student.id] === 'saved' && (
                                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                                    ✔ Saved
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleInlineToggleAll(student, true)}
                                  className="text-blue-600 hover:text-blue-800 hover:underline font-bold"
                                >
                                  Select All
                                </button>
                                <span className="text-slate-300">•</span>
                                <button
                                  type="button"
                                  onClick={() => handleInlineToggleAll(student, false)}
                                  className="text-slate-500 hover:text-slate-700 hover:underline font-medium"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>

                            {/* Scrollable sub-lines occupying the rest of the 165px height */}
                            <div className="flex-1 overflow-y-auto space-y-1 pr-1.5 divide-y divide-slate-100">
                              {items.map((it, idx) => {
                                const isOut = it.status === 'OUT_OF_STOCK';
                                return (
                                  <label
                                    key={idx}
                                    className={`flex items-center gap-2 pt-1 pb-0.5 px-1.5 rounded transition select-none cursor-pointer ${
                                      it.purchased
                                        ? 'bg-blue-50/70 text-slate-900 font-medium'
                                        : isOut
                                        ? 'opacity-40 text-slate-400 line-through'
                                        : 'text-slate-500 hover:bg-white'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={Boolean(it.purchased)}
                                      disabled={isOut}
                                      onChange={() => handleInlineToggle(student, idx)}
                                      className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                                    />
                                    <span className="truncate flex-1 text-[11px] font-semibold" title={it.name}>
                                      {it.name}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                                      ({it.subject || '-'})
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                      #{it.code}
                                    </span>
                                    <span className="text-[11px] font-bold text-slate-800 shrink-0">
                                      ₹{it.price}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 3. Fees & Payment Card: Exact h-[165px], breathing gap above Save, Blue Save button */}
                      <td className="py-2 px-1.5 whitespace-nowrap align-top w-[210px]">
                        <div className={`w-full h-[165px] p-2.5 rounded-xl flex flex-col justify-between transition-all ${cardHighlightClass}`}>
                          {/* 1. Status sabse uper rahega + Net Fee */}
                          <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-200/80 shrink-0">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                              rowStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              rowStatus === 'PARTIAL' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {rowStatus}
                            </span>
                            <span className="text-[11px] font-bold text-slate-700 font-mono">
                              Net: <span className="text-slate-900 font-extrabold">₹{rowNet}</span>
                            </span>
                          </div>

                          {/* Inputs group with comfortable py-1 height */}
                          <div className="space-y-1 flex-1 pt-1">
                            {/* 2. Pahle Concession */}
                            <div className="flex items-center gap-1.5">
                              <label className="text-[10px] font-bold text-amber-800 w-11 shrink-0 select-none">
                                Conc:
                              </label>
                              <div className="relative flex-1">
                                <span className="absolute left-2 top-1 text-xs font-bold text-amber-600 select-none pointer-events-none">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={rowConcession}
                                  onChange={(e) => handleRowFinanceChange(student, 'concession', e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter' && isRowDirty) handleSaveStudentFinance(student); }}
                                  placeholder="0"
                                  className={`w-full pl-5 pr-2 py-1 text-right text-xs font-bold rounded-md outline-none transition ${
                                    isRowDirty
                                      ? 'border-2 border-red-500 bg-red-50 text-red-900 shadow-2xs focus:ring-1 focus:ring-red-400'
                                      : 'border border-amber-200 bg-white text-amber-900 hover:border-amber-300 focus:ring-1 focus:ring-amber-500'
                                  }`}
                                  title="Concession amount (₹)"
                                />
                              </div>
                            </div>

                            {/* 3. Uske neache Paid */}
                            <div className="flex items-center gap-1.5">
                              <label className="text-[10px] font-bold text-emerald-800 w-11 shrink-0 select-none">
                                Paid:
                              </label>
                              <div className="relative flex-1">
                                <span className="absolute left-2 top-1 text-xs font-bold text-emerald-600 select-none pointer-events-none">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={rowPaid}
                                  onChange={(e) => handleRowFinanceChange(student, 'paid_amount', e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter' && isRowDirty) handleSaveStudentFinance(student); }}
                                  placeholder="0"
                                  className={`w-full pl-5 pr-2 py-1 text-right text-xs font-bold rounded-md outline-none transition ${
                                    isRowDirty
                                      ? 'border-2 border-red-500 bg-red-50 text-red-900 shadow-2xs focus:ring-1 focus:ring-red-400'
                                      : 'border border-emerald-200 bg-white text-emerald-900 hover:border-emerald-300 focus:ring-1 focus:ring-emerald-500'
                                  }`}
                                  title="Paid amount collected (₹)"
                                />
                              </div>
                            </div>

                            {/* 4. Due box disabled */}
                            <div className="flex items-center gap-1.5">
                              <label className="text-[10px] font-bold text-red-700 w-11 shrink-0 select-none">
                                Due:
                              </label>
                              <div className="relative flex-1">
                                <span className="absolute left-2 top-1 text-xs font-bold text-red-500 select-none pointer-events-none">₹</span>
                                <input
                                  type="text"
                                  disabled
                                  value={rowDue}
                                  className="w-full pl-5 pr-2 py-1 text-right text-xs font-extrabold rounded-md border border-slate-200 bg-slate-100 text-red-600 font-mono cursor-not-allowed select-none"
                                  title="Due Balance (Disabled / Auto-calculated)"
                                />
                              </div>
                            </div>
                          </div>

                          {/* 5. Save Button: Blue color when dirty with mt-2 breathing room */}
                          <button
                            type="button"
                            onClick={() => handleSaveStudentFinance(student)}
                            disabled={!isRowDirty || savingRows[student.id]}
                            className={`w-full inline-flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-md font-bold text-xs transition shadow-2xs shrink-0 mt-2 ${
                              isRowDirty
                                ? 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-xs cursor-pointer animate-pulse'
                                : 'bg-slate-200/70 border border-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                            title={isRowDirty ? 'Click to save changes (or press Enter)' : 'Save (Disabled until changes made)'}
                          >
                            {savingRows[student.id] ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin text-white" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <Save className={`w-3 h-3 ${isRowDirty ? 'text-white' : 'text-slate-400'}`} />
                                <span>{isRowDirty ? 'Save Changes' : 'Save'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 4. Details & Remarks Card: Exact h-[165px], vertical stack, no overflow */}
                      <td className="py-2 px-1.5 align-top w-[240px]">
                        <div className={`w-full h-[165px] p-2.5 rounded-xl flex flex-col justify-between transition-all ${cardHighlightClass}`}>
                          {/* 1. Details Button: Top, full width matching text boxes */}
                          <button
                            type="button"
                            onClick={() => openDetailsModal(student)}
                            className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition shrink-0"
                            title="View Complete Student Details & Breakdown Modal"
                          >
                            <Eye className="w-3.5 h-3.5 text-white" />
                            <span>Details</span>
                          </button>

                          {/* Text boxes group: clean vertical stack */}
                          <div className="space-y-1.5 flex-1 pt-1.5 flex flex-col justify-between">
                            {/* 2. Concession Reason Text Box - ONLY editable when concession > 0 */}
                            <div className="flex flex-col w-full">
                              <div className="flex items-center justify-between w-full mb-0.5">
                                <label className="text-[10px] font-bold text-amber-800 select-none">
                                  Concession Reason:
                                </label>
                                {!hasConcession && (
                                  <span className="text-[9px] font-semibold text-slate-400 italic">
                                    (Conc &gt; 0 only)
                                  </span>
                                )}
                              </div>
                              <input
                                type="text"
                                disabled={!hasConcession}
                                value={rowConcReason}
                                onChange={(e) => handleRowFinanceChange(student, 'concession_reason', e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && isRowDirty) handleSaveStudentFinance(student); }}
                                placeholder={hasConcession ? "e.g. Sibling / Staff discount" : "Locked (Enter concession first)"}
                                className={`w-full px-2 py-1 text-xs rounded-md outline-none transition ${
                                  !hasConcession
                                    ? 'border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed placeholder:text-slate-400'
                                    : isRowDirty
                                    ? 'border-2 border-red-500 bg-red-50 text-red-900 shadow-2xs focus:ring-1 focus:ring-red-400'
                                    : 'border border-amber-200 bg-white text-slate-800 hover:border-amber-300 focus:ring-1 focus:ring-amber-500'
                                }`}
                                title={hasConcession ? "Reason for concession" : "Enter a concession amount > 0 first"}
                              />
                            </div>

                            {/* 3. Remarks Text Box - clean vertical stack, 100% inside container */}
                            <div className="flex flex-col w-full">
                              <label className="block text-[10px] font-bold text-slate-600 select-none mb-0.5">
                                Remarks:
                              </label>
                              <input
                                type="text"
                                value={rowRemarks}
                                onChange={(e) => handleRowFinanceChange(student, 'remarks', e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && isRowDirty) handleSaveStudentFinance(student); }}
                                placeholder="e.g. Fees pending till 5th"
                                className={`w-full px-2 py-1 text-xs rounded-md outline-none transition ${
                                  isRowDirty
                                    ? 'border-2 border-red-500 bg-red-50 text-red-900 shadow-2xs focus:ring-1 focus:ring-red-400'
                                    : 'border border-slate-200 bg-white text-slate-800 hover:border-slate-300 focus:ring-1 focus:ring-blue-500'
                                }`}
                                title="General student remarks"
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* Interactive Item Checklist & Financial Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>Student Details & Allocation:</span>
                  <span className="text-blue-600">{selectedStudent.student_name}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  ID: {selectedStudent.student_id} &bull; Class {appliedFilters.classId} (Sec {appliedFilters.sectionId === 1 ? 'A' : 'B'}) &bull; Father: {selectedStudent.father_name || '-'}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Checklist items list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Mark Items Delivered / Purchased:
              </div>

              {checklistItems.map((item, idx) => {
                const isOutOfStock = item.status === 'OUT_OF_STOCK';
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center justify-between transition ${
                      item.purchased
                        ? 'border-blue-400 bg-blue-50/40 shadow-xs'
                        : isOutOfStock
                        ? 'border-slate-200 bg-slate-50 opacity-60'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.purchased}
                        disabled={isOutOfStock}
                        onChange={() => toggleItem(idx)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>{item.name}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                            {item.item_type || 'BOOK'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Code: {item.code} {item.subject ? `&bull; ${item.subject}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-900">₹{parseFloat(item.price).toFixed(2)}</div>
                        <div className="text-[10px]">
                          {item.purchased ? (
                            <span className="text-emerald-600 font-semibold">YES &bull; Purchased</span>
                          ) : isOutOfStock ? (
                            <span className="text-red-500 font-semibold">OUT OF STOCK</span>
                          ) : (
                            <span className="text-slate-400">Not Purchased</span>
                          )}
                        </div>
                      </div>

                      {!isOutOfStock && (
                        <button
                          type="button"
                          onClick={() => markOutOfStock(idx)}
                          title="Mark Out of Stock"
                          className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Financial Details Summary in Footer */}
            <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Gross Kit Price</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5 font-mono">₹{calcGross}</div>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <div className="text-[10px] font-bold uppercase text-amber-600">Concession</div>
                  <div className="text-base font-bold text-amber-700 mt-0.5 font-mono">₹{concession || 0}</div>
                  {concessionReason && (
                    <div className="text-[10px] text-slate-500 truncate mt-0.5" title={concessionReason}>Reason: {concessionReason}</div>
                  )}
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <div className="text-[10px] font-bold uppercase text-emerald-600">Paid Amount</div>
                  <div className="text-base font-bold text-emerald-700 mt-0.5 font-mono">₹{paidAmount || 0}</div>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <div className="text-[10px] font-bold uppercase text-red-600">Due Balance</div>
                  <div className="text-base font-bold text-red-600 mt-0.5 font-mono">₹{calcDue}</div>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs font-medium flex items-center gap-2">
                  <span className="text-slate-600 font-semibold">Payment Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    dynamicPaymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    dynamicPaymentStatus === 'PARTIAL' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {dynamicPaymentStatus}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
                  >
                    Close Details
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveChecklist}
                    disabled={updateChecklistMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{updateChecklistMutation.isPending ? 'Saving...' : 'Save Items Allocation'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register Student Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Register Student (Class {classId} - Sec {sectionId === 1 ? 'A' : 'B'})
            </h3>

            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Student ID *</label>
                <input
                  type="text"
                  required
                  value={registerForm.student_id}
                  onChange={(e) => setRegisterForm({ ...registerForm, student_id: e.target.value })}
                  placeholder="e.g. TGS-2026-006"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Student Name *</label>
                <input
                  type="text"
                  required
                  value={registerForm.student_name}
                  onChange={(e) => setRegisterForm({ ...registerForm, student_name: e.target.value })}
                  placeholder="e.g. Yashvardhan Singh"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Father's Name</label>
                <input
                  type="text"
                  value={registerForm.father_name}
                  onChange={(e) => setRegisterForm({ ...registerForm, father_name: e.target.value })}
                  placeholder="e.g. Ramesh Singh"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  placeholder="e.g. student@school.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="auto_check"
                  checked={registerForm.auto_check_all}
                  onChange={(e) => setRegisterForm({ ...registerForm, auto_check_all: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="auto_check" className="text-xs text-slate-700 font-medium">
                  Auto-tick all NCERT books as purchased
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerStudentMutation.isPending}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  {registerStudentMutation.isPending ? 'Registering...' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Student Roster Excel Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <span>Bulk Upload Students Roster</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsUploadOpen(false);
                  setUploadStatus(null);
                  setUploadFile(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold leading-none p-1"
                title="Close"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Bulk enroll students for a school. Books checklist for each class will be attached automatically!
            </p>

            {/* School Warning if No School in List */}
            {schools.length === 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>No school found in the list!</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  There are no schools registered yet. Please go to &apos;Manage Schools&apos; to register a school before uploading student rosters.
                </p>
                <a
                  href="/manage-schools"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  <School className="w-3.5 h-3.5" />
                  <span>Go to Manage Schools</span>
                </a>
              </div>
            )}

            {/* Real-time Inline Upload Status Message */}
            {uploadStatus && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 font-semibold ${
                uploadStatus.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {uploadStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{uploadStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleUploadRoster} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target School *</label>
                <select
                  value={uploadSchoolId || schoolId || ''}
                  disabled={schools.length === 0}
                  onChange={(e) => setUploadSchoolId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-semibold outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-100"
                >
                  {schools.length === 0 ? (
                    <option value="">No school available in list</option>
                  ) : (
                    schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code} &bull; {s.curriculum || 'NCERT'})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className={`border-2 border-dashed rounded-xl p-5 text-center transition ${
                schools.length === 0 ? 'border-slate-200 opacity-50 bg-slate-50 cursor-not-allowed' : 'border-slate-300 hover:border-blue-500 cursor-pointer'
              }`}>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  required
                  disabled={schools.length === 0 || uploadRosterMutation.isPending}
                  onChange={(e) => {
                    setUploadStatus(null);
                    setUploadFile(e.target.files[0]);
                  }}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                />
                <p className="text-[11px] text-slate-400 mt-2">
                  Columns: [Student ID, Student Name, Father Name, Class, Section, Email]
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadOpen(false);
                    setUploadStatus(null);
                    setUploadFile(null);
                  }}
                  className="px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schools.length === 0 || uploadRosterMutation.isPending || !uploadFile}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {uploadRosterMutation.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{uploadRosterMutation.isPending ? 'Processing...' : 'Upload & Process'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
