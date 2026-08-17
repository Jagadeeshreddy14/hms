const Student = require('../models/Student');
const Room = require('../models/Room');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Visitor = require('../models/Visitor');
const Hostel = require('../models/Hostel');

// @desc    Get admin dashboard analytics
// @route   GET /api/analytics/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const [
      totalStudents,
      activeStudents,
      totalRooms,
      availableRooms,
      totalHostels,
      pendingComplaints,
      pendingPayments,
      todayVisitors,
    ] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ status: 'active' }),
      Room.countDocuments(),
      Room.countDocuments({ status: 'available' }),
      Hostel.countDocuments({ isActive: true }),
      Complaint.countDocuments({ status: 'pending' }),
      Payment.countDocuments({ status: { $in: ['pending', 'overdue'] } }),
      Visitor.countDocuments({
        entryTime: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
    ]);

    // Occupancy rate
    const occupancyRate = totalRooms > 0 ? (((totalRooms - availableRooms) / totalRooms) * 100).toFixed(1) : 0;

    // Monthly revenue (current month)
    const now = new Date();
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const currentMonth = months[now.getMonth()];

    const monthlyRevenue = await Payment.aggregate([
      { $match: { status: 'paid', month: currentMonth, year: now.getFullYear() } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Last 6 months revenue
    const revenueChart = await Payment.aggregate([
      { $match: { status: 'paid', year: { $gte: now.getFullYear() - 1 } } },
      {
        $group: {
          _id: { month: '$month', year: '$year' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 },
    ]);

    // Complaints by status
    const complaintStats = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Complaints by category
    const complaintsByCategory = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Recent complaints
    const recentComplaints = await Complaint.find()
      .populate('student', 'name')
      .sort('-createdAt')
      .limit(5)
      .select('title category status priority createdAt ticketNumber');

    // Recent payments
    const recentPayments = await Payment.find({ status: 'paid' })
      .populate('student', 'name rollNumber')
      .sort('-paymentDate')
      .limit(5)
      .select('amount month year paymentDate student');

    res.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          activeStudents,
          totalRooms,
          availableRooms,
          occupiedRooms: totalRooms - availableRooms,
          totalHostels,
          pendingComplaints,
          pendingPayments,
          todayVisitors,
          occupancyRate,
          monthlyRevenue: monthlyRevenue[0]?.total || 0,
        },
        revenueChart,
        complaintStats,
        complaintsByCategory,
        recentComplaints,
        recentPayments,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get hostel occupancy report
// @route   GET /api/analytics/occupancy
exports.getOccupancyReport = async (req, res, next) => {
  try {
    const hostels = await Hostel.find({ isActive: true });

    const report = await Promise.all(
      hostels.map(async (hostel) => {
        const rooms = await Room.find({ hostel: hostel._id });
        const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
        const occupied = rooms.reduce((sum, r) => sum + r.occupiedCount, 0);
        return {
          hostel: hostel.name,
          type: hostel.type,
          totalRooms: rooms.length,
          totalCapacity,
          occupied,
          available: totalCapacity - occupied,
          occupancyRate: totalCapacity > 0 ? ((occupied / totalCapacity) * 100).toFixed(1) : 0,
        };
      })
    );

    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};
