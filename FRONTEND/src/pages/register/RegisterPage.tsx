import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { navigate } from '../../router/appRouter';
import { SvgIcon } from '../../components/icons/SvgIcon';
import './register.css';

function BrandLogo() {
  return (
    <button
      className="register-brand"
      type="button"
      onClick={() => navigate('/landing')}
    >
      <span className="register-brand-mark" aria-hidden="true">
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
          <defs>
            <linearGradient
              id="register-logo-gradient"
              x1="5"
              y1="5"
              x2="29"
              y2="30"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#D7F7FF" />
              <stop offset=".42" stopColor="#5DE5FF" />
              <stop offset="1" stopColor="#735CFF" />
            </linearGradient>
          </defs>

          <path
            d="M17 2.5 21 13l10.5 4-10.5 4L17 31.5 13 21 2.5 17 13 13 17 2.5Z"
            fill="url(#register-logo-gradient)"
          />

          <circle cx="17" cy="17" r="2.6" fill="#FFF" />
        </svg>
      </span>

      <span className="register-brand-copy">
        <strong>SkillCompass</strong>
        <small>Your Code. A Brighter Tomorrow.</small>
      </span>
    </button>
  );
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const form = new FormData(event.currentTarget);

    const password = String(form.get('password') || '');
    const confirmPassword = String(
      form.get('confirmPassword') || '',
    );

    if (password.length < 8) {
      setError(
        'Your password must contain at least 8 characters.',
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    if (!accepted) {
      setError('Please accept the terms to continue.');
      return;
    }

    // Connect your registration API here.
    navigate('/github');
  }

  return (
    <main className="register-page">
      <div className="register-grid" aria-hidden="true" />

      <div
        className="register-glow register-glow-one"
        aria-hidden="true"
      />

      <div
        className="register-glow register-glow-two"
        aria-hidden="true"
      />

      <div
        className="register-orbit register-orbit-one"
        aria-hidden="true"
      />

      <div
        className="register-orbit register-orbit-two"
        aria-hidden="true"
      />

      <div
        className="register-particles"
        aria-hidden="true"
      >
        {Array.from({ length: 18 }, (_, index) => (
          <i
            key={index}
            style={
              {
                '--i': index,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <header className="register-header">
        <BrandLogo />

        <button
          className="register-back"
          type="button"
          onClick={() => navigate('/landing')}
        >
          <SvgIcon
            name="arrow"
            size={18}
            className="register-back-icon"
          />

          Back to website
        </button>
      </header>

      <section className="register-shell">
        <aside className="register-story">
          <div className="register-story-kicker">
            <span />
            START YOUR JOURNEY
          </div>

          <h1>
            Turn your
            <span> code into</span>
            <strong>direction.</strong>
          </h1>

          <p>
            Create your SkillCompass workspace and discover what
            your projects reveal about your skills, strengths, and
            next career opportunities.
          </p>

          <div className="register-signal-card">
            <div className="signal-top">
              <span>
                <i />
                PROFILE SIGNAL
              </span>

              <b>LIVE</b>
            </div>

            <div className="signal-score">
              <div className="signal-ring">
                <strong>87</strong>
                <span>confidence</span>
              </div>

              <div className="signal-copy">
                <strong>
                  Your technical profile starts here.
                </strong>

                <span>
                  Connect GitHub after registration and let
                  SkillCompass analyze the work you already built.
                </span>
              </div>
            </div>

            <div className="signal-bars">
              <span>
                <b>React</b>
                <i>
                  <em style={{ width: '91%' }} />
                </i>
                <strong>91%</strong>
              </span>

              <span>
                <b>Node.js</b>
                <i>
                  <em style={{ width: '84%' }} />
                </i>
                <strong>84%</strong>
              </span>

              <span>
                <b>TypeScript</b>
                <i>
                  <em style={{ width: '88%' }} />
                </i>
                <strong>88%</strong>
              </span>
            </div>
          </div>

          <div className="register-trust">
            <span>
              <SvgIcon name="check" size={17} />
              Project-based analysis
            </span>

            <span>
              <SvgIcon name="check" size={17} />
              AI-powered insights
            </span>

            <span>
              <SvgIcon name="check" size={17} />
              Career-focused profile
            </span>
          </div>
        </aside>

        <section className="register-card">
          <div className="register-card-heading">
            <div className="register-card-icon">
              <SvgIcon name="sparkle" size={22} />
            </div>

            <div>
              <span>WELCOME TO SKILLCOMPASS</span>

              <h2>Create your account</h2>

              <p>
                Start building your developer intelligence profile.
              </p>
            </div>
          </div>

          <form
            className="register-form"
            onSubmit={handleSubmit}
          >
            <div className="register-field-grid">
              <label className="register-field">
                <span>Full name</span>

                <div className="register-input-wrap">
                  <SvgIcon name="users" size={19} />

                  <input
                    name="name"
                    type="text"
                    placeholder="Enter your name"
                    autoComplete="name"
                    required
                  />
                </div>
              </label>

              <label className="register-field">
                <span>Username</span>

                <div className="register-input-wrap">
                  <span className="register-at">@</span>

                  <input
                    name="username"
                    type="text"
                    placeholder="Choose a username"
                    autoComplete="username"
                    required
                  />
                </div>
              </label>
            </div>

            <label className="register-field">
              <span>Email address</span>

              <div className="register-input-wrap">
                <SvgIcon name="message" size={19} />

                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </label>

            <div className="register-field-grid">
              <label className="register-field">
                <span>Password</span>

                <div className="register-input-wrap">
                  <SvgIcon name="settings" size={18} />

                  <input
                    name="password"
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    required
                  />

                  <button
                    type="button"
                    className="register-visibility"
                    onClick={() =>
                      setShowPassword(
                        value => !value,
                      )
                    }
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    <SvgIcon
                      name={
                        showPassword
                          ? 'x'
                          : 'help'
                      }
                      size={18}
                    />
                  </button>
                </div>
              </label>

              <label className="register-field">
                <span>Confirm password</span>

                <div className="register-input-wrap">
                  <SvgIcon name="check" size={19} />

                  <input
                    name="confirmPassword"
                    type={
                      showConfirmPassword
                        ? 'text'
                        : 'password'
                    }
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    required
                  />

                  <button
                    type="button"
                    className="register-visibility"
                    onClick={() =>
                      setShowConfirmPassword(
                        value => !value,
                      )
                    }
                    aria-label={
                      showConfirmPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    <SvgIcon
                      name={
                        showConfirmPassword
                          ? 'x'
                          : 'help'
                      }
                      size={18}
                    />
                  </button>
                </div>
              </label>
            </div>

            <label className="register-checkbox">
              <input
                type="checkbox"
                checked={accepted}
                onChange={event =>
                  setAccepted(
                    event.target.checked,
                  )
                }
              />

              <span className="register-checkmark">
                <SvgIcon name="check" size={15} />
              </span>

              <span>
                I agree to the SkillCompass{' '}
                <button type="button">
                  Terms of Service
                </button>{' '}
                and{' '}
                <button type="button">
                  Privacy Policy
                </button>
                .
              </span>
            </label>

            {error && (
              <div className="register-error">
                {error}
              </div>
            )}

            <button
              className="register-submit"
              type="submit"
            >
              Create my account
              <SvgIcon name="arrow" size={20} />
            </button>
          </form>

          <div className="register-divider">
            <span>ALREADY HAVE AN ACCOUNT?</span>
          </div>

          <button
            className="register-login"
            type="button"
            onClick={() => navigate('/')}
          >
            Sign in to SkillCompass
            <SvgIcon name="arrow" size={18} />
          </button>

          <p className="register-note">
            Your GitHub account is connected separately after
            registration. You stay in control of what you share.
          </p>
        </section>
      </section>

      <footer className="register-footer">
        <span>SKILLCOMPASS</span>
        <i />
        <span>AI CAREER INTELLIGENCE</span>
      </footer>
    </main>
  );
}
