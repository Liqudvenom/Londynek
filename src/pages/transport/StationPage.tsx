import { lazy, Suspense, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ExternalLink, MapPin, Route } from 'lucide-react';
import { modeColours, TUBE_LINE_IDS, tubeLineColours } from '@/data/tube-colors';
import { usePrefersReducedMotion } from '@/hooks';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLineStatus, useStationArrivals, useStationDetail, useTubeNetwork, useVehicles } from '@/hooks/useTransport';
import type { TubeStation } from '@/lib/tfl/types';
import { EmptyState } from '@/components/ui/primitives';
import { StationArrivalBoard } from '@/components/transport/Arrivals';
import { DisruptionStrip, LineBadge } from '@/components/transport/LineStatus';
import { Skeleton, TransportError, TransportHeader } from '@/components/transport/TransportChrome';
import { TubeTimetable } from '@/components/transport/TubeTimetable';
import { NearStation } from './NearStation';
import './transport.css';

const GeoTubeMap = lazy(() => import('@/components/transport/GeoTubeMap'));

const MODE_LABEL: Record<string, string> = {
  'national-rail': 'National Rail',
  'international-rail': 'Koleje międzynarodowe',
  'elizabeth-line': 'Elizabeth line',
  overground: 'London Overground',
  dlr: 'DLR',
  'cable-car': 'IFS Cloud Cable Car',
  'river-bus': 'Tramwaj wodny',
  tram: 'Tramlink',
  coach: 'Autokary',
};

export function StationPage() {
  const { stationId = '' } = useParams();
  const net = useTubeNetwork();
  const fromNetwork = net.network?.stations[stationId] ?? null;
  const detail = useStationDetail(stationId);

  if (net.network && !fromNetwork && detail.error?.kind === 'not-found') {
    return (
      <div className="container section">
        <EmptyState title="Nie znaleziono stacji" as="h1">
          <p>Nie ma stacji metra o identyfikatorze „{stationId}”. Wyszukaj stację na mapie metra.</p>
          <Link to="/transport/tube" className="btn btn--primary">
            Mapa metra na żywo
          </Link>
        </EmptyState>
      </div>
    );
  }
  if (net.network && !fromNetwork && detail.data && !detail.data.lines.length) {
    return (
      <div className="container section">
        <EmptyState title={detail.data.name} as="h1">
          <p>Ta stacja nie jest obsługiwana przez metro (Tube). Odjazdy innych przewoźników sprawdzisz na tfl.gov.uk.</p>
          <Link to="/transport" className="btn btn--primary">
            Transport w Londynie
          </Link>
        </EmptyState>
      </div>
    );
  }

  const station: TubeStation | null =
    fromNetwork ??
    (detail.data ? { id: detail.data.id, name: detail.data.name, lat: detail.data.lat, lon: detail.data.lon, lines: detail.data.lines, interchange: detail.data.lines.length > 1, zone: null, hubId: null } : null);

  if (!station) {
    return (
      <div className="tdark tpage">
        <div className="container tpage__body">
          {net.error && !detail.data ? <TransportError kind={net.error.kind} onRetry={net.retry} /> : <Skeleton lines={6} />}
        </div>
      </div>
    );
  }
  return <StationView key={station.id} station={station} detail={detail} net={net} />;
}

function StationView({ station, detail, net }: { station: TubeStation; detail: ReturnType<typeof useStationDetail>; net: ReturnType<typeof useTubeNetwork> }) {
  useDocumentTitle(`${station.name} – odjazdy metra na żywo`);
  const navigate = useNavigate();
  const status = useLineStatus(['tube']);
  const arrivals = useStationArrivals(station.id);
  const vehicles = useVehicles();
  const reducedMotion = usePrefersReducedMotion();
  const [hover, setHover] = useState<string | null>(null);
  const lineStatuses = (status.data ?? []).filter((s) => station.lines.includes(s.id));
  const visible = useMemo(() => new Set<string>(TUBE_LINE_IDS), []);
  const focus = useMemo(() => ({ kind: 'station' as const, id: station.id, nonce: 1 }), [station.id]);

  const platforms = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const p of arrivals.data ?? []) {
      if (!p.platform) continue;
      const set = m.get(p.lineId) ?? new Set<string>();
      set.add(p.platform);
      m.set(p.lineId, set);
    }
    return m;
  }, [arrivals.data]);

  return (
    <div className="tdark tpage">
      <TransportHeader crumbs={[{ label: 'Transport', to: '/transport' }, { label: 'Tube', to: '/transport/tube' }, { label: station.name }]} kicker="Stacja metra" title={station.name} mode="tube">
        <div className="shero">
          {station.lines.map((l) => (
            <Link key={l} to={`/transport/tube/${l}`} className="shero__line">
              <LineBadge id={l} />
            </Link>
          ))}
          {station.zone && <span className="shero__tag">Strefa {station.zone}</span>}
          {station.interchange && <span className="shero__tag">Przesiadka między liniami metra</span>}
        </div>
      </TransportHeader>

      <div className="container tpage__body">
        {lineStatuses.some((s) => s.level !== 'good') && <DisruptionStrip statuses={lineStatuses} />}

        <div className="tgrid tgrid--wide">
          <section id="odjazdy" className="tsec">
            <StationArrivalBoard station={station} arrivals={arrivals} statuses={status.data} perGroup={6} />
          </section>

          <div className="tstack">
            <section className="tsec" aria-labelledby="lok-h">
              <h2 id="lok-h" className="tsec-title">
                <MapPin size={18} aria-hidden="true" /> Lokalizacja
              </h2>
              <div className="smap">
                {net.network && net.index ? (
                  <Suspense fallback={<div className="tmap-loading">Ładowanie mapy…</div>}>
                    <GeoTubeMap
                      network={net.network}
                      index={net.index}
                      visibleLines={visible}
                      focusLineId={null}
                      selectedStationId={station.id}
                      hoveredStationId={hover}
                      onSelectStation={(id) => id !== station.id && navigate(`/transport/station/${id}`)}
                      onHoverStation={setHover}
                      sightings={vehicles.data}
                      reducedMotion={reducedMotion}
                      focusRequest={focus}
                    />
                  </Suspense>
                ) : (
                  <div className="tmap-loading">Ładowanie mapy…</div>
                )}
              </div>
              <p className="tsec__lead">
                <a href={`https://www.openstreetmap.org/?mlat=${station.lat}&mlon=${station.lon}#map=17/${station.lat}/${station.lon}`} target="_blank" rel="noreferrer">
                  Otwórz w OpenStreetMap <ExternalLink size={12} aria-hidden="true" />
                </a>{' '}
                ·{' '}
                <a href={`https://tfl.gov.uk/plan-a-journey/?to=${encodeURIComponent(station.name)}`} target="_blank" rel="noreferrer">
                  <Route size={12} aria-hidden="true" /> Zaplanuj trasę w TfL <ExternalLink size={12} aria-hidden="true" />
                </a>
              </p>
            </section>

            <section className="tsec" aria-labelledby="perony-h">
              <h2 id="perony-h" className="tsec-title">
                Linie i perony
              </h2>
              <ul className="splat">
                {station.lines.map((l) => (
                  <li key={l}>
                    <LineBadge id={l} small />
                    <span>{platforms.get(l)?.size ? [...platforms.get(l)!].sort().join(' · ') : arrivals.data ? 'Brak bieżących prognoz' : '…'}</span>
                  </li>
                ))}
              </ul>
              {detail.data && detail.data.otherModes.length > 0 && (
                <>
                  <h3 className="tsub">Inne przesiadki w węźle</h3>
                  <ul className="smodes">
                    {detail.data.otherModes.map((m) => (
                      <li key={m}>
                        <span className="smodes__dot" style={{ background: modeColours[m] ?? '#667085' }} aria-hidden="true" />
                        {MODE_LABEL[m] ?? m}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            <section className="tsec" aria-labelledby="udog-h">
              <h2 id="udog-h" className="tsec-title">
                Udogodnienia i dostępność
              </h2>
              {!detail.data && detail.loading && <Skeleton lines={3} />}
              {detail.error && !detail.data && <TransportError kind={detail.error.kind} onRetry={detail.refresh} compact />}
              {detail.data && (
                <>
                  <p className="saccess">
                    Dostęp windą (TfL): <strong>{detail.data.liftAccess === null ? 'brak danych' : detail.data.liftAccess ? 'tak' : 'nie'}</strong>
                  </p>
                  {detail.data.facilities.length ? (
                    <dl className="sfac">
                      {detail.data.facilities.map((f) => (
                        <div key={f.label}>
                          <dt>{f.label}</dt>
                          <dd>{f.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="tsec__lead">TfL nie podaje szczegółowych udogodnień dla tej stacji.</p>
                  )}
                  <p className="tsec__lead">Przed podróżą sprawdź aktualny stan wind i schodów ruchomych na tfl.gov.uk.</p>
                </>
              )}
            </section>
          </div>
        </div>

        <div id="rozklad" className="tsec">
          <TubeTimetable network={net.network} initialLine={station.lines[0] ?? null} initialFrom={station.id} presetKey={1} />
        </div>

        <NearStation lat={station.lat} lon={station.lon} stationName={station.name} />

        <p className="tsources">
          Linie na stacji:{' '}
          {station.lines.map((l, i) => (
            <span key={l}>
              {i > 0 && ', '}
              <Link to={`/transport/tube/${l}`}>{tubeLineColours[l as keyof typeof tubeLineColours]?.name ?? l} line</Link>
            </span>
          ))}
          . Dane: TfL Unified API. Powered by TfL Open Data.
        </p>
      </div>
    </div>
  );
}
