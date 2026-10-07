import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Map as MapIcon } from 'lucide-react';
import { isTubeLineId } from '@/data/tube-colors';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLineStatus } from '@/hooks/useTransport';
import { severityPl } from '@/lib/tfl/format';
import type { LineStatus } from '@/lib/tfl/types';
import { DisruptionStrip, StatusIcon } from '@/components/transport/LineStatus';
import { LiveDataIndicator, Skeleton, TRANSPORT_MODES, TransportError, TransportHeader } from '@/components/transport/TransportChrome';
import './transport.css';

const MODES = ['tube', 'elizabeth-line', 'overground', 'dlr', 'national-rail'];
const MODE_TITLE: Record<string, string> = {
  tube: 'Metro (Tube)',
  'elizabeth-line': 'Elizabeth line',
  overground: 'London Overground',
  dlr: 'DLR',
  'national-rail': 'Koleje (National Rail)',
};

function ModeCard({ mode, lines }: { mode: string; lines: LineStatus[] }) {
  const sorted = [...lines].sort((a, b) => Number(a.level === 'good') - Number(b.level === 'good') || a.name.localeCompare(b.name));
  const issues = lines.filter((l) => l.level !== 'good').length;
  return (
    <section className="tmode" aria-labelledby={`mode-${mode}`}>
      <header className="tmode__head">
        <h2 id={`mode-${mode}`}>{MODE_TITLE[mode] ?? mode}</h2>
        <span className={issues ? 'tmode__issues' : 'tmode__ok'}>{issues ? `${issues} z utrudnieniami` : 'Bez zgłoszonych utrudnień'}</span>
      </header>
      <ul className="tmode__list">
        {sorted.map((l) => {
          const inner = (
            <>
              <span className="tmode__swatch" style={{ background: l.colour }} aria-hidden="true" />
              <span className="tmode__name">{l.name}</span>
              <span className={`tmode__state is-${l.level}`}>
                <StatusIcon level={l.level} size={14} /> {severityPl(l.statusDescription)}
              </span>
            </>
          );
          return <li key={l.id}>{isTubeLineId(l.id) ? <Link to={`/transport/tube/${l.id}`} className="tmode__row">{inner}</Link> : <div className="tmode__row">{inner}</div>}</li>;
        })}
      </ul>
      {mode === 'tube' && (
        <Link to="/transport/tube" className="tmode__cta">
          <MapIcon size={16} aria-hidden="true" /> Mapa i odjazdy na żywo <ArrowRight size={14} aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}

export function TransportPage() {
  useDocumentTitle('Transport w Londynie na żywo – status linii');
  const [params] = useSearchParams();
  const only = params.get('tryb');
  const status = useLineStatus(MODES);
  const active = only && MODES.includes(only) ? only : 'all';
  const shown = active === 'all' ? MODES : [active];

  return (
    <div className="tdark tpage">
      <TransportHeader
        crumbs={[{ label: 'Transport' }]}
        kicker="Londyn na żywo"
        title="Transport w Londynie na żywo"
        subtitle="Status metra, Elizabeth line, Overground, DLR i kolei – dane TfL odświeżane co minutę."
        mode={active === 'all' ? '' : active}
      />
      <div className="container tpage__body">
        <div className="thub__bar">
          <LiveDataIndicator meta={status.meta} error={status.error} loading={status.loading} onRetry={status.refresh} />
          {active !== 'all' && (
            <Link to="/transport" className="tlink">
              Pokaż wszystkie rodzaje transportu
            </Link>
          )}
        </div>
        <Link to="/transport/tube" className="thub__hero">
          <span className="thub__hero-k">Nowość</span>
          <strong>Londyn na żywo — Tube</strong>
          <span>Mapa metra z pociągami, tablice przyjazdów i rozkłady jazdy dla każdej stacji.</span>
          <ArrowRight size={20} aria-hidden="true" />
        </Link>
        {!status.data && status.loading && <Skeleton lines={8} />}
        {!status.data && status.error && <TransportError kind={status.error.kind} onRetry={status.refresh} />}
        {status.data && (
          <>
            <DisruptionStrip statuses={status.data.filter((l) => shown.includes(l.mode))} />
            <div className="thub__grid">
              {shown.map((m) => {
                const lines = status.data!.filter((l) => l.mode === m);
                return lines.length ? <ModeCard key={m} mode={m} lines={lines} /> : null;
              })}
            </div>
          </>
        )}
        <p className="tsources">
          Dostępne tryby: {TRANSPORT_MODES.map((m) => m.label).join(', ')}. Treść komunikatów pochodzi z TfL (w języku angielskim). Powered by TfL Open Data.
        </p>
      </div>
    </div>
  );
}
