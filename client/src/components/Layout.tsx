import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { LayoutDashboard, Target, Zap, Settings, User } from 'lucide-react';

const Layout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900">IntentLoop</h1>
        </div>
        <nav className="mt-6 px-4 space-y-2">
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link to="/plans" className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Target size={20} /> Plans
          </Link>
          <Link to="/sessions" className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Zap size={20} /> Sessions
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
