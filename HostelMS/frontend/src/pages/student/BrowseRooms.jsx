import React, { useEffect, useState } from 'react';
import { roomAPI, hostelAPI, studentAPI } from '../../services/api';
import { Card, Button, Badge, Loading, Empty } from '../../components/common';
import { DoorOpen, Users, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AMENITY_ICONS = { 
  'AC': '❄️', 'Wifi': '📶', 'WiFi': '📶', 'Attached Bathroom': '🚿', 
  'Fan': '🌀', 'Balcony': '🏠', 'Gym': '💪', 'Laundry': '👕', 'Canteen': '🍽️' 
};

export default function BrowseRooms() {
  const [rooms, setRooms] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [filters, setFilters] = useState({ hostel: '', type: '', status: 'available' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsRes, hostelsRes, studentRes] = await Promise.all([
          roomAPI.getAll({ status: 'available' }),
          hostelAPI.getAll(),
          studentAPI.getMe()
        ]);
        setRooms(roomsRes.data.data || []);
        setHostels(hostelsRes.data.data || []);
        setStudent(studentRes.data.data);
      } catch (err) {
        toast.error('Failed to load rooms');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFilterChange = async (newFilters) => {
    setFilters(newFilters);
    setLoading(true);
    try {
      const params = { status: 'available' };
      if (newFilters.hostel) params.hostel = newFilters.hostel;
      if (newFilters.type) params.type = newFilters.type;
      
      const res = await roomAPI.getAll(params);
      setRooms(res.data.data || []);
    } catch (err) {
      toast.error('Failed to filter rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (roomId) => {
    if (!student?._id) {
      toast.error('Unable to determine your student ID');
      return;
    }
    if (student?.room) {
      toast.error('You already have a room assigned');
      return;
    }

    setApplyingId(roomId);
    try {
      await roomAPI.allocate(roomId, student._id);
      toast.success('Room application submitted successfully!');
      setRooms(rooms.filter(r => r._id !== roomId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply for room');
    } finally {
      setApplyingId(null);
    }
  };

  if (loading) return <Loading text="Loading available rooms..." />;

  const filteredRooms = rooms.filter(room => {
    if (filters.hostel && room.hostel?._id !== filters.hostel) return false;
    if (filters.type && room.type !== filters.type) return false;
    return room.occupiedCount < room.capacity;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-slate-900 text-2xl">Browse Rooms</h2>
        <p className="text-slate-500 text-sm mt-0.5">Find and apply for available accommodation</p>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Filters</h3>
          <div className="text-xs font-medium text-slate-500">
            Showing <span className="text-primary-600 font-semibold">{filteredRooms.length}</span> room{filteredRooms.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Hostel</label>
            <select
              value={filters.hostel}
              onChange={(e) => handleFilterChange({ ...filters, hostel: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              <option value="">All Hostels</option>
              {hostels.map(h => (
                <option key={h._id} value={h._id}>{h.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Room Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange({ ...filters, type: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              <option value="">All Types (Single, Double, Triple, Dormitory)</option>
              <option value="single">Single Room</option>
              <option value="double">Double Room</option>
              <option value="triple">Triple Room</option>
              <option value="dormitory">Dormitory</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Availability</label>
            <select
              disabled
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-300 bg-slate-50"
            >
              <option value="available">Available Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Room Grid */}
      {filteredRooms.length === 0 ? (
        <Empty 
          icon={DoorOpen}
          title="No Rooms Available" 
          description="No rooms match your filters. Try adjusting your search criteria."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map(room => (
            <Card key={room._id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-bold text-xl">Room {room.roomNumber}</h3>
                    <p className="text-primary-100 text-sm">Block {room.hostelBlock} · Floor {room.floor}</p>
                  </div>
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <DoorOpen className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex-1 flex flex-col">
                {/* Room Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{room.hostel?.name}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 rounded-lg p-2">
                      <div className="text-xs text-slate-400">Type</div>
                      <div className="font-semibold text-slate-800 capitalize">{room.type}</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <div className="text-xs text-slate-400">Rent/Month</div>
                      <div className="font-semibold text-slate-800">₹{room.monthlyRent?.toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">
                        <span className="font-semibold text-slate-800">{room.capacity - room.occupiedCount}</span>
                        {' '}of {room.capacity} beds available
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                {room.amenities?.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-slate-500 mb-2">Amenities</div>
                    <div className="flex flex-wrap gap-1.5">
                      {room.amenities.slice(0, 3).map(a => (
                        <span key={a} className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-lg">
                          <span>{AMENITY_ICONS[a] || '✓'}</span>
                          {a}
                        </span>
                      ))}
                      {room.amenities.length > 3 && (
                        <span className="inline-flex items-center bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-lg">
                          +{room.amenities.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Status Badge */}
                <div className="mb-4">
                  <Badge status={room.occupiedCount < room.capacity ? 'available' : 'full'} />
                </div>

                {/* Apply Button */}
                {room.occupiedCount < room.capacity && (
                  <Button
                    onClick={() => handleApply(room._id)}
                    loading={applyingId === room._id}
                    className="mt-auto w-full"
                  >
                    Apply for Room
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
