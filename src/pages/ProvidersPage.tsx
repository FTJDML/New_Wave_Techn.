import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/shell/PageHeader';
import { DomainTabs } from '@/components/shell/DomainTabs';
import { VendorLogo } from '@/components/logo/VendorLogo';
import { buildProviderSections, buildProviderToFindGaps, formatProviderRole, type ProviderCard } from '@/lib/providersView';
import { humanize } from '@/lib/formatting';
import { evidenceStatusColor, priorityColor } from '@/lib/catalogueStatusMeta';
import styles from './ProvidersPage.module.css';

function ProviderCardView({ card }: { readonly card: ProviderCard }) {
  const { vendor, relationship, systemNames } = card;
  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <VendorLogo vendorId={vendor.vendor_id} size={20} />
        <h3 className={styles.cardTitle}>{vendor.vendor_name}</h3>
      </div>
      <span className={styles.roleBadge}>{formatProviderRole(relationship)}</span>
      {systemNames.length > 0 ? (
        <p className={styles.cardMeta}>
          <strong>Systems:</strong> {systemNames.join(', ')}
        </p>
      ) : null}
      {relationship ? (
        <>
          <p className={styles.cardMeta}>
            <strong>Since:</strong> {relationship.known_since_year || relationship.start_year || 'Unknown'} ·{' '}
            <strong>Geography:</strong> {relationship.geography_scope || 'Unknown'}
          </p>
          <p className={styles.cardMeta}>
            <span className={styles.statusDot} style={{ background: evidenceStatusColor(relationship.evidence_status) }} />
            {humanize(relationship.current_status)} · {humanize(relationship.evidence_status)}
          </p>
          {relationship.open_questions ? <p className={styles.openQuestions}>{relationship.open_questions}</p> : null}
        </>
      ) : (
        <p className={styles.cardMeta}>{vendor.vendor_category}</p>
      )}
    </article>
  );
}

export function ProvidersPage() {
  const navigate = useNavigate();
  const sections = buildProviderSections();
  const toFindGaps = buildProviderToFindGaps();

  return (
    <div className={styles.page}>
      <DomainTabs current="providers" />
      <PageHeader
        title="Providers & Partners"
        subtitle="A curated service-ecosystem map — implementation, rollout, managed-service and operations partners, distinct from the software platforms they deliver."
      />
      <div className={styles.body}>
        {sections.map((section) => (
          <section key={section.title} className={styles.section}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            <div className={styles.grid}>
              {section.cards.map((card) => (
                <ProviderCardView key={card.vendor.vendor_id} card={card} />
              ))}
            </div>
          </section>
        ))}

        <section className={styles.section}>
          <h2 className={styles.sectionTitleGap}>TO FIND — delivery ecosystem</h2>
          <p className={styles.gapIntro}>
            Action confirms external partners supply multidisciplinary development teams for Marketing &amp; Format Technology
            (GAP-068), but no partner name is public anywhere in this list. Every row below stays a named research question — none
            is a guess.
          </p>
          <ul className={styles.gapList}>
            {toFindGaps.map((gap) => (
              <li key={gap.gap_id} className={styles.gapItem} onClick={() => navigate(`/to-find/${gap.gap_id}`)}>
                <span className={styles.gapPriority} style={{ background: priorityColor(gap.priority) }}>
                  {gap.priority}
                </span>
                <span className={styles.gapTitle}>{gap.gap_title}</span>
                <span className={styles.gapQuestion}>{gap.research_question}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
