import React, { useEffect, useState } from 'react';
import { studentAPI } from '../../services/api';
import { Card, Loading } from '../../components/common';
import { DoorOpen, MapPin } from 'lucide-react';

const AMENITY_ICONS = { 'AC': '❄️', 'Wifi': '📶', 'WiFi': '📶', 'Attached Bathroom': '🚿', 'Fan': '🌀', 'Balcony': '🏠', 'Gym': '💪', 'Laundry': '👕', 'Canteen': '🍽️' };

export default function MyRoom() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentAPI.getMe().then(({ data }) => setStudent(data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (!student?.room) return (
    <div className="text-center py-20">
      <DoorOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
      <h3 className="font-semibold text-slate-700 text-xl">No Room Assigned</h3>
      <p className="text-slate-400 mt-1">Contact the warden to get a room assigned.</p>
    </div>
  );

  const room = student.room;
  const hostel = student.hostel;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="font-display font-bold text-slate-900 text-2xl">My Room</h2>
        <p className="text-slate-500 text-sm mt-0.5">Your accommodation details</p>
      </div>

      {/* Room card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <DoorOpen className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-display font-bold text-2xl">Room {room.roomNumber}</h3>
              <p className="text-primary-100">Block {room.hostelBlock} · Floor {room.floor}</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              ['Room Type', room.type?.charAt(0).toUpperCase() + room.type?.slice(1)],
              ['Capacity', `${room.capacity} beds`],
              ['Monthly Rent', `₹${room.monthlyRent?.toLocaleString('en-IN')}`],
              ['Occupancy', `${room.occupiedCount}/${room.capacity}`],
              ['Status', room.status],
            ].map(([label, val]) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3">
                <div className="text-xs text-slate-400">{label}</div>
                <div className="font-semibold text-slate-800 mt-0.5 capitalize">{val}</div>
              </div>
            ))}
          </div>

          {room.amenities?.length > 0 && (
            <div className="mt-5">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Room Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {room.amenities.map(a => (
                  <span key={a} className="flex items-center gap-1.5 bg-primary-50 text-primary-700 text-sm px-3 py-1.5 rounded-xl font-medium">
                    <span>{AMENITY_ICONS[a] || '✓'}</span>
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Hostel info */}
      {hostel && (
        <Card className="p-5">
          <h4 className="font-semibold text-slate-900 mb-3">Hostel Information</h4>
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
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['Roll No.', student.rollNumber],
            ['Course', student.course],
            ['Year', student.year ? `Year ${student.year}` : '—'],
            ['Guardian', student.guardianName || '—'],
            ['Guardian Ph.', student.guardianPhone || '—'],
            ['Address', student.address || '—'],
          ].map(([l, v]) => (
            <div key={l} className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-400">{l}</div>
              <div className="font-medium text-slate-800 mt-0.5">{v}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
