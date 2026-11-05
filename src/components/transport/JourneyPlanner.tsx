import { Footprints, Route, Shuffle, Zap } from 'lucide-react';
import { formatHm } from '@/lib/tfl/format';
import { JOURNEY_RANK_LABEL, type JourneyRank, type RankedJourney } from '@/lib/tfl/journey';
import type { Journey, JourneyLeg } from '@/lib/tfl/types';
import { RouteSearchCard } from '@/components/location/RouteSearchCard';
import type { JourneyPlace } from '@/lib/location/types';
import './journey.css';

const RANK_ICON: Record<JourneyRank, typeof Zap> = { fastest: Zap, 'fewest-changes': Shuffle, 'least-walking': Footprints };

const modeLabel = (leg: JourneyLeg) => {
  if (leg.mode === 'walking') return leg.durationMin <= 1 ? '1 min pieszo' : `${leg.durationMin} min pieszo`;
  if (leg.lineName) return leg.lineName.replace(/ line$/i, '');
  return leg.mode;
};

function LegStrip({ legs }: { legs: JourneyLeg[] }) {
  return (
    <ol className="jleg">
      {legs.map((leg, i) => (
        <li key={`${leg.departure}-${i}`} className={leg.mode === 'walking' ? 'is-walk' : 'is-ride'}>
          {i > 0 && <span className="jleg__dot" aria-hidden="true" />}
          {leg.mode === 'walking' ? (
            <span className="jleg__walk">
              <Footprints size={12} aria-hidden="true" /> {modeLabel(leg)}
            </span>
          ) : (
            <span className="jleg__line" style={{ background: leg.colour, color: leg.lineId === 'circle' || leg.lineId === 'hammersmith-city' || leg.lineId === 'waterloo-city' ? '#0B0B0B' : '#fff' }}>
              {modeLabel(leg)}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

function OptionCard({ item, selected, onSelect }: { item: RankedJourney; selected: boolean; onSelect: () => void }) {
  const j = item.journey;
  const rides = j.legs.filter((l) => l.mode !== 'walking');
  const primary = item.ranks[0];
  const Icon = primary ? RANK_ICON[primary] : Route;
  return (
    <button type="button" className={`jopt ${selected ? 'is-selected' : ''}`} onClick={onSelect} aria-pressed={selected}>
      <span className="jopt__head">
        {item.ranks.map((r) => (
          <span key={r} className={`jopt__rank is-${r}`}>
            <Icon size={13} aria-hidden="true" /> {JOURNEY_RANK_LABEL[r]}
          </span>
        ))}
        {!item.ranks.length && <span className="jopt__rank">Alternatywa</span>}
      </span>
      <strong className="jopt__time">{j.durationMin} min</strong>
      <span className="jopt__clock">
        {formatHm(j.departure)} → {formatHm(j.arrival)}
      </span>
      <LegStrip legs={j.legs} />
      <dl className="jopt__meta">
        <div>
          <dt>Pieszo</dt>
          <dd>{j.walkMin} min</dd>
        </div>
        <div>
          <dt>Metro</dt>
          <dd>{Math.max(0, j.durationMin - j.walkMin)} min</dd>
        </div>
        <div>
          <dt>Przesiadki</dt>
          <dd>{j.transfers}</dd>
        </div>
        {rides[0]?.from.name && (
          <div>
            <dt>Start</dt>
            <dd>{rides[0].from.name}</dd>
          </div>
        )}
      </dl>
    </button>
  );
}

function Timeline({ journey }: { journey: Journey }) {
  return (
    <ol className="jtime">
      {journey.legs.map((leg, i) => (
        <li key={`${leg.departure}-${i}`}>
          <time dateTime={leg.departure}>{formatHm(leg.departure)}</time>
          <span className="jtime__rail" style={{ background: leg.mode === 'walking' ? 'var(--border-strong)' : leg.colour }} aria-hidden="true" />
          <div>
            <strong>{leg.from.name}</strong>
            <p>
              {leg.mode === 'walking' ? (
                <>
                  {leg.durationMin} min pieszo
                  {leg.to.name ? ` do ${leg.to.name}` : ''}
                </>
              ) : (
                <>
                  {leg.lineName ?? modeLabel(leg)}
                  {leg.direction ? ` w kierunku: ${leg.direction}` : ''}
                  {leg.stopCount ? ` · ${leg.stopCount} ${leg.stopCount === 1 ? 'przystanek' : 'przystanki'}` : ''}
                  {` · ${leg.durationMin} min`}
                </>
              )}
            </p>
          </div>
        </li>
      ))}
      <li>
        <time dateTime={journey.arrival}>{formatHm(journey.arrival)}</time>
        <span className="jtime__rail jtime__rail--end" aria-hidden="true" />
        <div>
          <strong>{journey.legs.at(-1)?.to.name ?? 'Cel'}</strong>
          <p>Wyjście ze stacji</p>
        </div>
      </li>
    </ol>
  );
}

interface Props {
  from: JourneyPlace | null;
  to: JourneyPlace | null;
  resolving: boolean;
  loading: boolean;
  error: { message: string } | null;
  ranked: RankedJourney[] | null;
  selected: Journey | null;
  onSelect: (id: string) => void;
  /** Hide the search card when the page already shows one above the results. */
  showSearch?: boolean;
}

export function JourneyPlanner({ from, to, resolving, loading, error, ranked, selected, onSelect, showSearch = true }: Props) {
  return (
    <div className="jplan">
      {showSearch && <RouteSearchCard title="Dokąd chcesz jechać?" className="jplan__search" initialFrom={from?.name} initialTo={to?.name} />}
      {(resolving || loading) && (
        <p className="jplan__status" role="status">
          {resolving ? 'Szukam miejsca…' : 'Szukam połączeń TfL…'}
        </p>
      )}
      {error && !loading && (
        <p className="jplan__error" role="alert">
          {error.message}
        </p>
      )}
      {ranked && ranked.length > 0 && (
        <section className="jplan__alts" aria-label="Propozycje trasy">
          <h2>
            {ranked.length} {ranked.length === 1 ? 'propozycja trasy' : 'propozycje trasy'}
            {from && to ? <span> {from.name} → {to.name}</span> : null}
          </h2>
          <div className="jplan__cards">
            {ranked.map((item) => (
              <OptionCard key={item.journey.id} item={item} selected={selected?.id === item.journey.id} onSelect={() => onSelect(item.journey.id)} />
            ))}
          </div>
        </section>
      )}
      {selected && (
        <section className="jplan__detail" aria-labelledby="jplan-detail-h">
          <h2 id="jplan-detail-h">Szczegóły trasy</h2>
          <Timeline journey={selected} />
          <p className="jplan__note">Czas i przesiadki pochodzą z planera TfL. Pozycje pociągów na mapie to osobne, szacowane wizualizacje – nie GPS.</p>
        </section>
      )}
    </div>
  );
}
