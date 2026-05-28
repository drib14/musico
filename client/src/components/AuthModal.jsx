import React, { useState, useRef, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { API_URL, loginUser, showToast } = useContext(AppContext);
  const [mode, setMode] = useState(initialMode); // 'login', 'register', 'forgot', 'verify', 'verify-forgot', 'reset-password', 'success'
  
  // Form input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 6-digit verification code states
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  // Auto-focus first input on entering verification screen
  useEffect(() => {
    if ((mode === 'verify' || mode === 'verify-forgot') && inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0].focus();
      }, 100);
    }
  }, [mode]);

  useEffect(() => {
    // If modal is opened, sync internal mode with prop
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // --- 6-Digit input event handlers ---

  const handleCodeChange = (index, val) => {
    const numericVal = val.replace(/[^0-9]/g, '');
    const newCode = [...code];
    newCode[index] = numericVal.slice(-1); // Only take last digit
    setCode(newCode);

    // Auto-focus next box
    if (numericVal && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleCodeKeyDown = (index, e) => {
    // Navigate backwards on Backspace
    if (e.key === 'Backspace') {
      if (!code[index] && index > 0) {
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
        inputRefs.current[index - 1].focus();
      } else if (code[index]) {
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
      }
    }
  };

  const handleCodePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      setCode(digits);
      inputRefs.current[5].focus();
    } else {
      showToast('Please paste a valid 6-digit numerical code', 'error');
    }
  };

  // --- API Submission Controllers ---

  // User Login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return showToast('Please fill in all fields', 'error');

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        // If user is registered but not verified
        if (res.status === 403 && data.unverified) {
          showToast(data.message, 'error');
          setEmail(data.email);
          setCode(['', '', '', '', '', '']);
          setMode('verify');
          return;
        }
        throw new Error(data.message || 'Login failed');
      }

      loginUser(data, data.token);
      onClose();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // User Register
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return showToast('Please fill in all fields', 'error');
    if (password.length < 6) return showToast('Password must be at least 6 characters', 'error');

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      showToast(data.message);
      setCode(['', '', '', '', '', '']);
      setMode('verify');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Resend code helper
  const handleResendCode = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast(data.message);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  // Verify Registration Email
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    const verificationCode = code.join('');
    if (verificationCode.length < 6) return showToast('Please enter the complete 6-digit code', 'error');

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification failed');

      // Login immediately and show success screen
      loginUser(data, data.token);
      setMode('success');
      
      // Beautiful burst of celebratory confetti
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Forgot password trigger code
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) return showToast('Please provide your email address', 'error');

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send recovery code');

      showToast(data.message);
      setCode(['', '', '', '', '', '']);
      setMode('verify-forgot');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Verify Forgot Password Code
  const handleVerifyResetCode = async (e) => {
    e.preventDefault();
    const recoveryCode = code.join('');
    if (recoveryCode.length < 6) return showToast('Please enter the complete 6-digit code', 'error');

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: recoveryCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification failed');

      showToast(data.message);
      setMode('reset-password');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Reset Password with code
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) return showToast('Please fill in all fields', 'error');
    if (password !== confirmPassword) return showToast('Passwords do not match', 'error');
    if (password.length < 6) return showToast('Password must be at least 6 characters', 'error');

    const recoveryCode = code.join('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: recoveryCode, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reset password');

      // Password successfully updated! Send to success stage
      setMode('success');
      
      confetti({
        particleCount: 100,
        spread: 60,
        colors: ['#3B82F6', '#60A5FA', '#1E3A8A'],
        origin: { y: 0.6 }
      });
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ opacity: 1, pointerEvents: 'auto' }}>
      <div className="modal-content" style={{ transform: 'scale(1)', translateY: '0' }}>
        <button className="modal-close" onClick={onClose}>
          <X className="w-5 h-5" />
        </button>

        {/* Dynamic portal layout screens */}

        {/* 1. LOGIN MODE */}
        {mode === 'login' && (
          <>
            <div className="modal-header">
              <div className="modal-logo logo-text">Musico</div>
              <h2 className="modal-title">Welcome Back</h2>
              <p className="modal-desc">Sign in to enjoy custom streaming and direct uploads</p>
            </div>
            
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="form-input-wrapper">
                  <Mail className="form-input-icon" />
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Password</label>
                  <span className="form-link" onClick={() => setMode('forgot')}>Forgot Password?</span>
                </div>
                <div className="form-input-wrapper">
                  <Lock className="form-input-icon" />
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
                {loading ? <div className="spinner"></div> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="form-footer">
              Don't have an account? <span onClick={() => setMode('register')}>Register here</span>
            </div>
          </>
        )}

        {/* 2. REGISTER MODE */}
        {mode === 'register' && (
          <>
            <div className="modal-header">
              <div className="modal-logo logo-text">Musico</div>
              <h2 className="modal-title">Create Account</h2>
              <p className="modal-desc">Join Musico to stream and self-distribute your songs</p>
            </div>

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="form-input-wrapper">
                  <User className="form-input-icon" />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="form-input-wrapper">
                  <Mail className="form-input-icon" />
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="form-input-wrapper">
                  <Lock className="form-input-icon" />
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
                {loading ? <div className="spinner"></div> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="form-footer">
              Already have an account? <span onClick={() => setMode('login')}>Sign in</span>
            </div>
          </>
        )}

        {/* 3. FORGOT PASSWORD MODE */}
        {mode === 'forgot' && (
          <>
            <button 
              style={{ display: 'flex', alignItems: 'center', gap: '4px', border: 'none', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', padding: '0', alignSelf: 'flex-start' }}
              onClick={() => setMode('login')}
            >
              <ChevronLeft className="w-4 h-4" /> Back to Sign In
            </button>
            
            <div className="modal-header">
              <h2 className="modal-title">Recover Password</h2>
              <p className="modal-desc">Enter your email and we'll send a 6-digit confirmation code to reset your password</p>
            </div>

            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="form-input-wrapper">
                  <Mail className="form-input-icon" />
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
                {loading ? <div className="spinner"></div> : 'Send Verification Code'}
              </button>
            </form>
          </>
        )}

        {/* 4. EMAIL VERIFICATION MODE (REGISTER) */}
        {mode === 'verify' && (
          <>
            <div className="modal-header">
              <ShieldCheck className="w-12 h-12 text-accent" style={{ margin: '0 auto 10px auto' }} />
              <h2 className="modal-title">Verify Your Email</h2>
              <p className="modal-desc">We've sent a 6-digit confirmation code to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>. Please enter the code below:</p>
            </div>

            <form onSubmit={handleVerifyEmail} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="verification-code-container">
                {code.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    maxLength="1"
                    className="verification-box"
                    value={digit}
                    onChange={(e) => handleCodeChange(idx, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(idx, e)}
                    onPaste={handleCodePaste}
                    required
                  />
                ))}
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? <div className="spinner"></div> : 'Verify Code & Activate'}
              </button>
            </form>

            <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Didn't receive the code?{' '}
              <span 
                style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}
                onClick={handleResendCode}
              >
                Resend Code
              </span>
            </div>
          </>
        )}

        {/* 5. CODE VERIFICATION MODE (FORGOT PASSWORD) */}
        {mode === 'verify-forgot' && (
          <>
            <button 
              style={{ display: 'flex', alignItems: 'center', gap: '4px', border: 'none', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', padding: '0', alignSelf: 'flex-start' }}
              onClick={() => setMode('forgot')}
            >
              <ChevronLeft className="w-4 h-4" /> Change Email
            </button>
            
            <div className="modal-header">
              <ShieldCheck className="w-12 h-12 text-accent" style={{ margin: '0 auto 10px auto' }} />
              <h2 className="modal-title">Enter Confirmation Code</h2>
              <p className="modal-desc">Enter the 6-digit password recovery code sent to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>:</p>
            </div>

            <form onSubmit={handleVerifyResetCode} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="verification-code-container">
                {code.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    maxLength="1"
                    className="verification-box"
                    value={digit}
                    onChange={(e) => handleCodeChange(idx, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(idx, e)}
                    onPaste={handleCodePaste}
                    required
                  />
                ))}
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? <div className="spinner"></div> : 'Confirm Code'}
              </button>
            </form>

            <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Didn't receive the code?{' '}
              <span 
                style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}
                onClick={handleResendCode}
              >
                Resend Code
              </span>
            </div>
          </>
        )}

        {/* 6. RESET PASSWORD SCREEN */}
        {mode === 'reset-password' && (
          <>
            <div className="modal-header">
              <h2 className="modal-title">Reset Your Password</h2>
              <p className="modal-desc">Please choose a secure new password for your account</p>
            </div>

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="form-input-wrapper">
                  <Lock className="form-input-icon" />
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <div className="form-input-wrapper">
                  <Lock className="form-input-icon" />
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Verify password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
                {loading ? <div className="spinner"></div> : 'Save New Password'}
              </button>
            </form>
          </>
        )}

        {/* 7. AUTH SUCCESS SCREEN */}
        {mode === 'success' && (
          <div style={{ textAlign: 'center', padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <CheckCircle className="w-16 h-16 text-success animate-bounce" />
            
            <div className="modal-header" style={{ padding: 0 }}>
              <h2 className="modal-title">Account Secured!</h2>
              <p className="modal-desc">The authentication process completed successfully. Welcome to Musico!</p>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '12px 24px', fontSize: '15px' }}
              onClick={onClose}
            >
              Get Started Streaming
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default AuthModal;
