import { useEffect } from 'react';
import type { Component } from '@/types/catalogue';
import {
  getDomain,
  getCapability,
  getComponent,
  getOutgoingEdges,
  getIncomingEdges,
  getProgrammesForComponent,
  getClaimsForSubject,
  getEvidenceSources,
  getTechnicalObservationsForComponent,
  getGapsForComponent,
  components,
} from '@/data/fullCatalogue';
import { VendorLogo } from '@/components/logo/VendorLogo';
import { humanize, formatDuration } from '@/lib/formatting';
import styles from './SystemDetailDrawer.module.css';

interface SystemDetailDrawerProps {
  readonly component: Component;
  readonly onClose: () => void;
  readonly onSelectComponent: (componentId: string) => void;
}

function Fact({ label, value }: { readonly label: string; readonly value: string }) {
  if (!value || value === 'Unknown') return null;
  return (
    <div className={styles.fact}>
      <span className={styles.factLabel}>{label}</span>
      <span className={styles.factValue}>{value}</span>
    </div>
  );
}

export function SystemDetailDrawer({ component, onClose, onSelectComponent }: SystemDetailDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const domain = getDomain(component.domain_id);
  const capability = getCapability(component.primary_capability_id);
  const modules = components.filter((c) => c.parent_component_id === component.component_id);
  const outgoing = getOutgoingEdges(component.component_id);
  const incoming = getIncomingEdges(component.component_id);
  const programmes = getProgrammesForComponent(component.component_id);
  const claims = getClaimsForSubject(component.component_id);
  const claimSourceIds = Array.from(new Set(claims.flatMap((c) => c.source_ids)));
  const evidence = getEvidenceSources(Array.from(new Set([...component.source_ids, ...claimSourceIds])));
  const observations = getTechnicalObservationsForComponent(component.component_id);
  const gaps = getGapsForComponent(component.component_id);
  const duration = formatDuration(component.relationship_duration_years_json, component.relationship_start_precision);

  return (
    <>
      <button type="button" className={styles.overlay} aria-label="Close system detail" onClick={onClose} />
      <aside className={styles.drawer} role="dialog" aria-label={`${component.display_name} detail`} data-testid="system-detail-drawer">
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className={styles.header}>
          <VendorLogo vendorId={component.vendor_id} size={26} />
          <div>
            <p className={styles.title}>{component.display_name}</p>
            {component.product_name && component.product_name !== component.display_name ? (
              <p className={styles.productName}>{component.product_name}</p>
            ) : null}
          </div>
        </div>

        <div className={styles.badgeRow}>
          <span className={styles.badge}>{humanize(component.deployment_status)}</span>
          <span className={styles.badge}>{humanize(component.evidence_status)}</span>
          {component.criticality && component.criticality !== 'UNKNOWN' ? <span className={styles.badge}>{humanize(component.criticality)} criticality</span> : null}
        </div>

        <p className={styles.sectionTitle}>Overview</p>
        <div className={styles.factGrid}>
          <Fact label="Architecture role" value={humanize(component.architecture_role)} />
          <Fact label="Domain" value={domain?.domain_name ?? humanize(component.domain_id)} />
          <Fact label="Capability" value={capability?.capability_name ?? ''} />
          <Fact label="Business process" value={component.business_process} />
          <Fact label="Lifecycle" value={humanize(component.lifecycle_disposition)} />
          <Fact label="Modernity" value={humanize(component.modernity)} />
          <Fact label="System of record" value={humanize(component.system_of_record)} />
          <Fact label="Hosting model" value={humanize(component.hosting_model)} />
          <Fact label="Deployment model" value={humanize(component.deployment_model)} />
          <Fact label="Geography" value={humanize(component.geography_scope)} />
          <Fact label="User groups" value={component.user_groups} />
          <Fact label="First known year" value={String(component.first_known_year || '')} />
        </div>

        {component.relationship_start_year || duration || component.contract_directness !== 'UNKNOWN' ? (
          <>
            <p className={styles.sectionTitle}>Commercial relationship</p>
            <div className={styles.factGrid}>
              <Fact label="Relationship start" value={component.relationship_start_year ? String(component.relationship_start_year) : ''} />
              <Fact label="Start precision" value={humanize(component.relationship_start_precision)} />
              <Fact label="Duration" value={duration ?? ''} />
              <Fact label="Contract directness" value={humanize(component.contract_directness)} />
            </div>
          </>
        ) : null}

        {component.description ? (
          <>
            <p className={styles.sectionTitle}>Description</p>
            <p className={styles.description}>{component.description}</p>
          </>
        ) : null}

        <p className={styles.sectionTitle}>Modules</p>
        {modules.length > 0 ? (
          <ul className={styles.list}>
            {modules.map((m) => (
              <li key={m.component_id} className={styles.listItem}>
                <button type="button" className={styles.link} onClick={() => onSelectComponent(m.component_id)}>
                  {m.display_name}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptySection}>No sub-modules recorded.</p>
        )}

        <p className={styles.sectionTitle}>Linked systems</p>
        {outgoing.length + incoming.length > 0 ? (
          <ul className={styles.list}>
            {outgoing.map((edge) => {
              const target = getComponent(edge.to_component_id);
              return (
                <li key={edge.edge_id} className={styles.listItem}>
                  <div className={styles.listItemTitle}>
                    &rarr;{' '}
                    <button type="button" className={styles.link} onClick={() => target && onSelectComponent(target.component_id)}>
                      {target?.display_name ?? edge.to_component_id}
                    </button>
                  </div>
                  <div className={styles.listItemMeta}>
                    {humanize(edge.relationship_type)} · {humanize(edge.integration_status)}
                    {edge.is_missing_link ? ' · missing link' : ''}
                  </div>
                </li>
              );
            })}
            {incoming.map((edge) => {
              const source = getComponent(edge.from_component_id);
              return (
                <li key={edge.edge_id} className={styles.listItem}>
                  <div className={styles.listItemTitle}>
                    &larr;{' '}
                    <button type="button" className={styles.link} onClick={() => source && onSelectComponent(source.component_id)}>
                      {source?.display_name ?? edge.from_component_id}
                    </button>
                  </div>
                  <div className={styles.listItemMeta}>
                    {humanize(edge.relationship_type)} · {humanize(edge.integration_status)}
                    {edge.is_missing_link ? ' · missing link' : ''}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={styles.emptySection}>No architecture relationships recorded.</p>
        )}

        {programmes.length > 0 ? (
          <>
            <p className={styles.sectionTitle}>Transformation programmes</p>
            <ul className={styles.list}>
              {programmes.map((p) => (
                <li key={p.programme_id} className={styles.listItem}>
                  <div className={styles.listItemTitle}>{p.programme_name}</div>
                  <div className={styles.listItemMeta}>{humanize(p.status)} · {p.business_outcome}</div>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {gaps.length > 0 ? (
          <>
            <p className={styles.sectionTitle}>Related TO FIND gaps</p>
            <ul className={styles.list}>
              {gaps.map((g) => (
                <li key={g.gap_id} className={styles.listItem}>
                  <div className={styles.listItemTitle}>{g.gap_title}</div>
                  <div className={styles.listItemMeta}>{g.priority} · {humanize(g.gap_status)}</div>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <p className={styles.sectionTitle}>Evidence &amp; sources</p>
        {evidence.length > 0 ? (
          <ul className={styles.list}>
            {evidence.map((e) => (
              <li key={e.source_id} className={styles.listItem}>
                <div className={styles.listItemTitle}>{e.source_title}</div>
                <div className={styles.listItemMeta}>
                  {e.publisher} · {humanize(e.source_type)}
                  {e.url_or_reference ? (
                    <>
                      {' · '}
                      <a className={styles.link} href={e.url_or_reference} target="_blank" rel="noreferrer">
                        source ↗
                      </a>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptySection}>No evidence sources recorded.</p>
        )}

        {observations.length > 0 ? (
          <>
            <p className={styles.sectionTitle}>Technical observations</p>
            <ul className={styles.list}>
              {observations.map((o) => (
                <li key={o.observation_id} className={styles.listItem}>
                  <div className={styles.listItemTitle}>{o.technology_name}</div>
                  <div className={styles.listItemMeta}>
                    {humanize(o.evidence_status)} · confidence {o.confidence_score}
                    {o.direct_contract_inference_allowed ? '' : ' · not a confirmed contract'}
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {component.open_questions ? (
          <>
            <p className={styles.sectionTitle}>Open questions</p>
            <p className={styles.openQuestions}>{component.open_questions}</p>
          </>
        ) : null}
      </aside>
    </>
  );
}
