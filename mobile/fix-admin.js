const fs = require('fs');
const file = 'src/app/admin/index.tsx';
let content = fs.readFileSync(file, 'utf8');

const correctTop = `'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

// Subviews
import DashboardView from '@/features/admin/dashboard-view';
import UsersView from '@/features/admin/users-view';
import PatientsView from '@/features/admin/patients-view';
import PatientDetailView from '@/features/admin/patient-detail-view';
import VisitsView from '@/features/admin/visits-view';
import PaymentsView from '@/features/admin/payments-view';
import ReportsView from '@/features/admin/reports-view';
import ProfileView from '@/features/admin/profile-view';

// Icons
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CreditCard,
  BarChart3,
  User,
  LogOut,
  Stethoscope,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react-native';

type Tab =
  | 'dashboard'
  | 'users'
  | 'patients'
  | 'visits'
  | 'payments'
  | 'reports'
  | 'profile';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
`;

// Find the index of "const [currentUser"
const splitIndex = content.indexOf('  const [currentUser');
if (splitIndex !== -1) {
  content = correctTop + content.substring(splitIndex);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed file');
} else {
  console.log('Could not find split index');
}
