import React, { useEffect, useState } from 'react';
import { studentAPI, roomAPI } from '../../services/api';
import { PageHeader, Button, Badge, Loading, Empty, Modal, Card } from '../../components/common';
import toast from 'react-hot-toast';
import { Users, Search, Phone, BookOpen } from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [saving, setSaving] = useState(false);

  const [allocateModal, setAllocateModal] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState('');

  useEffect(() => {
    const init = async () => {
      const [sRes, rRes] = await Promise.all([
        studentAPI.getAll({ status: filterStatus }),
        roomAPI.getAll({ status: 'available' }),
      ]);
      setStudents(sRes.data.data);
      setRooms(rRes.data.data);
      setLoading(false);
    };
    init();
  }, [filterStatus]);

  const handleAllocate = async () => {
    if (!selectedRoom) return;
    setSaving(true);
    try {
      await roomAPI.allocate(selectedRoom, allocateModal._id);
      toast.success('Room allocated successfully');
      setAllocateModal(null);
      const { data } = await studentAPI.getAll({ status: filterStatus });
      setStudents(data.data);
    } catch (e) { toast.error(e.response?.data?.message || 'Allocation failed'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (id, updates) => {
    try {
      await studentAPI.update(id, updates);
      toast.success('Student updated');
      const { data } = await studentAPI.getAll({ status: filterStatus });
      setStudents(data.data);
    } catch (e) { toast.error('Update failed'); }
  };

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber?.toLowerCase().includes(search.toLowerCase()) ||
    s.course?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <PageHeader title="Student Management" description={`${students.length} students`} />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 w-52" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-300">
            <option value="active">Active</option>
            <option value="vacated">Vacated</option>
            <option value="">All</option>
          </select>
        </div>
      </Card>

      {/* Student grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => (
          <Card key={s._id} className="p-5 hover:shadow-card-hover transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
                {s.name?.charAt(0)}
              </div>
              <Badge status={s.status} />
            </div>
            <h3 className="font-semibold text-slate-900">{s.name}</h3>
            <p className="text-slate-400 text-xs mt-0.5 font-mono">{s.rollNumber}</p>

            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <BookOpen className="w-3.5 h-3.5" />
                <span className="truncate">{s.course}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Phone className="w-3.5 h-3.5" />
                <span>{s.phone || '—'}</span>
              </div>
              {s.room ? (
                <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                  <span>🏠</span>
                  <span>Room {s.room.roomNumber} · Block {s.room.hostelBlock}</span>
                </div>
              ) : (
                <div className="text-xs text-amber-600 font-medium">⚠️ No room assigned</div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelectedStudent(s)}>View</Button>
              {!s.room && (
                <Button size="sm" className="flex-1" onClick={() => { setAllocateModal(s); setSelectedRoom(''); }}>
                  Assign Room
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && <Empty icon={Users} title="No students found" description="Try adjusting your search filters" />}

      {/* Student detail modal */}
      <Modal open={!!selectedStudent} onClose={() => setSelectedStudent(null)} title="Student Details" size="md">
        {selectedStudent && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold">
                {selectedStudent.name?.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-xl">{selectedStudent.name}</h3>
                <p className="text-slate-400 font-mono text-sm">{selectedStudent.rollNumber}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Course', selectedStudent.course],
                ['Year', selectedStudent.year ? `Year ${selectedStudent.year}` : '—'],
                ['Email', selectedStudent.email],
                ['Phone', selectedStudent.phone || '—'],
                ['Room', selectedStudent.room?.roomNumber || 'Not assigned'],
                ['Hostel', selectedStudent.hostel?.name || '—'],
                ['Guardian', selectedStudent.guardianName || '—'],
                ['Guardian Phone', selectedStudent.guardianPhone || '—'],
                ['Address', selectedStudent.address || '—'],
                ['Admission Date', selectedStudent.admissionDate ? new Date(selectedStudent.admissionDate).toLocaleDateString('en-IN') : '—'],
              ].map(([label, val]) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3">
                  <div className="text-xs text-slate-400">{label}</div>
                  <div className="font-medium text-slate-800 mt-0.5 text-sm">{val}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => { handleUpdate(selectedStudent._id, { status: selectedStudent.status === 'active' ? 'suspended' : 'active' }); setSelectedStudent(null); }} className="flex-1">
                {selectedStudent.status === 'active' ? 'Suspend' : 'Activate'}
              </Button>
              <Button onClick={() => setSelectedStudent(null)} className="flex-1">Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Room allocation modal */}
      <Modal open={!!allocateModal} onClose={() => setAllocateModal(null)} title="Assign Room">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Assigning room to <strong>{allocateModal?.name}</strong></p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Available Rooms</label>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {rooms.map(r => (
                <button key={r._id} onClick={() => setSelectedRoom(r._id)}
                  className={`text-left p-3 rounded-xl border text-xs transition ${selectedRoom === r._id ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className="font-semibold text-slate-800">{r.roomNumber}</div>
                  <div className="text-slate-400">Block {r.hostelBlock} · {r.occupiedCount}/{r.capacity} beds</div>
                  <div className="text-primary-600 font-medium mt-1">₹{r.monthlyRent?.toLocaleString('en-IN')}/mo</div>
                </button>
              ))}
            </div>
            {rooms.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No available rooms</p>}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setAllocateModal(null)}>Cancel</Button>
            <Button className="flex-1" disabled={!selectedRoom} loading={saving} onClick={handleAllocate}>Assign Room</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
