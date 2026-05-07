import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { 
  CheckCircle2, 
  Circle, 
  Send, 
  Plus, 
  Clock, 
  Tag,
  Shield
} from 'lucide-react';

interface ProgressUpdate {
  id: string;
  content: string;
  type: string;
  visibility: string;
  aiClassified: boolean;
  createdAt: string;
  user: { username: string; displayName?: string };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; username: string; displayName?: string };
}

const PlanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [updateContent, setUpdateContent] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

  const { data: plan, isLoading, error } = useQuery<any>({
    queryKey: ['plan', id],
    queryFn: async () => {
      const response = await api.get(`/plans/${id}`);
      return response.data;
    },
  });

  const { data: updates } = useQuery<ProgressUpdate[]>({
    queryKey: ['updates', id],
    queryFn: async () => {
      const response = await api.get(`/plans/${id}/updates`);
      return response.data;
    },
    enabled: !!plan,
  });

  const { data: comments } = useQuery<Comment[]>({
    queryKey: ['comments', id],
    queryFn: async () => {
      const response = await api.get(`/plans/${id}/comments`);
      return response.data;
    },
    enabled: !!plan,
  });

  const addUpdateMutation = useMutation({
    mutationFn: (content: string) => api.post(`/plans/${id}/updates`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['updates', id] });
      queryClient.invalidateQueries({ queryKey: ['plan', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setUpdateContent('');
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => api.post(`/plans/${id}/comments`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
      setCommentContent('');
    },
  });

  const toggleMilestoneMutation = useMutation({
    mutationFn: ({ milestoneId, completed }: { milestoneId: string; completed: boolean }) => 
      api.patch(`/plans/${id}/milestones/${milestoneId}`, { completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan', id] });
    },
  });

  const addMilestoneMutation = useMutation({
    mutationFn: (title: string) => api.post(`/plans/${id}/milestones`, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan', id] });
      setNewMilestoneTitle('');
    },
  });

  if (isLoading) return <div className="loader">Loading Plan...</div>;
  if (error) return <div className="error">Plan not found or access denied.</div>;

  return (
    <div className="plan-detail-container">
      <header className="plan-header card">
        <div className="plan-title-area">
          <div className="badge">{plan.category?.label}</div>
          <h1>{plan.title}</h1>
          <p className="plan-desc">{plan.description || 'No description provided.'}</p>
        </div>
        <div className="plan-meta">
          <div className="meta-item">
            <Tag size={16} />
            <span>Status: <strong>{plan.status}</strong></span>
          </div>
          {plan.targetDate && (
            <div className="meta-item">
              <Clock size={16} />
              <span>Target: {new Date(plan.targetDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </header>

      <div className="plan-content-grid">
        <div className="plan-main">
          <section className="update-section card">
            <h2>Add Progress</h2>
            <div className="update-input-area">
              <textarea 
                placeholder="What did you achieve today?" 
                value={updateContent}
                onChange={(e) => setUpdateContent(e.target.value)}
              />
              <button 
                className="primary-btn" 
                onClick={() => addUpdateMutation.mutate(updateContent)}
                disabled={!updateContent || addUpdateMutation.isPending}
              >
                {addUpdateMutation.isPending ? 'Posting...' : 'Post Update'}
              </button>
            </div>
          </section>

          <section className="timeline-section">
            <h2>Timeline</h2>
            <div className="timeline">
              {updates?.map((update) => (
                <div key={update.id} className="timeline-item card">
                  <div className="timeline-marker"></div>
                  <div className="timeline-header">
                    <span className="update-type-badge">{update.type}</span>
                    {update.aiClassified && <Shield size={14} className="ai-icon" />}
                    <span className="update-time">{new Date(update.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="update-content">{update.content}</p>
                  <div className="update-visibility">
                    {update.visibility === 'PUBLIC' ? 'Shared with friends' : 'Private to you'}
                  </div>
                </div>
              ))}
              {updates?.length === 0 && <p className="empty-state">No progress updates yet.</p>}
            </div>
          </section>
        </div>

        <aside className="plan-sidebar">
          <section className="milestones-section card">
            <h2>Milestones</h2>
            <div className="milestone-list">
              {plan.milestones?.map((m: any) => (
                <div key={m.id} className="milestone-item" onClick={() => toggleMilestoneMutation.mutate({ milestoneId: m.id, completed: !m.completed })}>
                  {m.completed ? <CheckCircle2 className="text-success" /> : <Circle className="text-muted" />}
                  <span className={m.completed ? 'completed' : ''}>{m.title}</span>
                </div>
              ))}
            </div>
            <div className="add-milestone">
              <input 
                type="text" 
                placeholder="New milestone..." 
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
              />
              <button onClick={() => addMilestoneMutation.mutate(newMilestoneTitle)} disabled={!newMilestoneTitle}>
                <Plus size={16} />
              </button>
            </div>
          </section>

          <section className="comments-section card mt-2">
            <h2>Comments</h2>
            <div className="comments-list">
              {comments?.map((c) => (
                <div key={c.id} className="comment-item">
                  <strong>{c.user.displayName || c.user.username}</strong>
                  <p>{c.content}</p>
                  <span className="comment-time">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
              {comments?.length === 0 && <p className="empty-state">No comments yet.</p>}
            </div>
            <div className="comment-input">
              <input 
                type="text" 
                placeholder="Write a comment..." 
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
              />
              <button onClick={() => addCommentMutation.mutate(commentContent)} disabled={!commentContent}>
                <Send size={16} />
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default PlanDetailPage;
