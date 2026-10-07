import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { tubeLineColours, isTubeLineId, TUBE_LINE_IDS } from '@/data/tube-colors';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLive, useLineStatus, useNow, useStationArrivals, useTubeNetwork, useVehicles } from '@/hooks/useTransport';
import { serverNow, transportApi } from '@/lib/tfl/api';
import { formatSeconds, LEVEL_LABEL, severityPl } from '@/lib/tfl/format';
import { EmptyState } from '@/components/ui/primitives';
import { StationArrivalBoard } from '@/components/transport/Arrivals';
import { DisruptionStrip, StatusIcon } from '@/components/transport/LineStatus';
import { StationSequence } from '@/components/transport/StationSequence';
import { Skeleton, TransportHeader } from '@/components/transport/TransportChrome';
import { TubeExplorer, useTubeExplorerState } from '@/components/transport/TubeExplorer';
import { TubeTimetable } from '@/components/transport/TubeTimetable';
import './transport.css';

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export function TubeLinePage() {
  const { line = '' } = useParams();
  if (!isTubeLineId(line)) {
    return (
      <div className="container section">
        <EmptyState title="Nie ma takiej linii metra" as="h1">
          <p>Wybierz jedną z linii:</p>
          <div className="cluster">
            {TUBE_LINE_IDS.map((id) => (
              <Link key={id} to={`/transport/tube/${id}`} className="chip">
                {tubeLineColours[id].name}
              </Link>
            ))}
          </div>
        </EmptyState>
      </div>
    );
  }
  return <LineView key={line} line={line} />;
}

function LineView({ line }: { line: (typeof TUBE_LINE_IDS)[number] }) {
  const c = tubeLineColours[line];
  useDocumentTitle(`${c.name} line na żywo – metro w Londynie`);
  const net = useTubeNetwork();
  const status = useLineStatus(['tube']);
  const vehicles = useVehicles();
  const explorer = useTubeExplorerState({ focusLine: line });
  const arrivals = useStationArrivals(explorer.selectedStationId, line);
  const route = useLive(`route:${line}`, (s) => transportApi.route(line, s), 0);
  const [preset, setPreset] = useState({ from: null as string | null, key: 0 });
  useNow(1000);

  const st = status.data?.find((s) => s.id === line) ?? null;
  const station = net.network && explorer.selectedStationId ? net.network.stations[explorer.selectedStationId] ?? null : null;
  const networkLine = net.network?.lines.find((l) => l.id === line);
  const trains = useMemo(() => (vehicles.data ?? []).filter((v) => v.lineId === line), [vehicles.data, line]);
  const byDirection = useMemo(() => {
    const m = new Map<string, typeof trains>();
    for (const t of trains) m.set(t.towards, [...(m.get(t.towards) ?? []), t]);
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [trains]);

  return (
    <div className="tdark tpage" style={{ '--accent': c.colour } as React.CSSProperties}>
      <TransportHeader
        crumbs={[{ label: 'Transport', to: '/transport' }, { label: 'Tube', to: '/transport/tube' }, { label: `${c.name} line` }]}
        title={`${c.name} line`}
        subtitle="Status, mapa, najbliższe pociągi, stacje i rozkład tej linii – dane TfL."
        mode="tube"
        accent={c.colour}
      >
        <div className={`lhero is-${st?.level ?? 'unknown'}`}>
          {st ? (
            <>
              <StatusIcon level={st.level} size={20} />
              <strong>{severityPl(st.statusDescription)}</strong>
              {LEVEL_LABEL[st.level] !== severityPl(st.statusDescription) && <span className="lhero__muted">({LEVEL_LABEL[st.level]})</span>}
            </>
          ) : status.error ? (
            <span>Nie udało się pobrać aktualnych danych TfL.</span>
          ) : (
            <span>Ładowanie statusu…</span>
          )}
          {vehicles.data && <span className="lhero__muted">· {trains.length} pociągów w prognozach TfL</span>}
        </div>
      </TransportHeader>

      <div className="container tpage__body">
        {st && st.level !== 'good' && <DisruptionStrip statuses={[st]} linkLines={false} />}

        <TubeExplorer compact net={net} explorer={explorer} status={status} vehicles={vehicles} arrivals={arrivals} onShowBoard={() => scrollTo('odjazdy')} onTimetable={(id) => (setPreset((p) => ({ from: id, key: p.key + 1 })), window.setTimeout(() => scrollTo('rozklad'), 30))} />

        <div className="tgrid">
          <section className="tsec" aria-labelledby="pociagi-h">
            <h2 id="pociagi-h" className="tsec-title">
              Pociągi na linii teraz
            </h2>
            <p className="tsec__lead">Według prognoz TfL. Następna stacja i czas są szacunkowe.</p>
            {!vehicles.data && <Skeleton lines={5} />}
            {vehicles.data && !trains.length && <p className="tempty">TfL nie publikuje teraz prognoz dla pociągów tej linii (np. linia nie kursuje o tej porze).</p>}
            {byDirection.map(([towards, list]) => (
              <div key={towards} className="ltrains">
                <p className="ltrains__dir">
                  W kierunku: <strong>{towards}</strong> · {list.length}
                </p>
                <ul>
                  {list
                    .slice()
                    .sort((a, b) => a.timeToStation - b.timeToStation)
                    .slice(0, 6)
                    .map((t) => {
                      const next = net.network?.stations[t.toStationId];
                      const left = Math.max(0, t.timeToStation - (serverNow() - Date.parse(t.observedAt)) / 1000);
                      return (
                        <li key={t.key}>
                          <button type="button" className="ltrains__btn" onClick={() => explorer.selectStation(t.toStationId, true)}>
                            {t.atStation ? 'Na stacji' : 'Następna'}: {next?.name ?? '—'}
                            <span>{t.atStation ? '' : formatSeconds(left)}</span>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))}
          </section>

          <section id="odjazdy" className="tsec">
            {station ? (
              <StationArrivalBoard station={station} arrivals={arrivals} statuses={status.data} lineFilter={line} />
            ) : (
              <div className="aboard aboard--pick">
                <h2 className="aboard__title">NAJBLIŻSZE POCIĄGI</h2>
                <p>Wybierz stację z listy „Stacje” lub na mapie, aby zobaczyć przyjazdy linii {c.name}.</p>
              </div>
            )}
          </section>
        </div>

        <div className="tgrid">
          <section className="tsec" aria-labelledby="stacje-h">
            <h2 id="stacje-h" className="tsec-title">
              Stacje
            </h2>
            {net.network ? (
              <StationSequence network={net.network} lineId={line} hoveredStationId={explorer.hoveredStationId} selectedStationId={explorer.selectedStationId} onHoverStation={explorer.hoverStation} onSelectStation={(id) => explorer.selectStation(id, true)} />
            ) : (
              <Skeleton lines={8} />
            )}
          </section>
          <section className="tsec" aria-labelledby="odgalezienia-h">
            <h2 id="odgalezienia-h" className="tsec-title">
              Odgałęzienia i warianty tras
            </h2>
            {networkLine && (
              <ul className="lbranches">
                {networkLine.branches.map((b) => (
                  <li key={b.name}>
                    {b.name} <span>· {b.stationIds.length} stacji</span>
                  </li>
                ))}
              </ul>
            )}
            {route.data && (
              <>
                <p className="tsec__lead">Trasy kursowania według TfL:</p>
                <ul className="lbranches lbranches--muted">
                  {route.data.sections.map((s) => (
                    <li key={`${s.originId}-${s.destinationId}-${s.direction}`}>
                      {s.origin} → {s.destination}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {!networkLine && <Skeleton lines={4} />}
          </section>
        </div>

        <div id="rozklad" className="tsec">
          <TubeTimetable network={net.network} initialLine={line} initialFrom={preset.from} presetKey={preset.key} />
        </div>

        <section className="tsec" aria-labelledby="poradniki-h">
          <h2 id="poradniki-h" className="tsec-title">
            Powiązane poradniki
          </h2>
          <ul className="tlinks">
            <li>
              <Link to="/poradnik?obszar=transport">
                Poradnik: transport w Londynie – Oyster, contactless, mandaty <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </li>
            <li>
              <a href="https://tfl.gov.uk/fares/find-fares/tube-and-rail-fares" target="_blank" rel="noreferrer">
                Ceny biletów metra (TfL) <ExternalLink size={13} aria-hidden="true" />
              </a>
            </li>
            <li>
              <a href="https://tfl.gov.uk/transport-accessibility/step-free-tube-guide" target="_blank" rel="noreferrer">
                Przewodnik po stacjach bez stopni (TfL) <ExternalLink size={13} aria-hidden="true" />
              </a>
            </li>
            <li>
              <Link to="/transport/tube">
                Wszystkie linie metra na żywo <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
