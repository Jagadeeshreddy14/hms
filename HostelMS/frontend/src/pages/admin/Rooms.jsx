import React, { useEffect, useState } from 'react';
import { roomAPI, hostelAPI } from '../../services/api';
import { PageHeader, Button, Badge, Loading, Empty, Modal, FormInput, FormSelect, Card } from '../../components/common';
import toast from 'react-hot-toast';
import { Plus, DoorOpen, Search, Bed } from 'lucide-react';

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRoom, setEditRoom] = useState(null);
  const [filterHostel, setFilterHostel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    roomNumber: '', hostel: '', hostelBlock: '', floor: 1,
    capacity: 2, type: 'double', monthlyRent: '', amenities: '',
    status: 'available', description: '',
  });

  useEffect(() => {
    Promise.all([
      roomAPI.getAll({ hostel: filterHostel, status: filterStatus }),
      hostelAPI.getAll(),
    ]).then(([rRes, hRes]) => {
      setRooms(rRes.data.data);
      setHostels(hRes.data.data);
    }).finally(() => setLoading(false));
  }, [filterHostel, filterStatus]);

  const openCreate = () => { setEditRoom(null); setForm({ roomNumber: '', hostel: hostels[0]?._id || '', hostelBlock: 'A', floor: 1, capacity: 2, type: 'double', monthlyRent: 5500, amenities: 'Fan, Attached Bathroom', status: 'available', description: '' }); setModalOpen(true); };
  const openEdit = (r) => { setEditRoom(r); setForm({ ...r, amenities: r.amenities?.join(', ') || '' }); setModalOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, amenities: form.amenities.split(',').map(s => s.trim()).filter(Boolean), floor: Number(form.floor), capacity: Number(form.capacity), monthlyRent: Number(form.monthlyRent) };
      if (editRoom) {
        await roomAPI.update(editRoom._id, payload);
        toast.success('Room updated');
      } else {
        await roomAPI.create(payload);
        toast.success('Room created');
      }
      setModalOpen(false);
      const res = await roomAPI.getAll({ hostel: filterHostel, status: filterStatus });
      setRooms(res.data.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error saving room');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this room?')) return;
    try {
      await roomAPI.delete(id);
      toast.success('Room deleted');
      setRooms(rooms.filter(r => r._id !== id));
    } catch (e) { toast.error(e.response?.data?.message || 'Cannot delete room'); }
  };

  const filtered = rooms.filter(r =>
    r.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
    r.hostelBlock?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Room Management"
        description={`${rooms.length} rooms across all hostels`}
        action={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Room
          </Button>
        }
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search rooms..."
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 w-48"
            />
          </div>
          <select value={filterHostel} onChange={e => setFilterHostel(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white">
            <option value="">All Hostels</option>
            {hostels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white">
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="full">Full</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </Card>

      {/* Room cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(room => (
          <Card key={room._id} className="p-5 hover:shadow-card-hover transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                <DoorOpen className="w-5 h-5 text-primary-600" />
              </div>
              <Badge status={room.status} />
            </div>
            <h3 className="font-display font-bold text-slate-900 text-lg">{room.roomNumber}</h3>
            <p className="text-slate-400 text-xs mt-0.5">Block {room.hostelBlock} · Floor {room.floor}</p>

            {/* Occupancy bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span className="flex items-center gap-1"><Bed className="w-3 h-3" /> {room.occupiedCount}/{room.capacity} beds</span>
                <span className="font-medium text-slate-700">₹{room.monthlyRent?.toLocaleString('en-IN')}/mo</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${room.occupiedCount >= room.capacity ? 'bg-red-400' : room.occupiedCount > 0 ? 'bg-blue-400' : 'bg-emerald-400'}`}
                  style={{ width: `${(room.occupiedCount / room.capacity) * 100}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-2 capitalize">{room.type} room</p>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(room)}>Edit</Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(room._id)} className="text-red-500 hover:bg-red-50">Del</Button>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && <Empty icon={DoorOpen} title="No rooms found" description="Try adjusting your filters or add a new room" action={<Button onClick={openCreate}>Add Room</Button>} />}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editRoom ? 'Edit Room' : 'Add New Room'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Room Number *" value={form.roomNumber} onChange={e => setForm({ ...form, roomNumber: e.target.value })} placeholder="e.g. A-101" />
            <FormInput label="Monthly Rent (₹) *" type="number" value={form.monthlyRent} onChange={e => setForm({ ...form, monthlyRent: e.target.value })} />
          </div>
          <FormSelect label="Hostel *" value={form.hostel} onChange={e => setForm({ ...form, hostel: e.target.value })}>
            {hostels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
          </FormSelect>
          <div className="grid grid-cols-3 gap-3">
            <FormInput label="Block" value={form.hostelBlock} onChange={e => setForm({ ...form, hostelBlock: e.target.value })} placeholder="A" />
            <FormInput label="Floor" type="number" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} />
            <FormInput label="Capacity" type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormSelect label="Type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="triple">Triple</option>
              <option value="dormitory">Dormitory</option>
            </FormSelect>
            <FormSelect label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="available">Available</option>
              <option value="maintenance">Maintenance</option>
            </FormSelect>
          </div>
          <FormInput label="Amenities (comma-separated)" value={form.amenities} onChange={e => setForm({ ...form, amenities: e.target.value })} placeholder="AC, Attached Bathroom, Balcony" />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>{editRoom ? 'Update' : 'Create'} Room</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
