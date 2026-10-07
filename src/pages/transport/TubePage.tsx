import { useState } from 'react';
import { Info } from 'lucide-react';
import { tubeLineColours, TUBE_LINE_IDS } from '@/data/tube-colors';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useLineStatus, useStationArrivals, useTubeNetwork, useVehicles } from '@/hooks/useTransport';
import { StationArrivalBoard } from '@/components/transport/Arrivals';
import { DisruptionStrip, LineStatusBar } from '@/components/transport/LineStatus';
import { StationSequence } from '@/components/transport/StationSequence';
import { Skeleton, TransportHeader } from '@/components/transport/TransportChrome';
import { TubeExplorer, useTubeExplorerState } from '@/components/transport/TubeExplorer';
import { TubeTimetable } from '@/components/transport/TubeTimetable';
import './transport.css';

const QUICK_STATIONS = [
  { id: '940GZZLUOXC', name: 'Oxford Circus' },
  { id: '940GZZLUWLO', name: 'Waterloo' },
  { id: '940GZZLUKSX', name: "King's Cross St Pancras" },
  { id: '940GZZLUVIC', name: 'Victoria' },
  { id: '940GZZLUBNK', name: 'Bank' },
  { id: '940GZZLULVT', name: 'Liverpool Street' },
];

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });

export function TubePage() {
  useDocumentTitle('Metro w Londynie na żywo – Tube');
  const net = useTubeNetwork();
  const status = useLineStatus(['tube']);
  const vehicles = useVehicles();
  const explorer = useTubeExplorerState();
  const arrivals = useStationArrivals(explorer.selectedStationId);
  const [seqLine, setSeqLine] = useState<string>('victoria');
  const [preset, setPreset] = useState<{ line: string | null; from: string | null; key: number }>({ line: null, from: null, key: 0 });
  const station = net.network && explorer.selectedStationId ? net.network.stations[explorer.selectedStationId] ?? null : null;
  const routeLine = explorer.focusLineId ?? seqLine;

  const openTimetable = (stationId: string) => {
    const st = net.network?.stations[stationId];
    const line = st?.lines.includes(routeLine) ? routeLine : st?.lines[0] ?? null;
    setPreset((p) => ({ line, from: stationId, key: p.key + 1 }));
    window.setTimeout(() => scrollTo('rozklad'), 30);
  };

  return (
    <div className="tdark tpage">
      <TransportHeader
        crumbs={[{ label: 'Transport', to: '/transport' }, { label: 'Tube' }]}
        title="Metro w Londynie na żywo"
        subtitle="Sprawdź linie, stacje, utrudnienia i najbliższe pociągi w czasie rzeczywistym."
        mode="tube"
      />

      <div className="container tpage__body">
        <LineStatusBar statuses={status.data} focusLineId={explorer.focusLineId} onFocusLine={explorer.focusLine} />
        {status.error && !status.data ? <p className="dstrip dstrip--err">Nie udało się pobrać aktualnych danych TfL. Status linii pojawi się po ponownym połączeniu.</p> : <DisruptionStrip statuses={status.data} onFocusLine={explorer.focusLine} />}

        <TubeExplorer net={net} explorer={explorer} status={status} vehicles={vehicles} arrivals={arrivals} onShowBoard={() => scrollTo('odjazdy')} onTimetable={openTimetable} />

        <section id="odjazdy" className="tsec" aria-label="Najbliższe pociągi">
          {station ? (
            <StationArrivalBoard station={station} arrivals={arrivals} statuses={status.data} />
          ) : (
            <div className="aboard aboard--pick">
              <h2 className="aboard__title">NAJBLIŻSZE POCIĄGI</h2>
              <p>Wybierz stację na mapie, w wyszukiwarce albo poniżej, aby zobaczyć przewidywane przyjazdy.</p>
              <div className="cluster">
                {QUICK_STATIONS.map((s) => (
                  <button key={s.id} type="button" className="chip tchip" onClick={() => explorer.selectStation(s.id, true)}>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="tgrid">
          <section className="tsec" aria-labelledby="przebieg-h">
            <div className="tsec__head">
              <h2 id="przebieg-h" className="tsec-title">
                Przebieg linii
              </h2>
              <label className="visually-hidden" htmlFor="seq-line">
                Linia
              </label>
              <select id="seq-line" className="select tselect" value={routeLine} onChange={(e) => (explorer.focusLineId ? explorer.focusLine(e.target.value) : setSeqLine(e.target.value))}>
                {TUBE_LINE_IDS.map((id) => (
                  <option key={id} value={id}>
                    {tubeLineColours[id].name}
                  </option>
                ))}
              </select>
            </div>
            <p className="tsec__lead">Kolejność stacji według TfL, z przesiadkami. Najedź na stację, aby podświetlić ją na mapie.</p>
            {net.network ? (
              <StationSequence
                network={net.network}
                lineId={routeLine}
                hoveredStationId={explorer.hoveredStationId}
                selectedStationId={explorer.selectedStationId}
                onHoverStation={explorer.hoverStation}
                onSelectStation={(id) => explorer.selectStation(id, true)}
              />
            ) : (
              <Skeleton lines={8} />
            )}
          </section>

          <div id="rozklad" className="tsec">
            <TubeTimetable network={net.network} initialLine={preset.line} initialFrom={preset.from} presetKey={preset.key} />
          </div>
        </div>

        <aside className="tsources">
          <Info size={16} aria-hidden="true" />
          <div>
            <p>
              <strong>Skąd są dane?</strong> Status linii, przebiegi, prognozy przyjazdów i rozkłady pochodzą z TfL Unified API (odświeżanie: status co 60 s, pociągi co 20 s).
              Komunikaty o utrudnieniach pokazujemy w oryginalnym brzmieniu TfL.
            </p>
            <p>
              Pozycje pociągów na mapie są <strong>wizualnym oszacowaniem</strong> wyliczonym z prognoz przyjazdu – TfL nie publikuje lokalizacji GPS pociągów metra.
              Powered by TfL Open Data. Contains OS data © Crown copyright and database rights 2016 and Geomni UK Map data © and database rights [2019].
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
