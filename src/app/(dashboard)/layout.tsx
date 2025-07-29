'use client';

import React, { useEffect } from 'react';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);
  
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <DashboardSidebar />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}