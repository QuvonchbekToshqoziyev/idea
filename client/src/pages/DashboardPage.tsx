import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { PlusCircle, Layout, Activity, Award, User as UserIcon, Clock, AlertCircle, Loader2 } from 'lucide-react';
import type { Plan } from '../types';

interface DashboardData {
  active_plans: Plan[];
  stalled_plans: Plan[];
  completed_plans: Plan[];
  recent_friend_updates: any[];
  metrics: {
    total_plans: number;
    completed: number;
    active: number;
    stalled: number;
  };
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard');
      return response.data;
    },
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 size={48} className="animate-spin text-blue-600" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg border border-red-200">
      <AlertCircle size={48} className="text-red-500 mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load dashboard</h2>
      <button onClick={() => refetch()} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Try Again</button>
    </div>
  );

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.displayName || user?.username}</h1>
      </header>

      <section>
        <Link to="/sessions/new" className="block p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center">
          <PlusCircle size={48} className="mx-auto text-blue-600 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Start a New Session</h2>
          <p className="text-gray-600">Build, explore, or continue your projects.</p>
        </Link>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 shadow-sm border border-gray-200 rounded-xl">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Your Metrics</h3>
          <div className="space-y-4">
            <MetricItem icon={<Layout size={20} className="text-blue-500" />} label="Active Plans" value={data?.metrics.active} />
            <MetricItem icon={<Award size={20} className="text-green-500" />} label="Completed" value={data?.metrics.completed} />
            <MetricItem icon={<Activity size={20} className="text-yellow-500" />} label="Stalled" value={data?.metrics.stalled} />
          </div>
        </div>

        <div className="bg-white p-6 shadow-sm border border-gray-200 rounded-xl lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Loop Feed</h3>
          <div className="space-y-6">
            {data?.recent_friend_updates.map((update) => (
              <div key={update.id} className="pb-4 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2 mb-2">
                  <UserIcon size={16} className="text-gray-400" />
                  <strong className="text-sm font-semibold">{update.user.displayName || update.user.username}</strong>
                  <span className="text-xs text-gray-500">updated</span>
                  <Link to={`/plans/${update.plan.id}`} className="text-blue-600 hover:underline text-sm font-medium">{update.plan.title}</Link>
                </div>
                <p className="text-gray-700 text-sm ml-6">{update.content}</p>
                <span className="text-xs text-gray-400 ml-6">{new Date(update.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricItem: React.FC<{ icon: React.ReactNode, label: string, value?: number }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
    {icon}
    <span className="text-sm text-gray-700">{label}:</span>
    <span className="ml-auto font-bold text-gray-900">{value}</span>
  </div>
);

export default DashboardPage;
