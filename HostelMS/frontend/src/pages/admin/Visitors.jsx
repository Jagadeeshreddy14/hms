import React, { useEffect, useState, useCallback } from 'react';
import { visitorAPI, studentAPI } from '../../services/api';
import { PageHeader, Button, Badge, Loading, Empty, Modal, Table, Card, FormInput, FormSelect } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { UserCheck, Plus, LogOut } from 'lucide-react';

export default function VisitorsPage() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const [visitors, setVisitors] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    visitorName: '', visitorPhone: '', purpose: '',
    relationship: 'Other', numberOfVisitors: 1,
    student: '',
  });

  const load = useCallback(async () => {
    const { data } = await visitorAPI.getAll();
    setVisitors(data.data);
  }, []);

  useEffect(() => {
    const init = async () => {
      await load();
      if (!isStudent) {
        const { data } = await studentAPI.getAll();
        setStudents(data.data);
      }
      setLoading(false);
    };
    init();
  }, [load, isStudent]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await visitorAPI.create({ ...form, numberOfVisitors: Number(form.numberOfVisitors) });
      toast.success('Visitor registered successfully');
      setCreateModal(false);
      setForm({ visitorName: '', visitorPhone: '', purpose: '', relationship: 'Other', numberOfVisitors: 1, student: '' });
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Error registering visitor'); }
    finally { setSaving(false); }
  };

  const handleCheckout = async (id) => {
    try {
      await visitorAPI.checkout(id);
      toast.success('Visitor checked out');
      load();
    } catch (e) { toast.error('Checkout failed'); }
  };

  const checkedIn = visitors.filter(v => v.status === 'checked_in').length;

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visitor Management"
        description={`${checkedIn} currently inside`}
        action={
          <Button onClick={() => setCreateModal(true)}>
            <Plus className="w-4 h-4" /> Register Visitor
          </Button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{checkedIn}</div>
          <div className="text-xs text-slate-500 mt-1">Currently Inside</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-slate-700">{visitors.filter(v => v.status === 'checked_out').length}</div>
          <div className="text-xs text-slate-500 mt-1">Checked Out Today</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{visitors.length}</div>
          <div className="text-xs text-slate-500 mt-1">Total Records</div>
        </Card>
      </div>

      <Card>
        <Table headers={['Visitor', 'Student', 'Purpose', 'Entry Time', 'Exit Time', 'Status', 'Action']}>
          {visitors.map(v => (
            <tr key={v._id} className="hover:bg-slate-50">
              <td className="py-3 px-4">
                <p className="font-medium text-slate-900 text-sm">{v.visitorName}</p>
                <p className="text-slate-400 text-xs">{v.visitorPhone} · {v.relationship}</p>
              </td>
              <td className="py-3 px-4 text-sm text-slate-600">{v.student?.name}</td>
              <td className="py-3 px-4 text-sm text-slate-600">{v.purpose}</td>
              <td className="py-3 px-4 text-xs text-slate-500">{new Date(v.entryTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
              <td className="py-3 px-4 text-xs text-slate-500">{v.exitTime ? new Date(v.exitTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td>
              <td className="py-3 px-4"><Badge status={v.status} /></td>
              <td className="py-3 px-4">
                {v.status === 'checked_in' && !isStudent && (
                  <Button size="sm" variant="secondary" onClick={() => handleCheckout(v._id)}>
                    <LogOut className="w-3.5 h-3.5" /> Check Out
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </Table>
        {visitors.length === 0 && <Empty icon={UserCheck} title="No visitor records" description="Visitor entries will appear here" />}
      </Card>

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Register Visitor">
        <div className="space-y-4">
          {!isStudent && (
            <FormSelect label="Student *" value={form.student} onChange={e => setForm({ ...form, student: e.target.value })}>
              <option value="">Select student...</option>
              {students.map(s => <option key={s._id} value={s._id}>{s.name} - {s.rollNumber}</option>)}
            </FormSelect>
          )}
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Visitor Name *" value={form.visitorName} onChange={e => setForm({ ...form, visitorName: e.target.value })} placeholder="Full name" />
            <FormInput label="Phone *" value={form.visitorPhone} onChange={e => setForm({ ...form, visitorPhone: e.target.value })} placeholder="10-digit mobile" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormSelect label="Relationship" value={form.relationship} onChange={e => setForm({ ...form, relationship: e.target.value })}>
              {['Father','Mother','Sibling','Friend','Guardian','Other'].map(r => <option key={r} value={r}>{r}</option>)}
            </FormSelect>
            <FormInput label="No. of Visitors" type="number" min="1" value={form.numberOfVisitors} onChange={e => setForm({ ...form, numberOfVisitors: e.target.value })} />
          </div>
          <FormInput label="Purpose of Visit *" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} placeholder="e.g. Family visit, document collection" />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleCreate}>Register Visitor</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
