import {
  ArrowRight,
  BellRing,
  Building2,
  ClipboardCheck,
  FileCheck2,
  LayoutDashboard,
  Network,
  PlugZap,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

import './launchpad.css';

export type LaunchpadTarget = 'overview' | 'clients' | 'prospects' | 'client-workspace';

type LaunchpadProps = {
  onLaunch: (target: LaunchpadTarget) => void;
};

const features = [
  {
    icon: Network,
    title: 'Client portfolio visibility',
    copy: 'See active clients, onboarding stages, posture, and open work from one MSP workspace.',
  },
  {
    icon: ClipboardCheck,
    title: 'Guided client onboarding',
    copy: 'Collect business context and assets, confirm the environment, and move proposals toward approval.',
    featured: true,
  },
  {
    icon: ShieldCheck,
    title: 'Policy-led decisions',
    copy: 'Keep consequential actions behind explicit approvals while routine work follows defined policy.',
  },
  {
    icon: BellRing,
    title: 'Investigation queues',
    copy: 'Bring evidence, rationale, and pending human decisions together in a focused operating view.',
  },
  {
    icon: UserRound,
    title: 'Client-facing workspace',
    copy: 'Give each organization a clear view of intake, package decisions, setup progress, and monitoring.',
  },
  {
    icon: PlugZap,
    title: 'Activation readiness',
    copy: 'Track approval, integration, and setup gates before a prospect becomes a monitored client.',
  },
];

const faqs = [
  {
    question: 'Is this a live production environment?',
    answer: 'No. This is an interactive product demo with simulated security data, workflows, and integrations.',
  },
  {
    question: 'Who is the experience designed for?',
    answer: 'The demo supports MSP administrators and technicians as well as client contacts completing onboarding or monitoring their organization.',
  },
  {
    question: 'Does the demo store shared customer data?',
    answer: 'Not yet. Demo state is kept in the current browser session and is not synchronized across users or devices.',
  },
  {
    question: 'Can clients approve their proposed package?',
    answer: 'Yes. The client journey includes environment confirmation, clarification, package review, approval, and activation readiness.',
  },
];

export function Launchpad({ onLaunch }: LaunchpadProps) {
  return (
    <main className="launchpad" data-testid="launchpad">
      <header className="launchpad-nav">
        <div className="launchpad-nav-inner">
          <button
            className="launchpad-cockpit-access"
            onClick={() => onLaunch('overview')}
            data-testid="button-launchpad-cockpit"
          >
            <LayoutDashboard size={14} />
            <span>Access cockpit</span>
            <ArrowRight size={13} />
          </button>
          <a className="launchpad-brand-lockup" href="#top" aria-label="Sentriq home">
            <span className="launchpad-brand-mark" aria-hidden="true"><ShieldCheck size={14} /></span>
            <h1>Sentriq</h1>
          </a>
          <nav className="launchpad-nav-links" aria-label="Landing page">
            <a href="#platform">Platform</a>
            <a href="#workspaces">Workspaces</a>
            <a href="#how-it-works">How it works</a>
            <a href="#faq">FAQ</a>
          </nav>
          <span className="launchpad-demo-label">Interactive demo</span>
        </div>
      </header>

      <section className="launchpad-hero" id="top">
        <div className="launchpad-hero-glow" aria-hidden="true" />
        <div className="launchpad-section-inner launchpad-hero-inner">
          <span className="launchpad-pill"><i aria-hidden="true" />Interactive demo</span>
          <h2>The operating layer for<br /><em>modern MSP security.</em></h2>
          <p>Bring client onboarding, security decisions, service activation, and ongoing monitoring into one calm workspace.</p>
          <div className="launchpad-hero-actions">
            <button className="launchpad-button teal" onClick={() => onLaunch('prospects')} data-testid="button-launchpad-prospects">
              Explore MSP onboarding <ArrowRight size={14} />
            </button>
            <button className="launchpad-button light" onClick={() => onLaunch('client-workspace')} data-testid="button-launchpad-client-workspace">
              Enter client workspace <ArrowRight size={14} />
            </button>
          </div>
          <span className="launchpad-demo-note">Simulated data · Browser-session storage · No live integrations</span>

          <div className="launchpad-product-frame" aria-label="Sentriq cockpit preview">
            <div className="launchpad-browser-bar">
              <span aria-hidden="true"><i /><i /><i /></span>
              <code>sentriq / operations cockpit</code>
              <small>Demo</small>
            </div>
            <img src="/sentriq-cockpit.jpg" alt="Sentriq operations cockpit showing a security decision queue" />
          </div>
        </div>
      </section>

      <section className="launchpad-section" id="platform">
        <div className="launchpad-section-inner">
          <span className="launchpad-kicker">The platform</span>
          <div className="launchpad-section-heading">
            <h2>One connected workspace.<br /><em>Two sides of service delivery.</em></h2>
            <p>Sentriq keeps MSP operations and the client experience aligned from the first intake through ongoing monitoring.</p>
          </div>
          <div className="launchpad-feature-grid">
            {features.map(({ icon: Icon, title, copy, featured }, index) => (
              <article className={`launchpad-feature${featured ? ' featured' : ''}`} key={title}>
                <div className="launchpad-feature-top">
                  <span><Icon size={16} /></span>
                  <small>{String(index + 1).padStart(2, '0')}</small>
                </div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="launchpad-section launchpad-workspace-section" id="workspaces">
        <div className="launchpad-section-inner">
          <span className="launchpad-kicker">Choose a workspace</span>
          <div className="launchpad-section-heading compact">
            <h2>Start where the work is.</h2>
            <p>Each entry preserves the right organization, permissions, and next action for the selected role.</p>
          </div>
          <div className="launchpad-workspaces" aria-label="Demo workspaces">
            <article className="launchpad-workspace-card dark">
              <span className="launchpad-workspace-icon"><Building2 size={20} /></span>
              <span className="launchpad-audience">For service providers</span>
              <h2>MSP</h2>
              <p>Bring new clients into service or manage the security posture of organizations already under management.</p>
              <div className="launchpad-actions">
                <button className="launchpad-action" onClick={() => onLaunch('prospects')}>
                  <span><strong>Prospects &amp; onboarding</strong><small>Intake, proposals, approval, and activation</small></span><ArrowRight size={15} />
                </button>
                <button className="launchpad-action" onClick={() => onLaunch('clients')} data-testid="button-launchpad-active-clients">
                  <span><strong>Manage active clients</strong><small>Health, alerts, investigations, and services</small></span><ArrowRight size={15} />
                </button>
              </div>
            </article>

            <article className="launchpad-workspace-card teal">
              <span className="launchpad-workspace-icon"><UserRound size={20} /></span>
              <span className="launchpad-audience">For organizations</span>
              <h2>Clients</h2>
              <p>Continue onboarding, answer open questions, review a proposed package, or monitor current security activity.</p>
              <button className="launchpad-workspace-link" onClick={() => onLaunch('client-workspace')}>
                Enter my workspace <ArrowRight size={15} />
              </button>
            </article>
          </div>
        </div>
      </section>

      <section className="launchpad-section" id="how-it-works">
        <div className="launchpad-section-inner">
          <span className="launchpad-kicker">How it works</span>
          <div className="launchpad-section-heading split">
            <h2>From prospect to<br />protected client.</h2>
            <p>A connected journey keeps context, decisions, and ownership visible at every handoff.</p>
          </div>
          <div className="launchpad-steps">
            <article>
              <small>Step 01</small>
              <FileCheck2 size={19} />
              <h3>Understand the environment</h3>
              <p>Collect business requirements and assets, then resolve uncertain information with the client.</p>
              <span>Client + MSP</span>
            </article>
            <article className="active">
              <small>Step 02</small>
              <ClipboardCheck size={19} />
              <h3>Align on the service</h3>
              <p>Recommend, explain, revise, and approve the package that matches the confirmed environment.</p>
              <span>Shared decision</span>
            </article>
            <article>
              <small>Step 03</small>
              <LayoutDashboard size={19} />
              <h3>Activate and operate</h3>
              <p>Complete readiness gates, promote the client into monitoring, and manage consequential actions.</p>
              <span>MSP operations</span>
            </article>
          </div>
        </div>
      </section>

      <section className="launchpad-section launchpad-faq-section" id="faq">
        <div className="launchpad-section-inner launchpad-faq-inner">
          <span className="launchpad-kicker">FAQ</span>
          <h2>Questions, answered.</h2>
          <div className="launchpad-faq-list">
            {faqs.map((item, index) => (
              <details key={item.question} open={index === 0}>
                <summary>{item.question}<span aria-hidden="true">+</span></summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="launchpad-closing">
        <div className="launchpad-closing-inner">
          <span className="launchpad-kicker">Ready when you are</span>
          <h2>Step into the <em>Sentriq</em><br />operations cockpit.</h2>
          <p>Explore the working demo with simulated MSP and client journeys.</p>
          <button className="launchpad-button teal" onClick={() => onLaunch('overview')}>
            Access cockpit <ArrowRight size={14} />
          </button>
        </div>
      </section>
    </main>
  );
}
