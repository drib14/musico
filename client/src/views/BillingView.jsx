import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Check, Crown, CreditCard, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

const BillingView = () => {
  const { API_URL, token, user, updatePremiumStatus, showToast } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [sessionStatus, setSessionStatus] = useState(null); // 'success', 'cancel'

  // Catch Paymongo return redirect parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session = params.get('session');
    
    if (session === 'success') {
      setSessionStatus('success');
      activatePremiumStatus(); // Upgrade account automatically on successful transaction
    } else if (session === 'cancel') {
      setSessionStatus('cancel');
      showToast('Checkout session was cancelled', 'error');
    }

    // Clean up URL parameters without reloading page
    if (session) {
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.pushState({ path: cleanUrl }, '', cleanUrl);
    }
  }, []);

  // Initiate Paymongo Checkout Session
  const handleUpgradeCheckout = async () => {
    if (!token) return showToast('Please log in to upgrade your account', 'error');
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/billing/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Billing request failed');

      // Redirect user directly to Paymongo standard secure checkout portal
      if (data.checkoutUrl) {
        showToast('Redirecting to Paymongo Checkout...');
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL received from billing provider');
      }
    } catch (error) {
      console.error(error);
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Activate Premium Status on successful Paymongo redirect back
  const activatePremiumStatus = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/billing/upgrade`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Activation failed');
      const data = await res.json();
      
      updatePremiumStatus(true);
      showToast(data.message);
      
      // Celebratory fireworks confetti blast!
      confetti({
        particleCount: 150,
        spread: 80,
        colors: ['#F59E0B', '#1E3A8A', '#3B82F6'],
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error('Error activating premium status:', err);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Dynamic transaction completed banner */}
      {sessionStatus === 'success' && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid var(--success)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          animation: 'slide-up 0.4s ease'
        }}>
          <ShieldCheck className="w-12 h-12 text-success" style={{ flexShrink: 0 }} />
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--success)' }}>Payment Confirmed</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Your Paymongo checkout was processed successfully. Welcome to **Musico Premium**! You now have unlimited direct uploads.
            </p>
          </div>
        </div>
      )}

      {/* Intro section */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Select Your Music Journey</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
          Distribute your music directly inside the app. Upgrade to Premium to unlock unlimited uploads and standard platform features.
        </p>
      </div>

      {/* Plans Comparison Grid */}
      <div className="billing-grid" style={{ marginTop: '12px' }}>
        
        {/* FREE PLAN */}
        <div className="billing-card">
          <div className="billing-header">
            <h3 className="billing-title">Musico Free</h3>
            <span className="billing-badge">Active</span>
          </div>
          <div className="billing-price">PHP 0.00 <span>/ forever</span></div>
          
          <ul className="billing-features">
            <li className="billing-feature-item">
              <Check /> <span>Listen to all uploaded tracks</span>
            </li>
            <li className="billing-feature-item">
              <Check /> <span>Standard audio visualizer access</span>
            </li>
            <li className="billing-feature-item">
              <Check /> <span>Create custom user playlists</span>
            </li>
            <li className="billing-feature-item">
              <Check /> <span>Upload up to 3 songs directly</span>
            </li>
          </ul>

          <button 
            className="btn btn-secondary w-full" 
            style={{ marginTop: 'auto', pointerEvents: 'none', opacity: 0.6 }}
          >
            Included by Default
          </button>
        </div>

        {/* PREMIUM PLAN */}
        <div className="billing-card premium">
          <div className="billing-header">
            <h3 className="billing-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--premium-color)' }}>
              <Crown className="w-5 h-5" /> Musico Premium
            </h3>
            {user?.isPremium && <span className="billing-badge premium">Active</span>}
          </div>
          <div className="billing-price">PHP 250.00 <span>/ monthly</span></div>

          <ul className="billing-features">
            <li className="billing-feature-item">
              <Check /> <strong style={{ color: 'var(--text-primary)' }}>Unlimited direct audio uploads</strong>
            </li>
            <li className="billing-feature-item">
              <Check /> <span>High-fidelity premium audio accents</span>
            </li>
            <li className="billing-feature-item">
              <Check /> <strong style={{ color: 'var(--text-primary)' }}>Custom gold crown profile badge</strong>
            </li>
            <li className="billing-feature-item">
              <Check /> <span>Ad-free clean music streaming</span>
            </li>
            <li className="billing-feature-item">
              <Check /> <span>Priority system customer support</span>
            </li>
          </ul>

          {user?.isPremium ? (
            <button 
              className="btn btn-outline w-full" 
              style={{ marginTop: 'auto', borderColor: 'var(--accent)', color: 'var(--accent)', pointerEvents: 'none', opacity: 0.8 }}
            >
              Premium Plan Active
            </button>
          ) : (
            <button 
              className="btn btn-primary w-full" 
              style={{ 
                marginTop: 'auto', 
                backgroundColor: 'var(--premium-color)', 
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', 
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)' 
              }}
              onClick={handleUpgradeCheckout}
              disabled={loading}
            >
              {loading ? <div className="spinner"></div> : <>Upgrade via Paymongo <CreditCard className="w-4 h-4" /></>}
            </button>
          )}
        </div>

      </div>

    </div>
  );
};

export default BillingView;
