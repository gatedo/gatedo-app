import React from 'react';
import AdminNoticeManager from '../components/admin/AdminNoticeManager';

export default function AdminNoticesPage() {
  return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-gray-900">Admin Notices</h1>
          <p className="text-sm text-gray-500 font-medium mt-2">
            Painel de comunicados oficiais do GATEDO
          </p>
        </div>

        <AdminNoticeManager />
      </div>
    </div>
  );
}
