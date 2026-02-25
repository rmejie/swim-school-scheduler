import React, { type ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

/**
 * DashboardLayout provides the main admin dashboard structure with a collapsible sidebar, top navigation, and main content area.
 *
 * @param children - The main content to display in the dashboard
 * @returns The full dashboard layout
 *
 * @example
 * <DashboardLayout>
 *   <DashboardContent />
 * </DashboardLayout>
 */
const DashboardLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen font-sans bg-gray-50 flex flex-col">
      <TopNav />
      <div className="flex flex-1">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((c) => !c)} />
        <main
          role="main"
          className={`flex-1 p-4 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'} max-w-full`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 