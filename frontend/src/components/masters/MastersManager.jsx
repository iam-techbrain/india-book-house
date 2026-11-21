import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Database,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  CheckCircle2,
  Tag,
  Layers,
  Bookmark,
  Building2,
  Compass,
  FileText,
  UserCog,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import { mastersAPI } from '../../services/api';

export default function MastersManager({ subView = 'all', onTabChange }) {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('item_types');
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [blockedAlert, setBlockedAlert] = useState(null);

  // Modal State for Add & Edit
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [newName, setNewName] = useState('');
  const [newExtra, setNewExtra] = useState('');

  // Map subView prop to activeTab
  useEffect(() => {
    if (subView === 'masters-item-types') setActiveTab('item_types');
    else if (subView === 'masters-classes') setActiveTab('classes');
    else if (subView === 'masters-subjects') setActiveTab('subjects');
    else if (subView === 'masters-publishers') setActiveTab('authors_publishers');
    else if (subView === 'masters-boards') setActiveTab('board_types');
    else if (subView === 'masters-curriculums') setActiveTab('curriculums');
    else if (subView === 'masters-roles') setActiveTab('roles');
  }, [subView]);

  // TanStack Query Caching for 7 Masters
  const { data: mastersData = {
    item_types: [],
    classes: [],
    subjects: [],
    authors_publishers: [],
    board_types: [],
    curriculums: [],
    roles: []
  }, isLoading: loading, refetch: refetchMasters } = useQuery({
    queryKey: ['masters-all'],
    queryFn: async () => {
      const res = await mastersAPI.getAll();
      return res.data || {
        item_types: [],
        classes: [],
        subjects: [],
        authors_publishers: [],
        board_types: [],
        curriculums: [],
        roles: []
      };
    }
  });

  // TanStack Mutation for Create Master Record
  const createMutation = useMutation({
    mutationFn: async ({ tab, name, extra }) => {
      if (tab === 'item_types') return await mastersAPI.createItemType({ name, description: extra });
      if (tab === 'classes') return await mastersAPI.createClass({ name, class_number: parseInt(extra) || undefined });
      if (tab === 'subjects') return await mastersAPI.createSubject({ name, code: extra });
      if (tab === 'authors_publishers') return await mastersAPI.createPublisher({ name, type: extra || 'PUBLISHER' });
      if (tab === 'board_types') return await mastersAPI.createBoard({ name, code: extra || name });
      if (tab === 'curriculums') return await mastersAPI.createCurriculum({ name, description: extra });
      if (tab === 'roles') return await mastersAPI.createRole({ name, description: extra });
    },
    onSuccess: (res) => {
      setSuccessMsg(res?.message || 'Record added successfully');
      setNewName('');
      setNewExtra('');
      setIsAddOpen(false);
      // Invalidate & refresh cache
      queryClient.invalidateQueries({ queryKey: ['masters-all'] });
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to add record');
    }
  });

  // TanStack Mutation for Update Master Record
  const updateMutation = useMutation({
    mutationFn: async ({ tab, id, name, extra }) => {
      if (tab === 'item_types') return await mastersAPI.updateItemType(id, { name, description: extra });
      if (tab === 'classes') return await mastersAPI.updateClass(id, { name, class_number: parseInt(extra) || undefined });
      if (tab === 'subjects') return await mastersAPI.updateSubject(id, { name, code: extra });
      if (tab === 'authors_publishers') return await mastersAPI.updatePublisher(id, { name, type: extra });
      if (tab === 'board_types') return await mastersAPI.updateBoard(id, { name, code: extra });
      if (tab === 'curriculums') return await mastersAPI.updateCurriculum(id, { name, description: extra });
      if (tab === 'roles') return await mastersAPI.updateRole(id, { name, description: extra });
    },
    onSuccess: (res) => {
      setSuccessMsg(res?.message || 'Record updated successfully');
      setNewName('');
      setNewExtra('');
      setEditingRecord(null);
      setIsAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ['masters-all'] });
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to update record');
    }
  });

  // TanStack Mutation for Delete Master Record with Dependency Check
  const deleteMutation = useMutation({
    mutationFn: async ({ tab, id }) => {
      if (tab === 'item_types') return await mastersAPI.deleteItemType(id);
      if (tab === 'classes') return await mastersAPI.deleteClass(id);
      if (tab === 'subjects') return await mastersAPI.deleteSubject(id);
      if (tab === 'authors_publishers') return await mastersAPI.deletePublisher(id);
      if (tab === 'board_types') return await mastersAPI.deleteBoard(id);
      if (tab === 'curriculums') return await mastersAPI.deleteCurriculum(id);
      if (tab === 'roles') return await mastersAPI.deleteRole(id);
    },
    onSuccess: (res) => {
      setSuccessMsg(res?.message || 'Deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['masters-all'] });
    },
    onError: (err) => {
      if (err.meta?.blocked || err.statusCode === 400) {
        setBlockedAlert({
          title: 'DELETION BLOCKED BY SYSTEM',
          message: err.message || 'Cannot delete this record because other items or schools are currently using it.'
        });
      } else {
        setErrorMsg(err.message || 'Failed to delete record');
      }
    }
  });

  const tabs = [
    { id: 'item_types', label: 'Item Types', icon: <Tag className="w-4 h-4" /> },
    { id: 'classes', label: 'Classes (1-12)', icon: <Layers className="w-4 h-4" /> },
    { id: 'subjects', label: 'Subjects', icon: <Bookmark className="w-4 h-4" /> },
    { id: 'authors_publishers', label: 'Authors / Publishers', icon: <Building2 className="w-4 h-4" /> },
    { id: 'board_types', label: 'Board Types', icon: <Compass className="w-4 h-4" /> },
    { id: 'curriculums', label: 'Curriculums', icon: <FileText className="w-4 h-4" /> },
    { id: 'roles', label: 'User Roles', icon: <UserCog className="w-4 h-4" /> }
  ];

  // Open modal for adding new record
  const handleOpenAdd = () => {
    setEditingRecord(null);
    setNewName('');
    setNewExtra('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setBlockedAlert(null);
    setIsAddOpen(true);
  };

  // Open modal for editing record
  const handleOpenEdit = (item) => {
    setEditingRecord(item);
    setNewName(item.name || '');
    setNewExtra(item.description || item.code || item.type || (item.class_number !== undefined ? String(item.class_number) : '') || '');
    setErrorMsg(null);
    setSuccessMsg(null);
    setBlockedAlert(null);
    setIsAddOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setBlockedAlert(null);

    if (editingRecord) {
      updateMutation.mutate({ tab: activeTab, id: editingRecord.id, name: newName, extra: newExtra });
    } else {
      createMutation.mutate({ tab: activeTab, name: newName, extra: newExtra });
    }
  };

  const handleDelete = (id, name) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setBlockedAlert(null);

    if (!window.confirm(`Are you sure you want to delete "${name}"? The system will check if any dependent items, schools or students exist.`)) {
      return;
    }
    deleteMutation.mutate({ tab: activeTab, id });
  };

  const currentList = mastersData[activeTab] || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-600" />
            <span>Master Data Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure system lookups. Deletion is automatically blocked if any records are actively using them.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetchMasters()}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh Masters Cache"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add to {tabs.find((t) => t.id === activeTab)?.label}</span>
          </button>
        </div>
      </div>

      {/* Safety Deletion Alert */}
      {blockedAlert && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-sm animate-in fade-in">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-bold text-amber-950 uppercase tracking-wide mb-0.5">
              {blockedAlert.title}
            </div>
            <div>{blockedAlert.message}</div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setBlockedAlert(null);
              if (onTabChange) onTabChange(tab.id);
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === tab.id ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {(mastersData[tab.id] || []).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table of Records */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            {tabs.find((t) => t.id === activeTab)?.label} List
          </h3>
          <span className="text-xs text-slate-400">Total: {currentList.length} items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Numeric ID</th>
                <th className="py-3 px-4">Name / Value</th>
                <th className="py-3 px-4">Details / Description</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    No records found in this master table.
                  </td>
                </tr>
              ) : (
                currentList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">#{item.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{item.name}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {item.description || item.code || item.type || item.class_number || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="Edit Record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                          title="Delete (Checks dependencies)"
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

      {/* Add & Edit Record Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingRecord
                ? `Edit ${tabs.find((t) => t.id === activeTab)?.label} (#${editingRecord.id})`
                : `Add New ${tabs.find((t) => t.id === activeTab)?.label}`}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Name / Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Cambridge, Bag, Class 1"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Description / Code / Type (Optional)
                </label>
                <input
                  type="text"
                  value={newExtra}
                  onChange={(e) => setNewExtra(e.target.value)}
                  placeholder="Extra info or code"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setEditingRecord(null);
                  }}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  {editingRecord
                    ? (updateMutation.isPending ? 'Updating...' : 'Update Record')
                    : (createMutation.isPending ? 'Saving...' : 'Save Record')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
