import React, { useState, useEffect, useRef } from 'react';
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
          {finSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-lg bg-white border border-slate-200">
            <div className="text-[10px] uppercase font-bold text-slate-500">Roster Students</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{finSummary.total_students_in_roster}</div>
          </div>
          <div className="p-3 rounded-lg bg-white border border-slate-200">
            <div className="text-[10px] uppercase font-bold text-slate-500">Gross Kit Total</div>
            <div className="text-xl font-bold text-slate-900 mt-1">₹{finSummary.grand_total_payment}</div>
          </div>
          <div className="p-3 rounded-lg bg-white border border-slate-200">
            <div className="text-[10px] uppercase font-bold text-amber-600">Total Concession</div>
            <div className="text-xl font-bold text-amber-600 mt-1">₹{finSummary.grand_concession_given}</div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="text-[10px] uppercase font-bold text-emerald-700">Collected</div>
            <div className="text-xl font-bold text-emerald-700 mt-1">₹{finSummary.grand_paid_collected}</div>
          </div>
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="text-[10px] uppercase font-bold text-red-700">Due Balance</div>
            <div className="text-xl font-bold text-red-700 mt-1">₹{finSummary.grand_due_balance}</div>
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
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Father Name</th>
                <th className="py-3 px-4 min-w-[320px]">Books Checklist (Items Sub-line)</th>
                <th className="py-3 px-4 text-right">Net Fee</th>
                <th className="py-3 px-4 text-right">Concession</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-10 text-center text-slate-400">
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

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/60 transition align-top">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{student.student_id}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{student.student_name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Sec {student.section || 'A'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{student.father_name || '-'}</td>

                      {/* Interactive Sub-line Books Checklist */}
                      <td className="py-2.5 px-4">
                        {items.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">No books mapped for this class</span>
                        ) : (
                          <div className="w-full max-w-md rounded-lg bg-slate-50 border border-slate-200/90 p-2 shadow-xs">
                            {/* Header with Quick All / None Selection and Live Auto-Save Indicator */}
                            <div className="flex items-center justify-between text-[10px] font-bold pb-1.5 mb-1.5 border-b border-slate-200">
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

                            {/* Sub-lines for each book/item */}
                            <div className="max-h-36 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100">
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

                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">₹{student.net_payable}</td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className={`font-bold ${parseFloat(student.concession) > 0 ? 'text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200' : 'text-slate-400'}`}>
                          ₹{student.concession || 0}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-600 whitespace-nowrap">₹{student.paid_amount}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-red-600 whitespace-nowrap">₹{student.due_amount}</td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          student.payment_status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          student.payment_status === 'PARTIAL' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {student.payment_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => openDetailsModal(student)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white font-bold text-xs border border-slate-300 hover:border-blue-600 transition shadow-xs"
                          title="View Details & Enter Concession / Cash Payment"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600 group-hover:text-white" />
                          <span>Details</span>
                        </button>
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

            {/* Financial Calculator in Footer */}
            <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500">Total Price</label>
                  <div className="text-base font-bold text-slate-900 mt-0.5">₹{calcGross}</div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500">Concession (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={concession}
                    onChange={(e) => setConcession(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-bold text-amber-700 bg-white mt-0.5"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500">Paid Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-bold text-emerald-700 bg-white mt-0.5"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500">Due Balance</label>
                  <div className="text-base font-bold text-red-600 mt-0.5">₹{calcDue}</div>
                </div>
              </div>

              {/* Concession Reason if concession > 0 */}
              {parsedConcession > 0 && (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500">Concession Reason</label>
                  <input
                    type="text"
                    value={concessionReason}
                    onChange={(e) => setConcessionReason(e.target.value)}
                    placeholder="e.g. Sibling discount / Staff quota / Principal scholarship"
                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white mt-0.5"
                  />
                </div>
              )}

              {/* Status and Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs font-medium">
                  Payment Status:{' '}
                  <span className="font-bold text-slate-900 uppercase">{dynamicPaymentStatus}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveChecklist}
                    disabled={updateChecklistMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{updateChecklistMutation.isPending ? 'Saving...' : 'Save Details & Fees'}</span>
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
