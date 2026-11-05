// Official TfL line identity colours (TfL Colour Standard). Shared with the server – keep imports relative.

export const TUBE_LINE_IDS = [
  'bakerloo',
  'central',
  'circle',
  'district',
  'hammersmith-city',
  'jubilee',
  'metropolitan',
  'northern',
  'piccadilly',
  'victoria',
  'waterloo-city',
] as const;

export type TubeLineId = (typeof TUBE_LINE_IDS)[number];

export interface LineIdentity {
  name: string;
  /** Polish display name where it differs ("linia Central") is built in the UI. */
  colour: string;
  /** Text colour that passes WCAG AA on `colour`. */
  ink: string;
  /** Brighter variant for glowing routes on the dark LED board. */
  glow: string;
}

export const tubeLineColours: Record<TubeLineId, LineIdentity> = {
  bakerloo: { name: 'Bakerloo', colour: '#B36305', ink: '#FFFFFF', glow: '#FF9A3D' },
  central: { name: 'Central', colour: '#E32017', ink: '#FFFFFF', glow: '#FF4A3D' },
  circle: { name: 'Circle', colour: '#FFD300', ink: '#0B0B0B', glow: '#FFE24D' },
  district: { name: 'District', colour: '#00782A', ink: '#FFFFFF', glow: '#3BD46A' },
  'hammersmith-city': { name: 'Hammersmith & City', colour: '#F3A9BB', ink: '#0B0B0B', glow: '#FFB8CB' },
  jubilee: { name: 'Jubilee', colour: '#A0A5A9', ink: '#0B0B0B', glow: '#D2D8DD' },
  metropolitan: { name: 'Metropolitan', colour: '#9B0056', ink: '#FFFFFF', glow: '#E8338F' },
  northern: { name: 'Northern', colour: '#000000', ink: '#FFFFFF', glow: '#E9EEF5' },
  piccadilly: { name: 'Piccadilly', colour: '#003688', ink: '#FFFFFF', glow: '#4D7DFF' },
  victoria: { name: 'Victoria', colour: '#0098D4', ink: '#FFFFFF', glow: '#36C2FF' },
  'waterloo-city': { name: 'Waterloo & City', colour: '#95CDBA', ink: '#0B0B0B', glow: '#A8F0D8' },
};

/** Other TfL modes shown in summaries (homepage widget, transport hub). */
export const modeColours: Record<string, string> = {
  'elizabeth-line': '#6950A1',
  dlr: '#00A4A7',
  overground: '#EE7C0E',
  'national-rail': '#1C3F94',
  liberty: '#61686B',
  lioness: '#F1B41C',
  mildmay: '#437EC1',
  suffragette: '#39B97A',
  weaver: '#823A62',
  windrush: '#ED1B00',
};

/** Line colour for display on light backgrounds (Northern's black works; on dark use `glow`). */
export function lineColour(id: string): string {
  return (tubeLineColours as Record<string, LineIdentity>)[id]?.colour ?? modeColours[id] ?? '#667085';
}

export const isTubeLineId = (id: string): id is TubeLineId => (TUBE_LINE_IDS as readonly string[]).includes(id);
