import { useEffect, useRef, useState, useMemo } from 'react';
import { Terminal, Database, Server, Workflow, Zap, Activity } from 'lucide-react';
import './headless-simulation.css';

type StreamEvent = {
  id: string;
  timestamp: string;
  data: string;
};

const OCSF_TEMPLATES = [
  {
    "class_uid": 2001,
    "class_name": "Detection Finding",
    "category_uid": 2,
    "category_name": "Findings",
    "severity_id": 4,
    "severity": "High",
    "message": "Suspicious PowerShell activity detected",
    "time": 0,
    "finding_info": {
      "title": "Encoded PowerShell execution",
      "desc": "PowerShell was launched with an encoded command string."
    },
    "device": {
      "hostname": "NSD-RECEP-02",
      "type_id": 1,
      "os": { "name": "Windows", "version": "10" }
    },
    "sentriq": {
      "rule_id": "T1059.001",
      "scan_id": "sq-scn-789a",
      "risk_score": 96,
      "remediation_available": true,
      "customer_id": "northstar",
      "provenance": "sentriq-os-collector/1.4.2"
    }
  },
  {
    "class_uid": 2001,
    "class_name": "Detection Finding",
    "category_uid": 2,
    "category_name": "Findings",
    "severity_id": 6,
    "severity": "Critical",
    "message": "LSASS memory access block",
    "time": 0,
    "finding_info": {
      "title": "Credential dumping attempt",
      "desc": "A signed utility attempted to dump LSASS memory."
    },
    "device": {
      "hostname": "RWL-FIN-07",
      "type_id": 1,
      "os": { "name": "Windows", "version": "11" }
    },
    "sentriq": {
      "rule_id": "T1003.001",
      "scan_id": "sq-scn-789a",
      "risk_score": 98,
      "remediation_available": true,
      "customer_id": "redwood",
      "provenance": "sentriq-os-collector/1.4.2"
    }
  },
  {
    "class_uid": 4001,
    "class_name": "Network Activity",
    "category_uid": 4,
    "category_name": "Network",
    "severity_id": 1,
    "severity": "Informational",
    "message": "Allowed outbound connection",
    "time": 0,
    "device": {
      "hostname": "PCM-PLANT-14",
      "type_id": 1
    },
    "connection_info": {
      "direction_id": 2,
      "direction": "Outbound",
      "protocol_name": "tcp",
      "dst_endpoint": { "ip": "104.18.32.7", "port": 443 }
    },
    "sentriq": {
      "scan_id": "sq-scn-789a",
      "risk_score": 5,
      "remediation_available": false,
      "customer_id": "pine",
      "provenance": "sentriq-net-filter/1.1.0"
    }
  },
  {
    "class_uid": 2002,
    "class_name": "Vulnerability Finding",
    "category_uid": 2,
    "category_name": "Findings",
    "severity_id": 3,
    "severity": "Medium",
    "message": "Outdated Chrome browser version",
    "time": 0,
    "vulnerabilities": [
      {
        "cve": { "uid": "CVE-2023-4863" },
        "severity": "Medium"
      }
    ],
    "device": {
      "hostname": "AHS-DESIGN-01",
      "type_id": 1
    },
    "sentriq": {
      "rule_id": "SQ-VULN-CHRM",
      "scan_id": "sq-scn-789b",
      "risk_score": 64,
      "remediation_available": false,
      "customer_id": "aster",
      "provenance": "sentriq-os-collector/1.4.2"
    }
  }
];

export function HeadlessSimulation() {
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const eventCountRef = useRef(0);
  const prefersReducedMotion = useMemo(
    () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  useEffect(() => {
    // Generate initial payload
    const initialEvents: StreamEvent[] = [];
    for (let i = 0; i < 6; i++) {
      const template = OCSF_TEMPLATES[Math.floor(Math.random() * OCSF_TEMPLATES.length)];
      const ts = Date.now() - (6 - i) * 15000;
      initialEvents.push({
        id: `evt-${eventCountRef.current++}`,
        timestamp: new Date(ts).toISOString(),
        data: JSON.stringify({ ...template, time: ts })
      });
    }
    setEvents(initialEvents);

    const interval = setInterval(() => {
      const template = OCSF_TEMPLATES[Math.floor(Math.random() * OCSF_TEMPLATES.length)];
      const ts = Date.now();
      const newEvent = {
        id: `evt-${eventCountRef.current++}`,
        timestamp: new Date(ts).toISOString(),
        data: JSON.stringify({ ...template, time: ts })
      };
      
      setEvents((current) => {
        const next = [...current, newEvent];
        return next.length > 50 ? next.slice(next.length - 50) : next;
      });
    }, prefersReducedMotion ? 4000 : 1800);

    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div className="headless-simulation-root" data-testid="headless-simulation">
      <div className="headless-simulation-main">
        <div className="headless-stream-header">
          <div className="headless-stream-title">
            <Terminal size={14} /> stdout — OCSF NDJSON Stream
          </div>
          <div className="headless-stream-meta">
            <span className="live-indicator"><span className="pulse" /> SIMULATION</span>
          </div>
        </div>
        <div className="headless-stream-container" ref={containerRef} data-testid="headless-stream-container">
          {events.map((evt) => (
            <div key={evt.id} className="stream-row animate-fade-in" data-testid={`stream-row-${evt.id}`}>
              <span className="stream-ts">[{evt.timestamp}]</span>
              <span className="stream-data">
                {evt.data.split(/("sentriq":|"remediation_available":|"risk_score":|"customer_id":|"rule_id":|"scan_id":|"provenance":)/g).map((part, i) => {
                  if (part === '"sentriq":' || part === '"remediation_available":' || part === '"risk_score":' || part === '"customer_id":' || part === '"rule_id":' || part === '"scan_id":' || part === '"provenance":') {
                    return <strong key={i} className="highlight-sentriq">{part}</strong>;
                  }
                  return <span key={i}>{part}</span>;
                })}
              </span>
            </div>
          ))}
        </div>
      </div>
      <aside className="headless-simulation-sidebar">
        <div className="headless-sidebar-block">
          <div className="sidebar-icon-wrap"><Zap size={18} /></div>
          <h3>The Architecture</h3>
          <p>The Sentriq hosted UI is simply one consumer. Sentriq evaluates telemetry and emits <strong>OCSF-normalized findings</strong> (Open Cybersecurity Schema Framework).</p>
        </div>
        
        <div className="headless-sidebar-block">
          <div className="sidebar-icon-wrap"><Server size={18} /></div>
          <h3>Compatible with existing SOCs</h3>
          <p>The stream represents what an MSSP's existing SIEM or SOC tool ingests directly.</p>
          <ul className="integration-list">
            <li><Workflow size={12} /> REST API / Webhook</li>
            <li><Database size={12} /> Elastic Common Schema (ECS)</li>
            <li><Activity size={12} /> CEF / Syslog</li>
            <li><Terminal size={12} /> OTLP Collector</li>
          </ul>
        </div>

        <div className="headless-sidebar-block note">
          <strong>Sentriq Extensions</strong>
          <p>We preserve our precise decision logic as a custom vendor extension object on the standard OCSF envelope (<code>sentriq.risk_score</code>, <code>sentriq.rule_id</code>).</p>
        </div>

        <div className="headless-simulation-footer">
          Local data simulation — no active connections
        </div>
      </aside>
    </div>
  );
}
