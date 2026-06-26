import React from 'react';

export const metadata = {
  title: 'MedflowX - Reception Desk',
  description: 'Patient registration, visits queue, and billing collection.',
};

export default function ReceptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="reception-theme font-body min-h-screen bg-bg-custom flex flex-col flex-1" suppressHydrationWarning={true}>
      {children}
    </div>
  );
}
