import React, { useEffect, useState, useCallback } from 'react';
import { complaintAPI } from '../../services/api';
import { PageHeader, Button, Badge, PriorityBadge, Loading, Empty, Modal, Card } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, AlertCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CATEGORIES = ['electricity', 'water', 'internet', 'maintenance', 'food', 'security', 'other'];
const CATEGORY_ICONS = { electricity: '⚡', water: '💧', internet: '📶', maintenance: '🔧', food: '🍽️', security: '🛡️', other: '📋' };

export default function ComplaintsPage() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [statusModal, setStatusModal] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ category: 'maintenance', title: '', description: '', priority: 'medium' });
  const [statusForm, setStatusForm] = useState({ status: '', note: '' });

  const load = useCallback(async () => {
    const params = {};
    if (filterStatus) params.status = filterStatus;
    if (filterCategory) params.category = filterCategory;
    const { data } = await complaintAPI.getAll(params);
    setComplaints(data.data);
  }, [filterStatus, filterCategory]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await complaintAPI.create(form);
      toast.success('Complaint submitted successfully');
      setCreateModal(false);
      setForm({ category: 'maintenance', title: '', description: '', priority: 'medium' });
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit complaint');
    } finally { setSaving(false); }
  };

  const handleStatusUpdate = async () => {
    if (!statusForm.status) return;
    setSaving(true);
    try {
      await complaintAPI.updateStatus(statusModal._id, statusForm);
      toast.success('Status updated');
      setStatusModal(null);
      load();
    } catch (e) {
      toast.error('Failed to update status');
    } finally { setSaving(false); }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isStudent ? 'My Complaints' : 'All Complaints'}
        description={`${complaints.length} complaint${complaints.length !== 1 ? 's' : ''}`}
        action={isStudent && (
          <Button onClick={() => setCreateModal(true)}>
            <Plus className="w-4 h-4" /> New Complaint
          </Button>
        )}
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-300">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-300">
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
          </select>
        </div>
      </Card>

      {/* Complaints list */}
      <div className="space-y-3">
        {complaints.map(c => (
          <Card key={c._id} className="p-5 hover:shadow-card-hover transition-shadow cursor-pointer" onClick={() => setSelectedComplaint(c)}>
            <div className="flex items-start gap-4">
              <div className="text-2xl">{CATEGORY_ICONS[c.category] || '📋'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-slate-900 text-sm">{c.title}</h3>
                  <Badge status={c.status} />
                  <PriorityBadge priority={c.priority} />
                </div>
                <p className="text-slate-500 text-xs mt-1 line-clamp-1">{c.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <span>#{c.ticketNumber}</span>
                  {!isStudent && <span>· {c.student?.name}</span>}
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
              {!isStudent && c.status === 'pending' && (
                <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); setStatusModal(c); setStatusForm({ status: 'in_progress', note: '' }); }}>
                  Update
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {complaints.length === 0 && (
        <Empty icon={AlertCircle} title="No complaints found" description={isStudent ? "You haven't raised any complaints yet" : "No complaints match your filters"}
          action={isStudent && <Button onClick={() => setCreateModal(true)}>Submit Complaint</Button>}
        />
      )}

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Submit a Complaint">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.slice(0, 4).map(cat => (
                <button key={cat} onClick={() => setForm({ ...form, category: cat })}
                  className={`text-center py-3 px-2 rounded-xl border text-xs font-medium transition ${form.category === cat ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="text-xl mb-1">{CATEGORY_ICONS[cat]}</div>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Brief description of the issue" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description *</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Provide detailed information about the issue..." className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-300">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleCreate}>Submit Complaint</Button>
          </div>
        </div>
      </Modal>

      {/* Status Update Modal */}
      <Modal open={!!statusModal} onClose={() => setStatusModal(null)} title="Update Complaint Status">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">New Status</label>
            <select value={statusForm.status} onChange={e => setStatusForm({ ...statusForm, status: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-300">
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Note / Resolution</label>
            <textarea value={statusForm.note} onChange={e => setStatusForm({ ...statusForm, note: e.target.value })} rows={3} placeholder="Add a note about the action taken..." className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none" />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setStatusModal(null)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleStatusUpdate}>Update Status</Button>
          </div>
        </div>
      </Modal>

      {/* Complaint detail */}
      <Modal open={!!selectedComplaint} onClose={() => setSelectedComplaint(null)} title="Complaint Details" size="lg">
        {selectedComplaint && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{CATEGORY_ICONS[selectedComplaint.category]}</div>
              <div>
                <h3 className="font-semibold text-slate-900">{selectedComplaint.title}</h3>
                <p className="text-slate-400 text-xs">#{selectedComplaint.ticketNumber}</p>
              </div>
              <div className="ml-auto flex gap-2"><Badge status={selectedComplaint.status} /><PriorityBadge priority={selectedComplaint.priority} /></div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-slate-700 text-sm">{selectedComplaint.description}</p>
            </div>
            {selectedComplaint.resolutionNote && (
              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-emerald-700 mb-1">Resolution Note</p>
                <p className="text-emerald-800 text-sm">{selectedComplaint.resolutionNote}</p>
              </div>
            )}
            {/* Timeline */}
            {selectedComplaint.timeline?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Timeline</h4>
                <div className="space-y-2">
                  {selectedComplaint.timeline.map((t, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium capitalize">{t.status?.replace(/_/g, ' ')}</span>
                        {t.note && <span className="text-slate-500"> – {t.note}</span>}
                        <p className="text-xs text-slate-400">{new Date(t.updatedAt).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
