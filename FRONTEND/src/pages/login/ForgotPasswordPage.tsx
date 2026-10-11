import { useState, type FormEvent } from 'react';
import { navigate } from '../../router/appRouter';
import { SvgIcon } from '../../components/icons/SvgIcon';
import './forgot-password.css';

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Enter the email address connected to your account.');
      return;
    }

    setSubmitted(true);
  }

  return (
    <main className="forgot-page">
      <div className="forgot-grid" aria-hidden="true" />
      <div className="forgot-glow forgot-glow-one" aria-hidden="true" />
      <div className="forgot-glow forgot-glow-two" aria-hidden="true" />
      <div className="forgot-orbit forgot-orbit-one" aria-hidden="true" />
      <div className="forgot-orbit forgot-orbit-two" aria-hidden="true" />

      <header className="forgot-header">
        <button className="forgot-brand" type="button" onClick={() => navigate('/landing')}>
          <span className="forgot-brand-mark" aria-hidden="true">
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <defs>
                <linearGradient id="forgot-logo-gradient" x1="5" y1="5" x2="29" y2="30" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#D7F7FF" />
                  <stop offset=".42" stopColor="#5DE5FF" />
                  <stop offset="1" stopColor="#735CFF" />
                </linearGradient>
              </defs>
              <path d="M17 2.5 21 13l10.5 4-10.5 4L17 31.5 13 21 2.5 17 13 13 17 2.5Z" fill="url(#forgot-logo-gradient)" />
              <circle cx="17" cy="17" r="2.6" fill="#FFF" />
            </svg>
          </span>
          <span className="forgot-brand-copy">
            <strong>SkillCompass</strong>
            <small>Your Code. A Brighter Tomorrow.</small>
          </span>
        </button>

        <button className="forgot-back" type="button" onClick={() => navigate('/login')}>
          <SvgIcon name="arrow" size={18} className="forgot-back-icon" />
          Back to sign in
        </button>
      </header>

      <section className="forgot-layout">
        <div className="forgot-story">
          <span className="forgot-kicker"><i /> ACCOUNT RECOVERY</span>
          <h1>Get back to your <span>career intelligence.</span></h1>
          <p>
            Enter the email linked to your SkillCompass account and we’ll help you continue where you left off.
          </p>

          <div className="forgot-signal">
            <div className="forgot-signal-icon"><SvgIcon name="settings" size={25} /></div>
            <div>
              <strong>Secure recovery</strong>
              <span>Your account remains protected throughout the process.</span>
            </div>
          </div>
        </div>

        <section className="forgot-card">
          {!submitted ? (
            <>
              <div className="forgot-card-icon"><SvgIcon name="message" size={24} /></div>
              <span className="forgot-label">RESET ACCESS</span>
              <h2>Forgot your password?</h2>
              <p className="forgot-description">
                No problem. Enter your account email and we’ll send the next recovery instructions.
              </p>

              <form onSubmit={handleSubmit} className="forgot-form">
                <label className="forgot-field">
                  <span>Email address</span>
                  <div className="forgot-input-wrap">
                    <SvgIcon name="message" size={19} />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </label>

                {error && <div className="forgot-error">{error}</div>}

                <button className="forgot-submit" type="submit">
                  Send recovery instructions
                  <SvgIcon name="arrow" size={20} />
                </button>
              </form>

              <button className="forgot-signin" type="button" onClick={() => navigate('/login')}>
                <SvgIcon name="arrow" size={18} className="forgot-left-arrow" />
                Back to sign in
              </button>
            </>
          ) : (
            <div className="forgot-success">
              <div className="forgot-success-icon"><SvgIcon name="check" size={28} /></div>
              <span className="forgot-label">CHECK YOUR INBOX</span>
              <h2>Recovery instructions are on their way.</h2>
              <p>
                If an account exists for <strong>{email}</strong>, recovery instructions will be sent there.
              </p>
              <button className="forgot-submit" type="button" onClick={() => navigate('/login')}>
                Return to sign in
                <SvgIcon name="arrow" size={20} />
              </button>
              <button className="forgot-resend" type="button" onClick={() => setSubmitted(false)}>
                Use a different email
              </button>
            </div>
          )}
        </section>
      </section>

      <footer className="forgot-footer">
        <span>SKILLCOMPASS</span><i /><span>AI CAREER INTELLIGENCE</span>
      </footer>
    </main>
  );
}
