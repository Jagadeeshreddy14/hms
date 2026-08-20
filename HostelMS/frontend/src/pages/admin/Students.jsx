import React, { useEffect, useState } from 'react';
import { studentAPI, roomAPI, studentApprovalAPI } from '../../services/api';
import { Button, Loading, Empty, Modal, Card } from '../../components/common';
import toast from 'react-hot-toast';
import {
  Users,
  Search,
  Clock,
  CheckCircle2,
  Eye,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRegStatus, setFilterRegStatus] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Add Resident Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newResident, setNewResident] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'Resident@123',
    emergencyContact: '',
    guardianName: '',
    guardianRelation: 'Parent',
    guardianPhone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    room: '',
    role: 'student',
  });

  const [allocateModal, setAllocateModal] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState('');

  // Role Assignment Modal State
  const [roleModalStudent, setRoleModalStudent] = useState(null);
  const [selectedRole, setSelectedRole] = useState('student');

  const loadData = async () => {
    try {
      const params = {};
      if (filterRegStatus) params.registrationStatus = filterRegStatus;

      const [sRes, rRes, statsRes] = await Promise.all([
        studentAPI.getAll(params),
        roomAPI.getAll({ status: 'available' }),
        studentApprovalAPI.getStats().catch(() => ({ data: { pending: 0 } })),
      ]);
      setStudents(sRes.data.data || []);
      setRooms(rRes.data.data || []);
      setPendingCount(statsRes.data?.pending || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRegStatus]);

  const handleCreateResident = async (e) => {
    e.preventDefault();
    if (!newResident.name.trim() || !newResident.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    setSaving(true);
    try {
      await studentAPI.create(newResident);
      toast.success(`Resident "${newResident.name}" created successfully!`);
      setAddModalOpen(false);
      setNewResident({
        name: '',
        email: '',
        phone: '',
        password: 'Resident@123',
        emergencyContact: '',
        guardianName: '',
        guardianRelation: 'Parent',
        guardianPhone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        room: '',
        role: 'student',
      });
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add resident');
    } finally {
      setSaving(false);
    }
  };

  const handleAllocate = async () => {
    if (!selectedRoom) return;
    setSaving(true);
    try {
      await roomAPI.allocate(selectedRoom, allocateModal._id);
      toast.success('Room allocated successfully');
      setAllocateModal(null);
      await loadData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Allocation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveRegistration = async (studentId) => {
    try {
      await studentApprovalAPI.approveRegistration(studentId, {});
      toast.success('Resident approved successfully!');
      if (selectedStudent?._id === studentId) {
        setSelectedStudent((prev) => ({ ...prev, registrationStatus: 'approved', status: 'active' }));
      }
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleAssignRole = async () => {
    if (!roleModalStudent) return;
    setSaving(true);
    try {
      await studentAPI.update(roleModalStudent._id, { role: selectedRole });
      toast.success(`Role updated to ${selectedRole.toUpperCase()}`);
      setRoleModalStudent(null);
      if (selectedStudent?._id === roleModalStudent._id) {
        setSelectedStudent((prev) => ({
          ...prev,
          user: { ...prev.user, role: selectedRole },
        }));
      }
      await loadData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await studentAPI.update(id, { status: newStatus });
      toast.success(`Resident status updated to ${newStatus}`);
      if (selectedStudent?._id === id) {
        setSelectedStudent((prev) => ({ ...prev, status: newStatus }));
      }
      await loadData();
    } catch (e) {
      toast.error('Failed to update resident status');
    }
  };

  const filtered = students.filter((s) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name?.toLowerCase().includes(q) ||
      s.rollNumber?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q) ||
      s.user?.phone?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.user?.email?.toLowerCase().includes(q) ||
      s.address?.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q)
    );
  });

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-slate-900 text-2xl">Resident Directory</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Review pending resident registrations and manage active profiles
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => setAddModalOpen(true)} className="gap-2 shadow-md">
            <Plus className="w-4 h-4" /> Add Resident
          </Button>

          {pendingCount > 0 && (
            <Link
              to="/admin/student-approvals"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl shadow-sm transition"
            >
              <Clock className="w-4 h-4" /> {pendingCount} Pending
            </Link>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search resident by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2">
            {[
              { label: 'All Residents', val: '' },
              { label: 'Pending Approval', val: 'pending' },
              { label: 'Active (Approved)', val: 'approved' },
            ].map((tab) => (
              <button
                key={tab.val}
                type="button"
                onClick={() => setFilterRegStatus(tab.val)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  filterRegStatus === tab.val
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Resident Directory Table */}
      <Card className="overflow-hidden border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">RESIDENT</th>
                <th className="py-4 px-6">CONTACT</th>
                <th className="py-4 px-6">EMERGENCY CONTACT</th>
                <th className="py-4 px-6">APPROVAL & ROLE</th>
                <th className="py-4 px-6 text-right">ADMIN ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((s) => {
                const isPending = s.registrationStatus === 'pending';
                const isSuspended = s.status === 'suspended';
                const role = s.user?.role || 'student';

                const fullAddress = [s.address, s.city, s.state, s.pincode].filter(Boolean).join(', ');
                const phone = s.phone || s.user?.phone;
                const email = s.email || s.user?.email;
                const emergencyPhone = s.emergencyContact || s.guardianPhone;
                const guardianInfo = s.guardianName
                  ? `${s.guardianName}${s.guardianRelation ? ` (${s.guardianRelation.toLowerCase()})` : ''}`
                  : null;

                return (
                  <tr key={s._id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* RESIDENT Column */}
                    <td className="py-4 px-6">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                          {s.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0 max-w-[260px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-sm group-hover:text-primary-600 transition truncate">
                              {s.name}
                            </span>
                            {role === 'admin' && (
                              <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-200">
                                ADMIN
                              </span>
                            )}
                            {role === 'warden' && (
                              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-200">
                                WARDEN
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {fullAddress || 'No address set'}
                          </div>
                          {s.room && (
                            <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                              <span>🏠 Room {s.room.roomNumber}</span>
                              <span className="text-slate-400">({s.room.hostelBlock})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* CONTACT Column */}
                    <td className="py-4 px-6 align-top">
                      <div className="text-sm font-semibold text-slate-800">
                        {phone ? (
                          <a href={`tel:${phone}`} className="hover:text-primary-600 transition">
                            {phone}
                          </a>
                        ) : (
                          <span className="text-slate-400 font-normal">Phone pending</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[220px]">
                        {email || '—'}
                      </div>
                    </td>

                    {/* EMERGENCY CONTACT Column */}
                    <td className="py-4 px-6 align-top">
                      {guardianInfo || emergencyPhone ? (
                        <div>
                          {guardianInfo && (
                            <div className="text-sm font-semibold text-slate-800">{guardianInfo}</div>
                          )}
                          {emergencyPhone && (
                            <div className="text-xs text-slate-500 mt-0.5 font-mono">
                              <a href={`tel:${emergencyPhone}`} className="hover:text-primary-600 transition">
                                {emergencyPhone}
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Not set</span>
                      )}
                    </td>

                    {/* APPROVAL & ROLE Column */}
                    <td className="py-4 px-6 align-middle">
                      <div className="space-y-1">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            Pending Admin Approval
                          </span>
                        ) : isSuspended ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                            Suspended / Inactive
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Active (Approved)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* ADMIN ACTION Column */}
                    <td className="py-4 px-6 align-middle text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isPending ? (
                          <button
                            type="button"
                            onClick={() => handleApproveRegistration(s._id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition active:scale-95"
                          >
                            Approve Resident
                          </button>
                        ) : (
                          <>
                            {!s.room && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAllocateModal(s);
                                  setSelectedRoom('');
                                }}
                                className="px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 text-xs font-semibold rounded-xl transition"
                              >
                                Assign Room
                              </button>
                            )}

                            {/* Assign Role / Admin Action */}
                            <button
                              type="button"
                              onClick={() => {
                                setRoleModalStudent(s);
                                setSelectedRole(s.user?.role || 'student');
                              }}
                              className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold rounded-xl transition"
                              title="Assign Admin or change Role"
                            >
                              Assign Admin
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeactivate(s._id, s.status)}
                              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-xl transition"
                            >
                              {s.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(s)}
                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                          title="View resident details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <Empty
            icon={Users}
            title="No residents found"
            description="Try adjusting your search query or approval status filter"
            action={<Button onClick={() => setAddModalOpen(true)}>Add Resident</Button>}
          />
        )}
      </Card>

      {/* ADD RESIDENT MODAL */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add New Resident (Admin Registration)" size="lg">
        <form onSubmit={handleCreateResident} className="space-y-4">
          <div className="bg-primary-50 border border-primary-100 p-3 rounded-xl text-xs text-primary-800">
            Directly register and approve a resident. They will be immediately activated and assigned login access.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name *</label>
              <input
                required
                value={newResident.name}
                onChange={(e) => setNewResident({ ...newResident, name: e.target.value })}
                placeholder="e.g. Ramesh Reddy"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Mobile Phone *</label>
              <input
                required
                value={newResident.phone}
                onChange={(e) => setNewResident({ ...newResident, phone: e.target.value })}
                placeholder="10-digit mobile"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email Address *</label>
              <input
                required
                type="email"
                value={newResident.email}
                onChange={(e) => setNewResident({ ...newResident, email: e.target.value })}
                placeholder="resident@example.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Password</label>
              <input
                type="password"
                value={newResident.password}
                onChange={(e) => setNewResident({ ...newResident, password: e.target.value })}
                placeholder="Default: Resident@123"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Emergency Contact</label>
              <input
                value={newResident.emergencyContact}
                onChange={(e) => setNewResident({ ...newResident, emergencyContact: e.target.value })}
                placeholder="Emergency Contact Phone"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Guardian Name & Relation
              </label>
              <div className="flex gap-2">
                <input
                  value={newResident.guardianName}
                  onChange={(e) => setNewResident({ ...newResident, guardianName: e.target.value })}
                  placeholder="Guardian Name"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <select
                  value={newResident.guardianRelation}
                  onChange={(e) => setNewResident({ ...newResident, guardianRelation: e.target.value })}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Parent">Parent</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Residential Address</label>
            <input
              value={newResident.address}
              onChange={(e) => setNewResident({ ...newResident, address: e.target.value })}
              placeholder="Door/Flat No., Street, Area..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">City</label>
              <input
                value={newResident.city}
                onChange={(e) => setNewResident({ ...newResident, city: e.target.value })}
                placeholder="City"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">State</label>
              <input
                value={newResident.state}
                onChange={(e) => setNewResident({ ...newResident, state: e.target.value })}
                placeholder="State"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">PIN Code</label>
              <input
                value={newResident.pincode}
                onChange={(e) => setNewResident({ ...newResident, pincode: e.target.value })}
                placeholder="6-digit PIN"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Assign Room</label>
              <select
                value={newResident.room}
                onChange={(e) => setNewResident({ ...newResident, room: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">No Room Assigned (Assign Later)</option>
                {rooms.map((r) => (
                  <option key={r._id} value={r._id}>
                    Room {r.roomNumber} (Block {r.hostelBlock}) · {r.occupiedCount}/{r.capacity} beds · ₹{r.monthlyRent}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Assign Role</label>
              <select
                value={newResident.role}
                onChange={(e) => setNewResident({ ...newResident, role: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
              >
                <option value="student">Student / Resident</option>
                <option value="admin">Administrator (Admin Privileges)</option>
                <option value="warden">Warden</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" className="flex-1" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving} className="flex-1 shadow-md">
              Create & Approve Resident
            </Button>
          </div>
        </form>
      </Modal>

      {/* ASSIGN ROLE / ADMIN MODAL */}
      <Modal
        open={!!roleModalStudent}
        onClose={() => setRoleModalStudent(null)}
        title="Assign Admin / Change Role"
        size="sm"
      >
        {roleModalStudent && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-400">User Account</div>
              <div className="font-bold text-slate-800 text-sm">{roleModalStudent.name}</div>
              <div className="text-xs text-slate-500">{roleModalStudent.email || roleModalStudent.user?.email}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Select Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="student">Student / Resident (Normal Access)</option>
                <option value="admin">Administrator (Full Admin Access)</option>
                <option value="warden">Warden (Hostel Warden Access)</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setRoleModalStudent(null)}>
                Cancel
              </Button>
              <Button loading={saving} onClick={handleAssignRole} className="flex-1 bg-purple-600 hover:bg-purple-700">
                Save Role
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Clean Resident Detail Modal */}
      <Modal open={!!selectedStudent} onClose={() => setSelectedStudent(null)} title="Resident Details" size="md">
        {selectedStudent && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xl font-bold shadow-md">
                  {selectedStudent.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{selectedStudent.name}</h3>
                  <p className="text-slate-400 font-mono text-xs">
                    {selectedStudent.rollNumber ? `Roll No: ${selectedStudent.rollNumber}` : 'Resident'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {selectedStudent.registrationStatus === 'pending' ? (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-200">
                    Pending Approval
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
                    Active (Approved)
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-xs text-slate-400 font-medium">Mobile Phone</div>
                <div className="font-semibold text-slate-800 mt-0.5 text-sm">
                  {selectedStudent.phone || selectedStudent.user?.phone ? (
                    <a
                      href={`tel:${selectedStudent.phone || selectedStudent.user?.phone}`}
                      className="text-primary-600 hover:underline"
                    >
                      {selectedStudent.phone || selectedStudent.user?.phone}
                    </a>
                  ) : (
                    '—'
                  )}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-xs text-slate-400 font-medium">Emergency Contact</div>
                <div className="font-semibold text-slate-800 mt-0.5 text-sm">
                  {selectedStudent.emergencyContact || selectedStudent.guardianPhone ? (
                    <a
                      href={`tel:${selectedStudent.emergencyContact || selectedStudent.guardianPhone}`}
                      className="text-primary-600 hover:underline"
                    >
                      {selectedStudent.emergencyContact || selectedStudent.guardianPhone}
                      {selectedStudent.guardianName ? ` (${selectedStudent.guardianName})` : ''}
                    </a>
                  ) : (
                    '—'
                  )}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-xs text-slate-400 font-medium">Residential Address</div>
                <div className="font-semibold text-slate-800 mt-0.5 text-sm">
                  {selectedStudent.address || selectedStudent.city
                    ? [selectedStudent.address, selectedStudent.city, selectedStudent.state, selectedStudent.pincode]
                        .filter(Boolean)
                        .join(', ')
                    : '—'}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-xs text-slate-400 font-medium">Room Assigned</div>
                <div className="font-semibold text-slate-800 mt-0.5 text-sm">
                  {selectedStudent.room?.roomNumber
                    ? `Room ${selectedStudent.room.roomNumber} (Block ${selectedStudent.room.hostelBlock || ''})`
                    : 'No room assigned'}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setRoleModalStudent(selectedStudent);
                  setSelectedRole(selectedStudent.user?.role || 'student');
                }}
              >
                Assign Admin / Role
              </Button>

              {selectedStudent.registrationStatus === 'pending' ? (
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => {
                    handleApproveRegistration(selectedStudent._id);
                  }}
                >
                  Approve Resident
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => {
                    handleDeactivate(selectedStudent._id, selectedStudent.status);
                  }}
                  className="flex-1"
                >
                  {selectedStudent.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
              )}
              <Button onClick={() => setSelectedStudent(null)} className="px-4" variant="outline">
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Room allocation modal */}
      <Modal open={!!allocateModal} onClose={() => setAllocateModal(null)} title="Assign Room">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Assigning room to <strong>{allocateModal?.name}</strong>
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Available Rooms</label>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {rooms.map((r) => (
                <button
                  key={r._id}
                  onClick={() => setSelectedRoom(r._id)}
                  className={`text-left p-3 rounded-xl border text-xs transition ${
                    selectedRoom === r._id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold text-slate-800">{r.roomNumber}</div>
                  <div className="text-slate-400">
                    Block {r.hostelBlock} · {r.occupiedCount}/{r.capacity} beds
                  </div>
                  <div className="text-primary-600 font-medium mt-1">₹{r.monthlyRent?.toLocaleString('en-IN')}/mo</div>
                </button>
              ))}
            </div>
            {rooms.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No available rooms</p>}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setAllocateModal(null)}>
              Cancel
            </Button>
            <Button className="flex-1" disabled={!selectedRoom} loading={saving} onClick={handleAllocate}>
              Assign Room
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
