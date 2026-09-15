import { ArrowRight, Building2, LayoutDashboard, UserRound } from 'lucide-react';

import './launchpad.css';

export type LaunchpadTarget = 'overview' | 'clients' | 'prospects' | 'client-workspace';

type LaunchpadProps = {
  onLaunch: (target: LaunchpadTarget) => void;
};

export function Launchpad({ onLaunch }: LaunchpadProps) {
  return (
    <main className="launchpad" data-testid="launchpad">
      <div className="launchpad-content">
        <button className="launchpad-cockpit-access" onClick={() => onLaunch('overview')} data-testid="button-launchpad-cockpit">
          <LayoutDashboard size={15} /><span>Access cockpit</span>
        </button>

        <header className="launchpad-intro">
          <span className="launchpad-eyebrow"><span aria-hidden="true" />Interactive demo</span>
          <h1 className="launchpad-title">Sentriq</h1>
          <p>Choose your workspace</p>
        </header>

        <section className="launchpad-workspaces" aria-label="Demo workspaces">
          <article className="launchpad-workspace-card">
            <div className="launchpad-workspace-heading">
              <span className="launchpad-workspace-icon" aria-hidden="true"><Building2 size={20} /></span>
              <div>
                <span className="launchpad-audience">For MSPs</span>
                <h2>MSP</h2>
                <p>Manage client security and service delivery.</p>
              </div>
            </div>
            <div className="launchpad-actions">
              <button className="launchpad-action primary" onClick={() => onLaunch('prospects')} data-testid="button-launchpad-prospects">
                <span className="launchpad-action-copy"><strong>Prospects &amp; onboarding</strong><small>Intake, questions, proposals, and activation readiness</small></span><ArrowRight size={15} />
              </button>
              <button className="launchpad-action secondary" onClick={() => onLaunch('clients')} data-testid="button-launchpad-active-clients">
                <span className="launchpad-action-copy"><strong>Manage active clients</strong><small>Health, alerts, investigations, and services</small></span><ArrowRight size={15} />
              </button>
            </div>
          </article>

          <article className="launchpad-workspace-card">
            <div className="launchpad-workspace-heading">
              <span className="launchpad-workspace-icon" aria-hidden="true"><UserRound size={20} /></span>
              <div>
                <span className="launchpad-audience">For clients</span>
                <h2>Clients</h2>
                <p>Complete setup and stay informed about your security.</p>
              </div>
            </div>
            <div className="launchpad-actions">
              <button className="launchpad-action primary" onClick={() => onLaunch('client-workspace')} data-testid="button-launchpad-client-workspace">
                <span className="launchpad-action-copy"><strong>Enter my workspace</strong><small>Continue from your organization’s current stage</small></span><ArrowRight size={15} />
              </button>
            </div>
          </article>
        </section>

      </div>
    </main>
  );
}
