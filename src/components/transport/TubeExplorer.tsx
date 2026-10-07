import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { Activity, Layers, MapPin } from 'lucide-react';
import { TUBE_LINE_IDS } from '@/data/tube-colors';
import { Sheet } from '@/components/ui/Sheet';
import { useMediaQuery, usePrefersReducedMotion } from '@/hooks';
import type { LiveState, NetworkState } from '@/hooks/useTransport';
import type { LineStatus, TrainPrediction, TrainSighting } from '@/lib/tfl/types';
import { StationPanel } from './Arrivals';
import { LineFilterPanel } from './LineFilterPanel';
import { DisruptionStrip, StatusOverlay } from './LineStatus';
import type { FocusRequest } from './mapShared';
import { LiveDataIndicator, TransportError } from './TransportChrome';

const GeoTubeMap = lazy(() => import('./GeoTubeMap'));
const LedTubeMap = lazy(() => import('./LedTubeMap'));

export type MapMode = 'geo' | 'led';

/** Shared explorer state: visible lines, isolated line, selected/hovered station, camera requests. */
export function useTubeExplorerState(initial: { focusLine?: string | null; station?: string | null } = {}) {
  const [visible, setVisible] = useState<ReadonlySet<string>>(() => new Set(TUBE_LINE_IDS));
  const [focusLineId, setFocusLineId] = useState<string | null>(initial.focusLine ?? null);
  const [selectedStationId, setSelected] = useState<string | null>(initial.station ?? null);
  const [hoveredStationId, setHovered] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(() =>
    initial.focusLine ? { kind: 'line', id: initial.focusLine, nonce: 1 } : initial.station ? { kind: 'station', id: initial.station, nonce: 1 } : null,
  );
  const request = (kind: FocusRequest['kind'], id: string) => setFocusRequest((r) => ({ kind, id, nonce: (r?.nonce ?? 0) + 1 }));

  return {
    visible,
    focusLineId,
    selectedStationId,
    hoveredStationId,
    focusRequest,
    toggleLine: useCallback((id: string) => setVisible((v) => {
      const n = new Set(v);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    }), []),
    showAll: useCallback(() => setVisible(new Set(TUBE_LINE_IDS)), []),
    hideAll: useCallback(() => {
      setVisible(new Set());
      setFocusLineId(null);
    }, []),
    /** Isolates a line (null = all lines), making sure it is visible, and fits the camera to it. */
    focusLine: useCallback((id: string | null) => {
      setFocusLineId(id);
      if (id) {
        setVisible((v) => (v.has(id) ? v : new Set([...v, id])));
        request('line', id);
      } else request('all', '');
    }, []),
    /** Selects a station; `zoom` also moves the camera (search results). */
    selectStation: useCallback((id: string | null, zoom = false) => {
      setSelected(id);
      if (id && zoom) request('station', id);
    }, []),
    hoverStation: setHovered,
  };
}

export type TubeExplorerState = ReturnType<typeof useTubeExplorerState>;

interface Props {
  net: NetworkState;
  explorer: TubeExplorerState;
  status: LiveState<LineStatus[]>;
  vehicles: LiveState<TrainSighting[]>;
  arrivals: LiveState<TrainPrediction[]>;
  onShowBoard: () => void;
  onTimetable: (stationId: string) => void;
  /** Hide the left lines panel (line page uses its own context) */
  compact?: boolean;
}

export function TubeExplorer({ net, explorer, status, vehicles, arrivals, onShowBoard, onTimetable, compact }: Props) {
  const [mode, setMode] = useState<MapMode>('geo');
  const [sheet, setSheet] = useState<'lines' | 'station' | 'status' | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const mobile = useMediaQuery('(max-width: 899px)');
  const { network, index } = net;
  const station = network && explorer.selectedStationId ? network.stations[explorer.selectedStationId] ?? null : null;

  const trainCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of vehicles.data ?? []) m.set(v.lineId, (m.get(v.lineId) ?? 0) + 1);
    return m;
  }, [vehicles.data]);

  const select = (id: string) => {
    explorer.selectStation(id);
    if (mobile) setSheet('station');
  };
  const fromSearch = (id: string) => {
    explorer.selectStation(id, true);
    setSheet(mobile ? 'station' : null);
  };
  const fromSearchLine = (id: string | null) => {
    explorer.focusLine(id);
    if (mobile) setSheet(null);
  };

  const panel = (
    <LineFilterPanel
      network={network}
      statuses={status.data}
      visibleLines={explorer.visible}
      focusLineId={explorer.focusLineId}
      trainCounts={trainCounts}
      onToggle={explorer.toggleLine}
      onShowAll={explorer.showAll}
      onHideAll={explorer.hideAll}
      onFocusLine={fromSearchLine}
      onStation={fromSearch}
    />
  );
  const stationPanel = station && (
    <StationPanel
      station={station}
      arrivals={arrivals}
      statuses={status.data}
      onClose={() => (explorer.selectStation(null), setSheet(null))}
      onBoard={() => (setSheet(null), onShowBoard())}
      onTimetable={(id) => (setSheet(null), onTimetable(id))}
      onFocusLine={(id) => explorer.focusLine(id)}
    />
  );

  const MapCmp = mode === 'geo' ? GeoTubeMap : LedTubeMap;

  return (
    <div className={`texplorer${compact ? ' texplorer--compact' : ''}${station ? ' has-station' : ''}`}>
      {!compact && !mobile && <aside className="texplorer__lines">{panel}</aside>}

      <div className={`texplorer__map is-${mode}`}>
        <div className="tmap-mode segmented" role="group" aria-label="Rodzaj mapy">
          <button type="button" aria-pressed={mode === 'geo'} onClick={() => setMode('geo')}>
            Mapa Londynu
          </button>
          <button type="button" aria-pressed={mode === 'led'} onClick={() => setMode('led')}>
            Mapa LED
          </button>
        </div>
        {!mobile && <StatusOverlay statuses={status.data} fetchedAt={status.meta?.fetchedAt ?? null} />}

        {network && index ? (
          <Suspense fallback={<div className="tmap-loading">Ładowanie mapy…</div>}>
            <MapCmp
              key={mode}
              network={network}
              index={index}
              visibleLines={explorer.visible}
              focusLineId={explorer.focusLineId}
              selectedStationId={explorer.selectedStationId}
              hoveredStationId={explorer.hoveredStationId}
              onSelectStation={select}
              onHoverStation={explorer.hoverStation}
              sightings={vehicles.data}
              reducedMotion={reducedMotion}
              focusRequest={explorer.focusRequest}
            />
          </Suspense>
        ) : net.error ? (
          <div className="tmap-loading">
            <TransportError kind={net.error.kind} onRetry={net.retry} />
          </div>
        ) : (
          <div className="tmap-loading" role="status">
            <span className="tmap-loading__spinner" aria-hidden="true" />
            Ładowanie sieci metra z TfL…
          </div>
        )}

        {explorer.visible.size === 0 && network && (
          <div className="tmap-empty">
            <p>Wszystkie linie są ukryte.</p>
            <button type="button" className="btn btn--sm tbtn" onClick={explorer.showAll}>
              Pokaż wszystkie
            </button>
          </div>
        )}

        <div className="tmap-foot">
          <LiveDataIndicator meta={vehicles.meta} error={vehicles.error} loading={vehicles.loading} onRetry={vehicles.refresh} />
          <p className="tmap-disclaimer">Pociągi: wizualne oszacowanie pozycji na podstawie prognoz TfL – nie GPS.</p>
        </div>

        {mobile && (
          <div className="tmap-fab" role="group" aria-label="Panele mapy">
            {!compact && (
              <button type="button" className="tmap-fab__btn" onClick={() => setSheet('lines')}>
                <Layers size={16} aria-hidden="true" /> Linie
              </button>
            )}
            <button type="button" className="tmap-fab__btn" onClick={() => setSheet('station')} disabled={!station}>
              <MapPin size={16} aria-hidden="true" /> Stacja
            </button>
            <button type="button" className="tmap-fab__btn" onClick={() => setSheet('status')}>
              <Activity size={16} aria-hidden="true" /> Status
            </button>
          </div>
        )}
      </div>

      {!mobile && station && <aside className="texplorer__station">{stationPanel}</aside>}

      {mobile && (
        <>
          <Sheet open={sheet === 'lines'} onClose={() => setSheet(null)} title="Linie i wyszukiwanie" side="bottom">
            <div className="tdark tsheet">{panel}</div>
          </Sheet>
          <Sheet open={sheet === 'station' && !!station} onClose={() => setSheet(null)} title={station?.name ?? 'Stacja'} side="bottom">
            <div className="tdark tsheet">{stationPanel}</div>
          </Sheet>
          <Sheet open={sheet === 'status'} onClose={() => setSheet(null)} title="Status metra" side="bottom">
            <div className="tdark tsheet">
              <StatusOverlay statuses={status.data} fetchedAt={status.meta?.fetchedAt ?? null} />
              <DisruptionStrip statuses={status.data} onFocusLine={(id) => (explorer.focusLine(id), setSheet(null))} />
            </div>
          </Sheet>
        </>
      )}
    </div>
  );
}
