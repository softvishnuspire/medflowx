'use client';

import React from 'react';

export default function AdminPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">MedflowX - Admin Dashboard</h1>
        <p className="text-lg text-gray-600">Daily revenue stats, payment breakdowns, analytics, and reports.</p>
      </div>
    </div>
  );
}
