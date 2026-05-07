import { useEffect, useRef, useState } from 'react';
import { signInWithEmail, signOut, signUpWithEmail } from '../lib/auth.js';

export default function AuthScreen({ authReady, isSupabaseConfigured }) {
  const [mode, setMode] = useState('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignUp = mode === 'sign-up';

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        const { session } = await signUpWithEmail(email.trim(), password);
        if (!session) {
          setMessage('Check your email to confirm this ProjectDesk account.');
        }
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (submitError) {
      setError(submitError.message || 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-kicker">ProjectDesk</div>
        <h1 id="auth-title">{isSignUp ? 'Create your account' : 'Sign in'}</h1>
        <p>{isSignUp ? 'Use Supabase Auth to protect sync across devices.' : 'Open your synced projects securely.'}</p>

        {!isSupabaseConfigured ? (
          <div className="auth-message auth-error">
            Supabase is not configured. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env`.
          </div>
        ) : !authReady ? (
          <div className="auth-message">Checking saved session...</div>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                minLength={6}
                required
              />
            </label>
            {message && <div className="auth-message">{message}</div>}
            {error && <div className="auth-message auth-error">{error}</div>}
            <button className="mbtn mbtn-pri" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Working...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>
        )}

        <button
          className="auth-switch"
          type="button"
          onClick={() => {
            setMode(isSignUp ? 'sign-in' : 'sign-up');
            setError('');
            setMessage('');
          }}
        >
          {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Create one'}
        </button>
      </section>
    </main>
  );
}

export function AccountMenu({ user, workspace, onOpenData, onSignOut }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnOutsideTap = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideTap, true);
    return () => document.removeEventListener('pointerdown', closeOnOutsideTap, true);
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      onSignOut?.();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        className="account-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="account-label-email" title={user?.email || ''}>{user?.email || 'Local only'}</span>
        <span className="account-label-mobile">{workspace?.name || 'Account'}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {isOpen && (
        <div className="account-panel" role="menu">
          {workspace?.name && (
            <div className="account-workspace">
              <span>Workspace</span>
              <strong>{workspace.name}</strong>
            </div>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onOpenData?.();
            }}
          >
            Data / Backup
          </button>
          {user && (
            <button type="button" role="menuitem" onClick={handleSignOut} disabled={isSigningOut}>
              {isSigningOut ? 'Signing out...' : 'Sign out'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
