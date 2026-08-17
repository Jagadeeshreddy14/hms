require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./db');

const User = require('../models/User');
const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const Student = require('../models/Student');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Visitor = require('../models/Visitor');
const BankDetail = require('../models/BankDetail');
const PaymentSlip = require('../models/PaymentSlip');

const seed = async () => {
  await connectDB();

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Hostel.deleteMany({}),
    Room.deleteMany({}),
    Student.deleteMany({}),
    Payment.deleteMany({}),
    Complaint.deleteMany({}),
    Visitor.deleteMany({}),
    BankDetail.deleteMany({}),
    PaymentSlip.deleteMany({}),
  ]);

  console.log('🗑️  Cleared existing data');

  // Create Users
  const hashedPass = await bcrypt.hash('password123', 10);

  const admin = await User.create({
    name: 'Rajesh Kumar',
    email: 'admin@hostel.com',
    password: hashedPass,
    role: 'admin',
    phone: '9876543210',
  });

  const warden = await User.create({
    name: 'Priya Sharma',
    email: 'warden@hostel.com',
    password: hashedPass,
    role: 'warden',
    phone: '9876543211',
  });

  const studentUser1 = await User.create({
    name: 'Amit Singh',
    email: 'amit@student.com',
    password: hashedPass,
    role: 'student',
    phone: '9876543212',
  });

  const studentUser2 = await User.create({
    name: 'Neha Verma',
    email: 'neha@student.com',
    password: hashedPass,
    role: 'student',
    phone: '9876543213',
  });

  const studentUser3 = await User.create({
    name: 'Rahul Gupta',
    email: 'rahul@student.com',
    password: hashedPass,
    role: 'student',
    phone: '9876543214',
  });

  console.log('👤 Users created');

  // Create Hostels
  const hostelA = await Hostel.create({
    name: 'Block A - Boys Hostel',
    address: '123 University Road, Campus Area',
    type: 'boys',
    totalRooms: 50,
    warden: warden._id,
    amenities: ['WiFi', 'Laundry', 'Canteen', 'Gym'],
    description: 'Premium boys hostel with modern facilities',
  });

  const hostelB = await Hostel.create({
    name: 'Block B - Girls Hostel',
    address: '124 University Road, Campus Area',
    type: 'girls',
    totalRooms: 40,
    warden: warden._id,
    amenities: ['WiFi', 'Laundry', 'Canteen', 'Library'],
    description: 'Secure girls hostel with all amenities',
  });

  console.log('🏢 Hostels created');

  // Create Bank Details
  await BankDetail.create({
    hostel: hostelA._id,
    accountHolderName: 'University Hostel A',
    accountNumber: '1234567890123456',
    ifscCode: 'SBIN0001234',
    bankName: 'State Bank of India',
    branchName: 'University Branch',
    upiId: 'hostela@sbi',
    phoneNumber: '9876543210',
    isActive: true,
    createdBy: admin._id,
  });

  await BankDetail.create({
    hostel: hostelB._id,
    accountHolderName: 'University Hostel B',
    accountNumber: '9876543210123456',
    ifscCode: 'AXIS0005678',
    bankName: 'Axis Bank',
    branchName: 'Campus Branch',
    upiId: 'hostelb@axis',
    phoneNumber: '9876543211',
    isActive: true,
    createdBy: admin._id,
  });

  console.log('🏦 Bank Details created');

  // Create Rooms
  const rooms = [];
  for (let i = 1; i <= 10; i++) {
    const room = await Room.create({
      roomNumber: `A-${100 + i}`,
      hostel: hostelA._id,
      hostelBlock: 'A',
      floor: Math.ceil(i / 4),
      capacity: i % 3 === 0 ? 3 : 2,
      occupiedCount: 0,
      type: i % 3 === 0 ? 'triple' : 'double',
      monthlyRent: i % 3 === 0 ? 4500 : 5500,
      amenities: ['AC', 'Attached Bathroom'],
      status: 'available',
    });
    rooms.push(room);
  }

  for (let i = 1; i <= 8; i++) {
    const room = await Room.create({
      roomNumber: `B-${200 + i}`,
      hostel: hostelB._id,
      hostelBlock: 'B',
      floor: Math.ceil(i / 4),
      capacity: 2,
      occupiedCount: 0,
      type: 'double',
      monthlyRent: 5500,
      amenities: ['Fan', 'Common Bathroom'],
      status: 'available',
    });
    rooms.push(room);
  }

  console.log('🚪 Rooms created');

  // Create Students
  const student1 = await Student.create({
    user: studentUser1._id,
    name: studentUser1.name,
    email: studentUser1.email,
    phone: studentUser1.phone,
    rollNumber: 'CS2021001',
    course: 'B.Tech Computer Science',
    year: 3,
    room: rooms[0]._id,
    hostel: hostelA._id,
    guardianName: 'Suresh Singh',
    guardianPhone: '9988776655',
    address: '45 MG Road, Delhi',
    admissionDate: new Date('2021-08-01'),
    status: 'active',
  });

  // Update room occupancy
  await Room.findByIdAndUpdate(rooms[0]._id, {
    $inc: { occupiedCount: 1 },
    $push: { students: student1._id },
    status: 'occupied',
  });

  const student2 = await Student.create({
    user: studentUser2._id,
    name: studentUser2.name,
    email: studentUser2.email,
    phone: studentUser2.phone,
    rollNumber: 'EC2022015',
    course: 'B.Tech Electronics',
    year: 2,
    room: rooms[10]._id,
    hostel: hostelB._id,
    guardianName: 'Ramesh Verma',
    guardianPhone: '9977665544',
    address: '12 Civil Lines, Lucknow',
    admissionDate: new Date('2022-08-01'),
    status: 'active',
  });

  await Room.findByIdAndUpdate(rooms[10]._id, {
    $inc: { occupiedCount: 1 },
    $push: { students: student2._id },
    status: 'occupied',
  });

  const student3 = await Student.create({
    user: studentUser3._id,
    name: studentUser3.name,
    email: studentUser3.email,
    phone: studentUser3.phone,
    rollNumber: 'ME2023008',
    course: 'B.Tech Mechanical',
    year: 1,
    room: rooms[1]._id,
    hostel: hostelA._id,
    guardianName: 'Vikram Gupta',
    guardianPhone: '9966554433',
    address: '78 Sector 5, Noida',
    admissionDate: new Date('2023-08-01'),
    status: 'active',
  });

  await Room.findByIdAndUpdate(rooms[1]._id, {
    $inc: { occupiedCount: 1 },
    $push: { students: student3._id },
    status: 'occupied',
  });

  // Update user studentId
  await User.findByIdAndUpdate(studentUser1._id, { studentId: student1._id });
  await User.findByIdAndUpdate(studentUser2._id, { studentId: student2._id });
  await User.findByIdAndUpdate(studentUser3._id, { studentId: student3._id });

  console.log('🎓 Students created');

  // Create Payments (Half-yearly)
  const currentYear = 2024;
  
  // Student 1 - H1 and H2 payments for 2024
  await Payment.create({
    student: student1._id,
    hostel: hostelA._id,
    room: rooms[0]._id,
    amount: 33000, // 6 months × 5500
    period: 'H1', // Jan-Jun
    year: currentYear,
    status: 'paid',
    paymentDate: new Date(currentYear, 5, 15),
    paymentMethod: 'online',
    transactionId: `TXN${Date.now()}1`,
    dueDate: new Date(currentYear, 5, 30),
  });

  await Payment.create({
    student: student1._id,
    hostel: hostelA._id,
    room: rooms[0]._id,
    amount: 33000, // 6 months × 5500
    period: 'H2', // Jul-Dec
    year: currentYear,
    status: 'pending',
    paymentDate: null,
    paymentMethod: null,
    transactionId: null,
    dueDate: new Date(currentYear, 11, 31),
  });

  // Student 2 - H1 and H2 payments for 2024
  await Payment.create({
    student: student2._id,
    hostel: hostelB._id,
    room: rooms[10]._id,
    amount: 33000, // 6 months × 5500
    period: 'H1', // Jan-Jun
    year: currentYear,
    status: 'paid',
    paymentDate: new Date(currentYear, 5, 10),
    paymentMethod: 'upi',
    transactionId: `TXN${Date.now()}2`,
    dueDate: new Date(currentYear, 5, 30),
  });

  await Payment.create({
    student: student2._id,
    hostel: hostelB._id,
    room: rooms[10]._id,
    amount: 33000, // 6 months × 5500
    period: 'H2', // Jul-Dec
    year: currentYear,
    status: 'pending',
    paymentDate: null,
    paymentMethod: null,
    transactionId: null,
    dueDate: new Date(currentYear, 11, 31),
  });

  // Student 3 - H1 for 2024 (newly admitted)
  await Payment.create({
    student: student3._id,
    hostel: hostelA._id,
    room: rooms[1]._id,
    amount: 33000, // 6 months × 5500
    period: 'H1', // Jan-Jun
    year: currentYear,
    status: 'overdue',
    paymentDate: null,
    paymentMethod: null,
    transactionId: null,
    dueDate: new Date(currentYear, 5, 30),
  });

  await Payment.create({
    student: student3._id,
    hostel: hostelA._id,
    room: rooms[1]._id,
    amount: 33000, // 6 months × 5500
    period: 'H2', // Jul-Dec
    year: currentYear,
    status: 'pending',
    paymentDate: null,
    paymentMethod: null,
    transactionId: null,
    dueDate: new Date(currentYear, 11, 31),
  });

  console.log('💰 Payments created');

  // Create Complaints
  await Complaint.create({
    student: student1._id,
    hostel: hostelA._id,
    room: rooms[0]._id,
    category: 'electricity',
    title: 'Power outage in room',
    description: 'There has been no electricity in my room since yesterday evening. The main switch is not working.',
    status: 'resolved',
    priority: 'high',
    resolvedAt: new Date(),
    resolvedBy: warden._id,
    resolutionNote: 'Electrician fixed the faulty switch',
  });

  await Complaint.create({
    student: student1._id,
    hostel: hostelA._id,
    room: rooms[0]._id,
    category: 'internet',
    title: 'WiFi not working',
    description: 'WiFi has been very slow for the past 3 days. Unable to attend online classes.',
    status: 'in_progress',
    priority: 'medium',
    assignedTo: warden._id,
  });

  await Complaint.create({
    student: student2._id,
    hostel: hostelB._id,
    room: rooms[10]._id,
    category: 'water',
    title: 'No hot water',
    description: 'Hot water supply in the bathroom is not working since morning.',
    status: 'pending',
    priority: 'medium',
  });

  await Complaint.create({
    student: student3._id,
    hostel: hostelA._id,
    room: rooms[1]._id,
    category: 'maintenance',
    title: 'Broken door lock',
    description: 'The door lock is broken and the door cannot be properly locked from inside.',
    status: 'pending',
    priority: 'high',
  });

  console.log('📝 Complaints created');

  // Create Visitors
  await Visitor.create({
    student: student1._id,
    hostel: hostelA._id,
    visitorName: 'Suresh Singh',
    visitorPhone: '9988776655',
    purpose: 'Family visit',
    relationship: 'Father',
    entryTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    exitTime: new Date(Date.now() - 30 * 60 * 1000),
    status: 'checked_out',
    approvedBy: warden._id,
  });

  await Visitor.create({
    student: student2._id,
    hostel: hostelB._id,
    visitorName: 'Ramesh Verma',
    visitorPhone: '9977665544',
    purpose: 'Parent visit',
    relationship: 'Father',
    entryTime: new Date(),
    status: 'checked_in',
    approvedBy: warden._id,
  });

  console.log('👥 Visitors created');

  console.log('\n✅ ===== SEED COMPLETE =====');
  console.log('\n🔑 Login Credentials:');
  console.log('   Admin:   admin@hostel.com   / password123');
  console.log('   Warden:  warden@hostel.com  / password123');
  console.log('   Student: amit@student.com   / password123');
  console.log('   Student: neha@student.com   / password123');
  console.log('   Student: rahul@student.com  / password123');

  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
