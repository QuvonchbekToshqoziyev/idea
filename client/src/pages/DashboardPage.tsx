import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { PlusCircle, Layout, Activity, Award, User as UserIcon, Clock } from 'lucide-react';
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

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard');
      return response.data;
    },
  });

  if (isLoading) return <div className="dashboard-container"><div className="loader">Loading Dashboard...</div></div>;
  if (error) return <div className="dashboard-container"><div className="error">Failed to load dashboard</div></div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Welcome, {user?.displayName || user?.username}</h1>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="start-session-section">
          <div className="card start-card" onClick={() => navigate('/sessions/new')}>
            <PlusCircle size={48} className="icon-accent" />
            <h2>Start a New Session</h2>
            <p>What's your intent today? Build, Explore, or Continue?</p>
          </div>
        </section>

        <div className="dashboard-grid">
          <div className="card metrics-card">
            <h3>Your Metrics</h3>
            <div className="metrics-list">
              <div className="metric-item">
                <Layout size={20} className="text-primary" />
                <span>Active Plans: {data?.metrics.active}</span>
              </div>
              <div className="metric-item">
                <Award size={20} className="text-success" />
                <span>Completed: {data?.metrics.completed}</span>
              </div>
              <div className="metric-item">
                <Activity size={20} className="text-warning" />
                <span>Stalled: {data?.metrics.stalled}</span>
              </div>
            </div>
          </div>

          <div className="card feed-card">
            <h3>Loop Feed</h3>
            <div className="feed-list">
              {data?.recent_friend_updates.map((update) => (
                <div key={update.id} className="feed-item">
                  <div className="feed-user">
                    <UserIcon size={16} />
                    <strong>{update.user.displayName || update.user.username}</strong>
                    <span className="feed-action">updated</span>
                    <Link to={`/plans/${update.plan.id}`} className="feed-plan-link">
                      {update.plan.title}
                    </Link>
                  </div>
                  <p className="feed-content">{update.content}</p>
                  <span className="feed-time">{new Date(update.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
              {data?.recent_friend_updates.length === 0 && (
                <p className="empty-state">No recent activity from friends.</p>
              )}
            </div>
          </div>

          <div className="card active-plans-card">
            <h3>Active Plans</h3>
            <div className="plans-list">
              {data?.active_plans.map((plan) => (
                <Link key={plan.id} to={`/plans/${plan.id}`} className="plan-item-link">
                  <div className="plan-item">
                    <div className="plan-info">
                      <strong>{plan.title}</strong>
                      <span className="plan-cat">{plan.category?.label}</span>
                    </div>
                    <Clock size={16} className="text-muted" />
                  </div>
                </Link>
              ))}
              {data?.active_plans.length === 0 && (
                <p className="empty-state">No active plans. Start a session!</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
