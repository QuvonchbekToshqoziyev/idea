import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard');
      return response.data;
    },
  });

  if (isLoading) return (
    <div className="dashboard-container flex items-center justify-center h-screen">
      <Loader2 size={48} className="animate-spin text-primary" />
    </div>
  );

  if (error) return (
    <div className="dashboard-container p-8">
      <div className="card error-card flex flex-col items-center p-6 gap-4">
        <AlertCircle size={48} className="text-red-500" />
        <h2 className="text-xl">Failed to load dashboard</h2>
        <button onClick={() => refetch()} className="btn-primary">Try Again</button>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      <header className="dashboard-header flex justify-between items-center p-4">
        <h1>Welcome, {user?.displayName || user?.username}</h1>
        <button onClick={logout} className="logout-btn px-4 py-2 bg-gray-200 rounded">Logout</button>
      </header>

      <main className="dashboard-main p-4">
        <section className="start-session-section mb-8">
          <Link to="/sessions/new" className="card start-card flex flex-col items-center p-6 border-2 border-dashed border-gray-300 hover:border-primary rounded-lg transition-colors">
            <PlusCircle size={48} className="icon-accent text-primary mb-2" />
            <h2 className="text-xl font-semibold">Start a New Session</h2>
            <p className="text-gray-600">What's your intent today? Build, Explore, or Continue?</p>
          </Link>
        </section>

        <div className="dashboard-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card metrics-card p-6 bg-white shadow rounded-lg">
            <h3 className="text-lg font-bold mb-4">Your Metrics</h3>
            <div className="metrics-list flex flex-col gap-3">
              <div className="metric-item flex items-center gap-2">
                <Layout size={20} className="text-blue-500" />
                <span>Active Plans: {data?.metrics.active}</span>
              </div>
              <div className="metric-item flex items-center gap-2">
                <Award size={20} className="text-green-500" />
                <span>Completed: {data?.metrics.completed}</span>
              </div>
              <div className="metric-item flex items-center gap-2">
                <Activity size={20} className="text-yellow-500" />
                <span>Stalled: {data?.metrics.stalled}</span>
              </div>
            </div>
          </div>

          <div className="card feed-card p-6 bg-white shadow rounded-lg">
            <h3 className="text-lg font-bold mb-4">Loop Feed</h3>
            <div className="feed-list flex flex-col gap-4">
              {data?.recent_friend_updates.map((update) => (
                <div key={update.id} className="feed-item p-3 border-b">
                  <div className="feed-user flex items-center gap-2 mb-1">
                    <UserIcon size={16} />
                    <strong className="text-sm">{update.user.displayName || update.user.username}</strong>
                    <span className="text-xs text-gray-500">updated</span>
                    <Link to={`/plans/${update.plan.id}`} className="text-blue-600 hover:underline text-sm font-medium">
                      {update.plan.title}
                    </Link>
                  </div>
                  <p className="text-gray-700 text-sm">{update.content}</p>
                  <span className="text-xs text-gray-400">{new Date(update.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
              {data?.recent_friend_updates.length === 0 && (
                <p className="text-gray-500 italic">No recent activity from friends.</p>
              )}
            </div>
          </div>

          <div className="card active-plans-card p-6 bg-white shadow rounded-lg">
            <h3 className="text-lg font-bold mb-4">Active Plans</h3>
            <div className="plans-list flex flex-col gap-3">
              {data?.active_plans.map((plan) => (
                <Link key={plan.id} to={`/plans/${plan.id}`} className="plan-item-link block p-3 hover:bg-gray-50 border rounded transition-colors">
                  <div className="flex justify-between items-center">
                    <div className="plan-info flex flex-col">
                      <strong className="text-sm">{plan.title}</strong>
                      <span className="text-xs text-gray-500">{plan.category?.label}</span>
                    </div>
                    <Clock size={16} className="text-gray-400" />
                  </div>
                </Link>
              ))}
              {data?.active_plans.length === 0 && (
                <p className="text-gray-500 italic">No active plans. Start a session!</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
