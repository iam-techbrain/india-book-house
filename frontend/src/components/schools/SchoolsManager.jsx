import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  School,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  RefreshCw,
  FileSpreadsheet,
  Upload,
  Download
} from 'lucide-react';
import { schoolsAPI, mastersAPI, studentsAPI } from '../../services/api';

// Manage affiliated school profiles and book dispatch reports
export default function SchoolsManager() {
  const queryClient = useQueryClient();

  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Excel Roster Upload State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadSchoolId, setUploadSchoolId] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);

  // TanStack Query for dynamic Master Lookup Tables
  const { data: mastersData } = useQuery({
    queryKey: ['masters-all'],
    queryFn: async () => {
      const res = await mastersAPI.getAll();
      return res.data || {};
    }
  });
  const boardTypesList = mastersData?.board_types || [];
  const curriculumsList = mastersData?.curriculums || [];

  // Add / Edit School Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    board_type: 'CBSE',
    curriculum: 'NCERT',
    status: 'ACTIVE'
  });

  // Open modal for new school
  const handleOpenAddModal = () => {
    setEditingSchool(null);
    setFormData({
      code: '',
      name: '',
      address: '',
      board_type: boardTypesList[0]?.name || 'CBSE',
      curriculum: curriculumsList[0]?.name || 'NCERT',
      status: 'ACTIVE'
    });
    setIsAddOpen(true);
  };

  // Open modal for editing school
  const handleOpenEditModal = (school) => {
    setEditingSchool(school);
    setFormData({
      code: school.code || '',
      name: school.name || '',
      address: school.address || '',
      board_type: school.board_type || (boardTypesList[0]?.name || 'CBSE'),
      curriculum: school.curriculum || (curriculumsList[0]?.name || 'NCERT'),
      status: school.status || 'ACTIVE'
    });
    setIsAddOpen(true);
  };

  // TanStack Query for Schools
  const { data: schools = [], isLoading: loading, refetch: refetchSchools } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      const res = await schoolsAPI.getAll();
      return res.data || [];
    }
  });

  // Set default uploadSchoolId when schools are loaded
  useEffect(() => {
    if (schools.length > 0 && (!uploadSchoolId || !schools.some((s) => s.id === Number(uploadSchoolId)))) {
      setUploadSchoolId(schools[0].id);
    }
  }, [schools, uploadSchoolId]);

  // TanStack Mutation for Adding School
  const addSchoolMutation = useMutation({
    mutationFn: async (newSchool) => {
      return await schoolsAPI.create(newSchool);
    },
    onSuccess: (res) => {
      setSuccessMsg(res?.message || 'School registered successfully');
      setIsAddOpen(false);
      setEditingSchool(null);
      queryClient.invalidateQueries({ queryKey: ['schools'] });
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to register school');
    }
  });

  // TanStack Mutation for Updating School
  const updateSchoolMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      return await schoolsAPI.update(id, payload);
    },
    onSuccess: (res) => {
      setSuccessMsg(res?.message || 'School updated successfully');
      setIsAddOpen(false);
      setEditingSchool(null);
      queryClient.invalidateQueries({ queryKey: ['schools'] });
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to update school');
    }
  });

  // TanStack Mutation for Deleting School
  const deleteSchoolMutation = useMutation({
    mutationFn: async (id) => {
      return await schoolsAPI.delete(id);
    },
    onSuccess: () => {
      setSuccessMsg('School deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['schools'] });
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to delete school');
    }
  });

  // TanStack Mutation for Uploading School Roster Excel
  const uploadRosterMutation = useMutation({
    mutationFn: async ({ schoolId, file }) => {
      const form = new FormData();
      form.append('school_id', schoolId);
      form.append('file', file);
      return await studentsAPI.uploadExcel(form);
    },
    onSuccess: (res) => {
      const msg = res?.message || 'Students roster uploaded successfully!';
      setSuccessMsg(msg);
      setUploadStatus({ type: 'success', message: msg });
      setUploadFile(null);
      queryClient.invalidateQueries({ queryKey: ['schools'] });
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
    const targetId = uploadSchoolId || schools[0]?.id;
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

  const handleSaveSchool = (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (editingSchool) {
      updateSchoolMutation.mutate({ id: editingSchool.id, payload: formData });
    } else {
      addSchoolMutation.mutate(formData);
    }
  };

  const handleDelete = (id, name) => {
    if (!window.confirm(`Are you sure you want to delete school "${name}"?`)) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    deleteSchoolMutation.mutate(id);
  };

  // Calculate dispatch stats per school
  const getDispatchStats = (school) => {
    const enrolledStudents = school.students_count || 0;
    const delivered = school.delivered_books_count || 0;
    const pending = Math.max(0, enrolledStudents - delivered);
    const deliveryRate = enrolledStudents > 0 ? Math.round((delivered / enrolledStudents) * 100) : 0;

    return {
      enrolledStudents,
      delivered,
      pending,
      deliveryRate
    };
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <School className="w-6 h-6 text-indigo-600" />
            <span>Manage Schools & Dispatch Reports</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            School affiliation profiles, board & curriculum mapping, and school-wise delivery tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => refetchSchools()}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh Schools"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Download Student Roster Template */}
          <a
            href={studentsAPI.downloadTemplate()}
            download
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Roster Template</span>
          </a>

          {/* Top Upload Excel Button */}
          <div className="relative inline-flex items-center">
            <button
              onClick={() => {
                setUploadStatus(null);
                setUploadFile(null);
                if (schools.length > 0) setUploadSchoolId(schools[0].id);
                setIsUploadOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold shadow-sm transition"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>Upload Roster</span>
            </button>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Register School</span>
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
              <p className="mt-0.5 text-slate-800 font-medium">Register your school first (with School Code, Name, Affiliated Board & Curriculum).</p>
            </div>
            <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/60 opacity-80 shadow-2xs">
              <span className="font-extrabold text-slate-500 block text-[11px] uppercase tracking-wide">Step 2</span>
              <p className="mt-0.5 text-slate-800 font-medium">Upload the Student Roster Excel spreadsheet for the registered school.</p>
            </div>
            <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/60 opacity-80 shadow-2xs">
              <span className="font-extrabold text-slate-500 block text-[11px] uppercase tracking-wide">Step 3</span>
              <p className="mt-0.5 text-slate-800 font-medium">Go to Manage Students to verify class book checklists and calculate student fees.</p>
            </div>
          </div>
        </div>
      )}

      {/* Section 1: School Book Dispatch Reports */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">School Book Dispatch & Allocation Report</h2>
              <p className="text-xs text-slate-500">Live breakdown of books dispatched per affiliated school</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schools.map((school) => {
            const stats = getDispatchStats(school);
            return (
              <div
                key={`report-${school.id}`}
                className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-md transition space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                      {school.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{school.name}</h3>
                    <p className="text-xs text-slate-500">{school.address || 'Address not registered'}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                    {school.board_type} &bull; {school.curriculum}
                  </span>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center">
                  <div className="p-2 rounded-lg bg-white border border-slate-100">
                    <div className="text-[10px] uppercase font-semibold text-slate-500">Enrolled Students</div>
                    <div className="text-base font-bold text-slate-900">{stats.enrolledStudents}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                    <div className="text-[10px] uppercase font-semibold text-emerald-700">Books Delivered</div>
                    <div className="text-base font-bold text-emerald-700">{stats.delivered}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
                    <div className="text-[10px] uppercase font-semibold text-amber-700">Pending Kits</div>
                    <div className="text-base font-bold text-amber-700">{stats.pending}</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                    <span>Dispatch Progress</span>
                    <span className="font-bold text-indigo-600">{stats.deliveryRate}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{ width: `${stats.deliveryRate}%` }}
                    />
                  </div>
                </div>

                {/* Card Action Link to View Students */}
                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                  <a
                    href="/manage-students"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition group"
                  >
                    <span>View Students & Book Checklist ({stats.enrolledStudents})</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setUploadStatus(null);
                      setUploadFile(null);
                      setUploadSchoolId(school.id);
                      setIsUploadOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                  >
                    <Upload className="w-3 h-3 text-indigo-600" />
                    <span>Upload Roster</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: School Profiles Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Registered Schools Directory</h3>
          <span className="text-xs text-slate-400">Total: {schools.length} Schools</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Numeric ID</th>
                <th className="py-3 px-4">School Code</th>
                <th className="py-3 px-4">School Name</th>
                <th className="py-3 px-4">Campus Address</th>
                <th className="py-3 px-4">Board Type</th>
                <th className="py-3 px-4">Curriculum</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schools.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No schools registered yet. Click "Register School" to add one.
                  </td>
                </tr>
              ) : (
                schools.map((school) => (
                  <tr key={school.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">#{school.id}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">{school.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{school.name}</td>
                    <td className="py-3 px-4 text-slate-500">{school.address || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {school.board_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                        {school.curriculum}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {school.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(school)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="Edit School Profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setUploadStatus(null);
                            setUploadFile(null);
                            setUploadSchoolId(school.id);
                            setIsUploadOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="Upload Students Excel for this School"
                        >
                          <Upload className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(school.id, school.name)}
                          disabled={deleteSchoolMutation.isPending}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                          title="Delete school"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit School Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingSchool ? `Edit School (${editingSchool.code})` : 'Register New School'}
            </h3>
            <form onSubmit={handleSaveSchool} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">School Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. DPS-01"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Board *</label>
                  <select
                    value={formData.board_type}
                    onChange={(e) => setFormData({ ...formData, board_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white outline-none font-medium text-slate-800"
                    required
                  >
                    {boardTypesList.length === 0 ? (
                      <option value="CBSE">CBSE</option>
                    ) : (
                      boardTypesList.map((b) => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">School Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Delhi Public School"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Campus Address</label>
                <textarea
                  rows="2"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, City, Pincode"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Curriculum <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.curriculum}
                    onChange={(e) => setFormData({ ...formData, curriculum: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white outline-none font-medium text-slate-800"
                  >
                    {curriculumsList.length === 0 ? (
                      <option value="NCERT">NCERT</option>
                    ) : (
                      curriculumsList.map((cur) => (
                        <option key={cur.id} value={cur.name}>
                          {cur.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white outline-none font-medium text-slate-800"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setEditingSchool(null);
                  }}
                  className="px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSchoolMutation.isPending || updateSchoolMutation.isPending}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm disabled:opacity-50"
                >
                  {editingSchool
                    ? (updateSchoolMutation.isPending ? 'Updating...' : 'Update School')
                    : (addSchoolMutation.isPending ? 'Saving...' : 'Save School')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload School Students Excel Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <span>Upload School Student Roster</span>
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
                  There are no schools registered yet. Please register at least one school before uploading a student roster.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadOpen(false);
                    setUploadStatus(null);
                    handleOpenAddModal();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register School Now</span>
                </button>
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
                  value={uploadSchoolId}
                  disabled={schools.length === 0}
                  onChange={(e) => setUploadSchoolId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-semibold outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-slate-100"
                >
                  {schools.length === 0 ? (
                    <option value="">No school available in list</option>
                  ) : (
                    schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code} &bull; {s.board_type})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className={`border-2 border-dashed rounded-xl p-5 text-center transition ${
                schools.length === 0 ? 'border-slate-200 opacity-50 bg-slate-50 cursor-not-allowed' : 'border-slate-300 hover:border-indigo-500 cursor-pointer'
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
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
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
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {uploadRosterMutation.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{uploadRosterMutation.isPending ? 'Processing...' : 'Upload & Enroll Students'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
