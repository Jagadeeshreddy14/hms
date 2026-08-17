import React, { useEffect, useState } from 'react';
import { hostelAPI } from '../../services/api';
import { PageHeader, Button, Loading, Empty, Modal, Card, FormInput, FormSelect } from '../../components/common';
import toast from 'react-hot-toast';
import { Building2, Plus, MapPin } from 'lucide-react';

export default function HostelsPage() {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editHostel, setEditHostel] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: '', address: '', type: 'boys', totalRooms: 0, amenities: '', description: '', contactPhone: '' });

  const load = async () => {
    const { data } = await hostelAPI.getAll();
    setHostels(data.data);
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const openCreate = () => { setEditHostel(null); setForm({ name: '', address: '', type: 'boys', totalRooms: 0, amenities: 'WiFi, Laundry, Canteen', description: '', contactPhone: '' }); setModalOpen(true); };
  const openEdit = (h) => { setEditHostel(h); setForm({ ...h, amenities: h.amenities?.join(', ') || '' }); setModalOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, amenities: form.amenities.split(',').map(s => s.trim()).filter(Boolean), totalRooms: Number(form.totalRooms) };
      if (editHostel) { await hostelAPI.update(editHostel._id, payload); toast.success('Hostel updated'); }
      else { await hostelAPI.create(payload); toast.success('Hostel created'); }
      setModalOpen(false);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Error saving hostel'); }
    finally { setSaving(false); }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hostel Management"
        description={`${hostels.length} hostel block${hostels.length !== 1 ? 's' : ''}`}
        action={<Button onClick={openCreate}><Plus className="w-4 h-4" /> Add Hostel</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {hostels.map(h => (
          <Card key={h._id} className="overflow-hidden hover:shadow-card-hover transition-shadow">
            <div className={`h-2 ${h.type === 'boys' ? 'bg-blue-500' : h.type === 'girls' ? 'bg-pink-500' : 'bg-violet-500'}`} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5.5 h-5.5 text-primary-600" />
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${h.type === 'boys' ? 'bg-blue-100 text-blue-700' : h.type === 'girls' ? 'bg-pink-100 text-pink-700' : 'bg-violet-100 text-violet-700'}`}>
                  {h.type}
                </span>
              </div>

              <h3 className="font-display font-bold text-slate-900 text-lg leading-tight">{h.name}</h3>
              <div className="flex items-start gap-1.5 mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-slate-400 text-xs">{h.address}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-emerald-600">{h.stats?.available || 0}</div>
                  <div className="text-xs text-slate-400">Available</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-blue-600">{(h.stats?.occupied || 0) + (h.stats?.full || 0)}</div>
                  <div className="text-xs text-slate-400">Occupied</div>
                </div>
              </div>

              {h.amenities?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {h.amenities.slice(0, 4).map(a => (
                    <span key={a} className="text-xs bg-slate-100 text-slate-500 rounded-lg px-2 py-0.5">{a}</span>
                  ))}
                  {h.amenities.length > 4 && <span className="text-xs text-slate-400">+{h.amenities.length - 4}</span>}
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(h)}>Edit</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {hostels.length === 0 && <Empty icon={Building2} title="No hostels yet" description="Create your first hostel block to get started" action={<Button onClick={openCreate}>Add Hostel</Button>} />}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editHostel ? 'Edit Hostel' : 'Add New Hostel'}>
        <div className="space-y-4">
          <FormInput label="Hostel Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Block A - Boys Hostel" />
          <FormInput label="Address *" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
          <div className="grid grid-cols-2 gap-3">
            <FormSelect label="Type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="boys">Boys</option>
              <option value="girls">Girls</option>
              <option value="co-ed">Co-ed</option>
            </FormSelect>
            <FormInput label="Total Rooms" type="number" value={form.totalRooms} onChange={e => setForm({ ...form, totalRooms: e.target.value })} />
          </div>
          <FormInput label="Contact Phone" value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} placeholder="Management contact" />
          <FormInput label="Amenities (comma-separated)" value={form.amenities} onChange={e => setForm({ ...form, amenities: e.target.value })} placeholder="WiFi, Laundry, Canteen, Gym" />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none" placeholder="Brief description..." />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>{editHostel ? 'Update' : 'Create'} Hostel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
