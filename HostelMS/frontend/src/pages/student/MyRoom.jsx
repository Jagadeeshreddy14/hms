import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentAPI } from '../../services/api';
import { Card, Loading, Modal, Badge, Button } from '../../components/common';
import {
  DoorOpen,
  MapPin,
  Compass,
  Users,
  Phone,
  Mail,
  GraduationCap,
  PhoneCall,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

const AMENITY_ICONS = {
  AC: '❄️',
  Wifi: '📶',
  WiFi: '📶',
  'Attached Bathroom': '🚿',
  Fan: '🌀',
  Balcony: '🏠',
  Gym: '💪',
  Laundry: '👕',
  Canteen: '🍽️',
};

export default function MyRoom() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    studentAPI
      .getMe()
      .then(({ data }) => setStudent(data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  if (!student?.room) {
    return (
      <div className="text-center py-20 max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <DoorOpen className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-slate-800 text-xl">No Room Assigned Yet</h3>
        <p className="text-slate-500 text-sm">
          You have not been allocated a room yet. Please browse available rooms to apply.
        </p>
        <div className="pt-2">
          <Link
            to="/student/browse-rooms"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm shadow-lg shadow-primary-600/20 transition"
          >
            <Compass className="w-4 h-4" /> Browse Available Rooms
          </Link>
        </div>
      </div>
    );
  }

  const room = student.room;
  const hostel = student.hostel;
  const members = room.students || [];
  const emptyBeds = Math.max(0, (room.capacity || 2) - members.length);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="font-display font-bold text-slate-900 text-2xl">My Accommodation & Room Details</h2>
        <p className="text-slate-500 text-sm mt-0.5">
          View your room specifications, roommate details, and resident profile
        </p>
      </div>

      {/* Room Overview Card */}
      <Card className="overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 p-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                <DoorOpen className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-2xl">Room {room.roomNumber}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/20 capitalize">
                    {room.type}
                  </span>
                </div>
                <p className="text-primary-100 text-sm mt-0.5">
                  Block {room.hostelBlock} · Floor {room.floor} · {hostel?.name || 'Hostel Campus'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-primary-200">Monthly Rent</div>
              <div className="text-xl font-bold font-display">₹{room.monthlyRent?.toLocaleString('en-IN')}<span className="text-xs font-normal opacity-80">/mo</span></div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Key specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ['Occupancy', `${room.occupiedCount || members.length}/${room.capacity} beds`],
              ['Available Beds', `${room.capacity - (room.occupiedCount || members.length)} vacant`],
              ['Floor', `Level ${room.floor}`],
              ['Room Status', room.status || 'Occupied'],
            ].map(([label, val]) => (
              <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <div className="text-xs text-slate-400 font-medium">{label}</div>
                <div className="font-semibold text-slate-800 mt-0.5 text-sm capitalize">{val}</div>
              </div>
            ))}
          </div>

          {/* Amenities */}
          {room.amenities?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                Room Amenities
              </h4>
              <div className="flex flex-wrap gap-2">
                {room.amenities.map((a) => (
                  <span
                    key={a}
                    className="flex items-center gap-1.5 bg-primary-50 border border-primary-100 text-primary-700 text-xs px-3 py-1.5 rounded-xl font-medium"
                  >
                    <span>{AMENITY_ICONS[a] || '✓'}</span>
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ROOM MEMBERS / ROOMMATES SECTION */}
      <Card className="p-6 border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-slate-900 text-lg">Room Members & Roommates</h3>
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  {members.length} {members.length === 1 ? 'Resident' : 'Residents'}
                </span>
              </div>
              <p className="text-xs text-slate-500">Tap any room member card to view complete resident details</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((m, idx) => {
            const isMe = m._id === student._id || m.email === student.email;
            return (
              <button
                key={m._id || idx}
                type="button"
                onClick={() => setSelectedMember(m)}
                className="group relative bg-white border border-slate-200 hover:border-primary-400 hover:shadow-md transition-all duration-200 rounded-2xl p-4 text-left flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                {/* Background accent hover effect */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full -mr-10 -mt-10 group-hover:bg-primary-500/10 transition" />

                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white font-bold text-base flex items-center justify-center shadow-sm">
                        {m.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-slate-900 text-sm group-hover:text-primary-600 transition">
                            {m.name}
                          </h4>
                          {isMe && (
                            <span className="bg-primary-100 text-primary-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          {m.rollNumber ? `ID: ${m.rollNumber}` : 'Resident'}
                        </p>
                      </div>
                    </div>

                    {m.bloodGroup && (
                      <span className="bg-red-50 text-red-600 border border-red-100 text-[11px] font-bold px-2 py-0.5 rounded-lg">
                        🩸 {m.bloodGroup}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-2 truncate">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">
                        {m.course || 'Course Not Specified'} {m.year ? `· Year ${m.year}` : ''}
                        {m.branch ? ` (${m.branch})` : ''}
                      </span>
                    </div>
                    {m.phone && (
                      <div className="flex items-center gap-2 truncate text-slate-500">
                        <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{m.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-primary-600 group-hover:text-primary-700">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary-500" /> One-Tap Open Details
                  </span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </button>
            );
          })}

          {/* Empty Beds Indicators */}
          {Array.from({ length: emptyBeds }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-5 flex items-center justify-center text-center bg-slate-50/50"
            >
              <div className="space-y-1">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <DoorOpen className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-600">Available Bed Slot</div>
                <div className="text-[11px] text-slate-400">Bed is vacant in Room {room.roomNumber}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ONE-TAP ROOM MEMBER DETAILS MODAL */}
      <Modal
        open={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        title="Roommate Resident Details"
        size="md"
      >
        {selectedMember && (
          <div className="space-y-5">
            {/* Header banner */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-2xl font-bold shadow-md flex-shrink-0">
                {selectedMember.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-xl truncate">{selectedMember.name}</h3>
                  {selectedMember._id === student._id && (
                    <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      You
                    </span>
                  )}
                </div>
                <p className="text-slate-400 font-mono text-xs mt-0.5">
                  Roll ID: {selectedMember.rollNumber || 'Not assigned'}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge status={selectedMember.status || 'active'} />
                  {selectedMember.bloodGroup && (
                    <span className="bg-red-50 text-red-700 border border-red-200 text-xs font-bold px-2 py-0.5 rounded-full">
                      🩸 Blood: {selectedMember.bloodGroup}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Contact Bar */}
            <div className="grid grid-cols-2 gap-2">
              {selectedMember.phone ? (
                <a
                  href={`tel:${selectedMember.phone}`}
                  className="flex items-center justify-center gap-2 p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold transition border border-emerald-200"
                >
                  <PhoneCall className="w-4 h-4" /> Call {selectedMember.phone}
                </a>
              ) : (
                <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl text-xs text-center border border-slate-200">
                  No phone listed
                </div>
              )}

              {selectedMember.email ? (
                <a
                  href={`mailto:${selectedMember.email}`}
                  className="flex items-center justify-center gap-2 p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold transition border border-blue-200"
                >
                  <Mail className="w-4 h-4" /> Email Roommate
                </a>
              ) : (
                <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl text-xs text-center border border-slate-200">
                  No email listed
                </div>
              )}
            </div>

            {/* Clean Detail Grid */}
            <div className="space-y-3 text-sm">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-xs text-slate-400 font-medium">Mobile Phone</div>
                <div className="font-semibold text-slate-800 mt-0.5 text-sm">
                  {selectedMember.phone ? (
                    <a href={`tel:${selectedMember.phone}`} className="text-primary-600 hover:underline">
                      {selectedMember.phone}
                    </a>
                  ) : (
                    '—'
                  )}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-xs text-slate-400 font-medium">Emergency Contact</div>
                <div className="font-semibold text-slate-800 mt-0.5 text-sm">
                  {selectedMember.emergencyContact || selectedMember.guardianPhone ? (
                    <a
                      href={`tel:${selectedMember.emergencyContact || selectedMember.guardianPhone}`}
                      className="text-primary-600 hover:underline"
                    >
                      {selectedMember.emergencyContact || selectedMember.guardianPhone}
                      {selectedMember.guardianName ? ` (${selectedMember.guardianName})` : ''}
                    </a>
                  ) : (
                    '—'
                  )}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-xs text-slate-400 font-medium">Residential Address</div>
                <div className="font-semibold text-slate-800 mt-0.5 text-sm">
                  {selectedMember.address || selectedMember.city
                    ? [selectedMember.address, selectedMember.city, selectedMember.state, selectedMember.pincode]
                        .filter(Boolean)
                        .join(', ')
                    : '—'}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-xs text-slate-400 font-medium">Room Assigned</div>
                <div className="font-semibold text-slate-800 mt-0.5 text-sm">
                  Room {room.roomNumber} (Block {room.hostelBlock})
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button onClick={() => setSelectedMember(null)} className="w-full">
                Close Details
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Hostel info */}
      {hostel && (
        <Card className="p-5">
          <h4 className="font-semibold text-slate-900 mb-3">Hostel Campus Information</h4>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-slate-400 text-sm w-24 flex-shrink-0">Hostel</span>
              <span className="text-sm font-medium text-slate-800">{hostel.name}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-600">{hostel.address}</span>
            </div>
            {hostel.amenities?.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-slate-400 text-sm w-24 flex-shrink-0">Facilities</span>
                <span className="text-sm text-slate-600">{hostel.amenities.join(', ')}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Student profile */}
      <Card className="p-5">
        <h4 className="font-semibold text-slate-900 mb-3">My Details</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <div className="text-xs text-slate-400 font-medium">Full Name</div>
            <div className="font-semibold text-slate-800 mt-0.5 text-sm">{student.name}</div>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <div className="text-xs text-slate-400 font-medium">Mobile Phone</div>
            <div className="font-semibold text-slate-800 mt-0.5 text-sm">{student.phone || '—'}</div>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <div className="text-xs text-slate-400 font-medium">Emergency Contact</div>
            <div className="font-semibold text-slate-800 mt-0.5 text-sm">
              {student.emergencyContact || student.guardianPhone
                ? `${student.emergencyContact || student.guardianPhone}${
                    student.guardianName ? ` (${student.guardianName})` : ''
                  }`
                : '—'}
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <div className="text-xs text-slate-400 font-medium">Residential Address</div>
            <div className="font-semibold text-slate-800 mt-0.5 text-sm">
              {student.address || student.city
                ? [student.address, student.city, student.state, student.pincode].filter(Boolean).join(', ')
                : '—'}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
