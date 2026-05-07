import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import type { Category, SessionIntent, InspirationItem, Session } from '../types';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

const SessionFlowPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [intent, setIntent] = useState<SessionIntent>('BUILD');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [inspirations, setInspirations] = useState<InspirationItem[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Plan creation state
  const [planTitle, setPlanTitle] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [selectedInspirations, setSelectedInspirations] = useState<string[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    // We'll mock categories for now or fetch if backend has an endpoint
    // Actually backend doesn't have a public GET /categories but we can assume some common ones or add it
    const fetchCategories = async () => {
      // For now using the ones from the seed
      setCategories([
        { id: 1, slug: 'coding', label: 'Coding', icon: '💻' },
        { id: 2, slug: 'design', label: 'Design', icon: '🎨' },
        { id: 3, slug: 'writing', label: 'Writing', icon: '✍️' },
        { id: 4, slug: 'music', label: 'Music', icon: '🎸' },
        { id: 5, slug: 'art', label: 'Art', icon: '🖌️' },
      ]);
    };
    fetchCategories();
  }, []);

  const startSession = async () => {
    setLoading(true);
    try {
      const response = await api.post('/sessions', {
        intent,
        category_slug: selectedCategory || undefined,
      });
      setSession(response.data.session);
      setInspirations(response.data.inspirations);
      setStep(2);
    } catch (err) {
      console.error('Failed to start session', err);
    } finally {
      setLoading(false);
    }
  };

  const convertToPlan = async () => {
    setLoading(true);
    try {
      const planResponse = await api.post('/plans', {
        title: planTitle,
        category_slug: selectedCategory,
        description: planDescription,
        inspiration_ids: selectedInspirations,
      });
      
      if (session) {
        await api.patch(`/sessions/${session.id}/convert`, {
          plan_id: planResponse.data.id,
        });
      }
      
      navigate(`/plans/${planResponse.data.id}`);
    } catch (err) {
      console.error('Failed to convert session', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleInspiration = (id: string) => {
    setSelectedInspirations(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="session-flow-container">
      {step === 1 && (
        <div className="session-step card">
          <h1>What's your intent?</h1>
          <div className="intent-selector">
            {(['BUILD', 'EXPLORE', 'CONTINUE'] as SessionIntent[]).map((i) => (
              <button
                key={i}
                className={`intent-btn ${intent === i ? 'active' : ''}`}
                onClick={() => setIntent(i)}
              >
                {i}
              </button>
            ))}
          </div>
          
          <h3>Choose a Category</h3>
          <div className="category-grid">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`category-item ${selectedCategory === cat.slug ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.slug)}
              >
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-label">{cat.label}</span>
              </div>
            ))}
          </div>

          <button 
            className="primary-btn mt-2" 
            onClick={startSession} 
            disabled={loading || !selectedCategory}
          >
            {loading ? 'Starting...' : 'Start Session'} <ArrowRight size={18} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="session-step">
          <div className="inspiration-header">
            <h1><Sparkles className="icon-accent" /> Inspirations for your {selectedCategory} session</h1>
            <p>Select items that resonate with your goal.</p>
          </div>

          <div className="inspiration-grid">
            {inspirations.map((item) => (
              <div 
                key={item.id} 
                className={`inspiration-card card ${selectedInspirations.includes(item.id) ? 'selected' : ''}`}
                onClick={() => toggleInspiration(item.id)}
              >
                {selectedInspirations.includes(item.id) && <CheckCircle2 className="check-icon" />}
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
            {inspirations.length === 0 && (
              <div className="card empty-inspirations">
                <p>No specific inspirations found, but you can still create a plan!</p>
              </div>
            )}
          </div>

          <div className="conversion-form card mt-2">
            <h2>Ready to commit to a plan?</h2>
            <div className="form-group">
              <label>Plan Title</label>
              <input 
                type="text" 
                placeholder="e.g. Build a custom mechanical keyboard" 
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea 
                placeholder="Describe your goal..." 
                value={planDescription}
                onChange={(e) => setPlanDescription(e.target.value)}
              />
            </div>
            <div className="actions">
              <button className="secondary-btn" onClick={() => navigate('/dashboard')}>Maybe Later</button>
              <button className="primary-btn" onClick={convertToPlan} disabled={loading || !planTitle}>
                {loading ? 'Creating...' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionFlowPage;
