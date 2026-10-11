export default function GithubHero() {
  return (
    <section className="gh-hero gh-reveal">
      <div className="gh-hero-main">
        <div className="gh-hero-icon" aria-hidden="true">
          <svg
            className="gh-github-logo"
            viewBox="0 0 24 24"
            width="58"
            height="58"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
        </div>

        <div>
          <h1>
            <span>GitHub</span> <em>Workspace</em>
          </h1>
          <p className="gh-hero-copy">
            Connect your GitHub account and let SkillCompass analyze your repositories
            <br className="desktop-only" /> to uncover your skills, strengths and opportunities.
          </p>
        </div>
      </div>

      <div className="gh-hero-art" aria-hidden="true">
        <div className="gh-quote">
          <span>“</span>
          <p>Your code tells a story.<br />Let's turn it into opportunities.</p>
          <b>”</b>
          <i />
        </div>

        <div className="gh-hero-scene">
          <div className="gh-orbit-ring gh-orbit-ring-main" />
          <div className="gh-orbit-ring gh-orbit-ring-soft" />
          <div className="gh-cat-orb">
            <span className="gh-orb-highlight" />
          </div>
          <div className="gh-planet gh-planet-small" />
          <div className="gh-planet gh-planet-top" />
          <div className="gh-planet gh-planet-bottom" />

          <div className="gh-cat">
            <div className="gh-cat-head">
              <span className="gh-cat-ear gh-cat-ear-left" />
              <span className="gh-cat-ear gh-cat-ear-right" />
              <span className="gh-cat-ear-inner gh-cat-ear-inner-left" />
              <span className="gh-cat-ear-inner gh-cat-ear-inner-right" />
            </div>
            <div className="gh-cat-neck" />
            <div className="gh-cat-body" />
            <span className="gh-cat-arm gh-cat-arm-left" />
            <span className="gh-cat-arm gh-cat-arm-right" />
            <span className="gh-cat-tail" />
          </div>
        </div>
      </div>
    </section>
  );
}
