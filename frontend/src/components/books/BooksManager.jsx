import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { itemsAPI, mastersAPI } from '../../services/api';

// Inventory management component for books, notebooks, and stationery
export default function BooksManager() {
  const queryClient = useQueryClient();

  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [classFilter, setClassFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [curriculumFilter, setCurriculumFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');

  // TanStack Query for dynamic Master Lookup Tables
  const { data: mastersData } = useQuery({
    queryKey: ['masters-all'],
    queryFn: async () => {
      const res = await mastersAPI.getAll();
      return res.data || {};
    }
  });

  const itemTypesList = mastersData?.item_types || [];
  const classesList = mastersData?.classes || [];
  const subjectsList = mastersData?.subjects || [];
  const publishersList = mastersData?.authors_publishers || [];
  const curriculumsList = mastersData?.curriculums || [];

  // Add / Edit Item Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    item_code: '',
    name: '',
    item_type: '',
    class_id: 1,
    subject: '',
    curriculum: 'NCERT',
    author_publisher: '',
    price: '',
    stock_qty: ''
  });

  // Open modal for creating new item
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      item_code: '',
      name: '',
      item_type: itemTypesList[0]?.name || 'BOOK',
      class_id: classesList[0]?.id || 1,
      subject: '',
      curriculum: curriculumsList[0]?.name || 'NCERT',
      author_publisher: '',
      price: '',
      stock_qty: ''
    });
    setIsAddOpen(true);
  };

  // Open modal for editing existing item
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      item_code: item.item_code || '',
      name: item.name || '',
      item_type: item.item_type || (itemTypesList[0]?.name || 'BOOK'),
      class_id: item.class_id || 1,
      subject: item.subject || '',
      curriculum: item.curriculum || (curriculumsList[0]?.name || 'NCERT'),
      author_publisher: item.author_publisher || '',
      price: item.price !== undefined ? item.price : '',
      stock_qty: item.stock_qty !== undefined ? item.stock_qty : ''
    });
    setIsAddOpen(true);
  };

  // Excel Upload Modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);

  // TanStack Query for Items (Cached per filter queryKey)
  const { data: items = [], isLoading: loading, refetch: refetchItems } = useQuery({
    queryKey: ['items', { classFilter, typeFilter, curriculumFilter, searchQuery: submittedSearch }],
    queryFn: async () => {
      const params = {};
      if (classFilter) params.class_id = classFilter;
      if (typeFilter) params.item_type = typeFilter;
      if (curriculumFilter) params.curriculum = curriculumFilter;
      if (submittedSearch) params.search = submittedSearch;

      const res = await itemsAPI.getAll(params);
      return res.data || [];
    }
  });

  // Add Item Mutation
  const addItemMutation = useMutation({
    mutationFn: async (newItem) => {
      return await itemsAPI.create(newItem);
    },
    onSuccess: (res) => {
      setSuccessMsg(res?.message || 'Item added successfully');
      setIsAddOpen(false);
      setEditingItem(null);
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to add item');
    }
  });

  // Update Item Mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      return await itemsAPI.update(id, payload);
    },
    onSuccess: (res) => {
      setSuccessMsg(res?.message || 'Item updated successfully');
      setIsAddOpen(false);
      setEditingItem(null);
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to update item');
    }
  });

  // Delete Item Mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id) => {
      return await itemsAPI.delete(id);
    },
    onSuccess: () => {
      setSuccessMsg('Item deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to delete item');
    }
  });

  // Excel Upload Mutation
  const uploadExcelMutation = useMutation({
    mutationFn: async (file) => {
      const data = new FormData();
      data.append('file', file);
      return await itemsAPI.uploadExcel(data);
    },
    onSuccess: (res) => {
      setSuccessMsg(res?.message || 'Excel uploaded successfully');
      setIsUploadOpen(false);
      setUploadFile(null);
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Excel processing failed');
    }
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSubmittedSearch(searchQuery);
  };

  const handleSaveItem = (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      ...formData,
      subject: formData.subject || null,
      curriculum: formData.curriculum || 'NCERT',
      author_publisher: formData.author_publisher ? formData.author_publisher.trim() : null,
      price: parseFloat(formData.price) || 0,
      stock_qty: parseInt(formData.stock_qty) || 0
    };

    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, payload });
    } else {
      addItemMutation.mutate(payload);
    }
  };

  const handleDelete = (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from inventory?`)) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    deleteItemMutation.mutate(id);
  };

  const handleExcelUpload = (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    uploadExcelMutation.mutate(uploadFile);
  };

  const totalStock = items.reduce((acc, it) => acc + (parseInt(it.stock_qty) || 0), 0);
  const totalValuation = items.reduce((acc, it) => acc + ((parseInt(it.stock_qty) || 0) * (parseFloat(it.price) || 0)), 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <span>Manage Books & Inventory Items</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Library inventory covering Class 1-12 Books, Copies, Pens & Stationery with Curriculum tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => refetchItems()}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh Inventory Cache"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Download Excel Template */}
          <a
            href={itemsAPI.downloadTemplate()}
            download
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Template</span>
          </a>

          {/* Upload Excel Button */}
          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold shadow-sm transition"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Upload Excel</span>
          </button>

          {/* Add Item Button */}
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Book / Item</span>
          </button>
        </div>
      </div>

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

      {/* Filters and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code, title, author..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Class Filter */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Classes</option>
            {classesList.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Item Types</option>
            {itemTypesList.map((t) => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>

          {/* Curriculum Filter */}
          <select
            value={curriculumFilter}
            onChange={(e) => setCurriculumFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Curriculums</option>
            {curriculumsList.map((cur) => (
              <option key={cur.id} value={cur.name}>{cur.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Stats Pill */}
      <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-600">
        <div>Filtered Items: <span className="text-slate-900 font-bold">{items.length}</span></div>
        <div>Total Stock: <span className="text-blue-600 font-bold">{totalStock} units</span></div>
        <div>Valuation: <span className="text-emerald-600 font-bold">₹{totalValuation.toLocaleString()}</span></div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Item Name / Title</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Curriculum</th>
                <th className="py-3 px-4">Author / Publisher</th>
                <th className="py-3 px-4 text-right">Price</th>
                <th className="py-3 px-4 text-right">Stock</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-slate-400">
                    No items found matching the selected filters.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{item.item_code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{item.name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.item_type === 'BOOK' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        item.item_type === 'COPY' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {item.item_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{item.class_grade || `Class ${item.class_id}`}</td>
                    <td className="py-3 px-4 text-slate-500">{item.subject || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                        {item.curriculum || 'NCERT'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{item.author_publisher || '-'}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">₹{parseFloat(item.price).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-semibold ${item.stock_qty > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {item.stock_qty}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="Edit Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          disabled={deleteItemMutation.isPending}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                          title="Delete"
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

      {/* Add / Edit Item Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingItem ? `Edit Item (${editingItem.item_code})` : 'Add New Inventory Item'}
            </h3>
            <form onSubmit={handleSaveItem} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Item Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.item_code}
                    onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                    placeholder="e.g. 0005, 5542 or BK-01"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Item Type *</label>
                  <select
                    value={formData.item_type}
                    onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white outline-none font-semibold text-slate-800"
                  >
                    {itemTypesList.length === 0 ? (
                      <option value="">No Item Types found in Master</option>
                    ) : (
                      itemTypesList.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Item Name / Title *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rimjhim (Hindi) or 4-Line Notebook"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Class *</label>
                  <select
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white outline-none"
                    required
                  >
                    {classesList.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Subject (Optional)</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white outline-none"
                  >
                    <option value="">-- None / No Subject (Optional) --</option>
                    {subjectsList.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Stock Qty *</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={formData.stock_qty}
                    onChange={(e) => setFormData({ ...formData, stock_qty: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>

              {/* Curriculum and Author / Publisher */}
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Author / Publisher (Optional)
                  </label>
                  <select
                    value={formData.author_publisher}
                    onChange={(e) => setFormData({ ...formData, author_publisher: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white outline-none font-medium text-slate-800"
                  >
                    <option value="">-- None / No Publisher (Optional) --</option>
                    {publishersList.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addItemMutation.isPending || updateItemMutation.isPending}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  {editingItem
                    ? (updateItemMutation.isPending ? 'Updating...' : 'Update Item')
                    : (addItemMutation.isPending ? 'Saving...' : 'Save Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Bulk Excel Upload</span>
            </h3>
            <p className="text-xs text-slate-500">
              Columns supported: [Item Code, Item Name, Item Type, Class ID, Subject, Curriculum, Author / Publisher, Price, Stock Qty]
            </p>

            <form onSubmit={handleExcelUpload} className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-500 transition cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  required
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-[11px] text-slate-400 mt-2">Only .xlsx or .xls files</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadExcelMutation.isPending || !uploadFile}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50"
                >
                  {uploadExcelMutation.isPending ? 'Processing...' : 'Upload & Process'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
