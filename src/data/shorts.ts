import type { ImageName } from '@/data/images.generated';

export type ClipKind = 'relacja' | 'short';

export interface Clip {
  id: string;
  kind: ClipKind;
  title: string;
  author: string;
  image: ImageName;
  seconds: number;
}

export const RELACJE: Clip[] = [
  { id: 'rel-najem', kind: 'relacja', title: 'Co zmienia się w najmie', author: 'Redakcja', image: 'westminster-bridge', seconds: 15 },
  { id: 'rel-lot', kind: 'relacja', title: 'Lot do Polski bez dopłaty', author: 'Anna K.', image: 'plane', seconds: 12 },
  { id: 'rel-bus', kind: 'relacja', title: 'Poranek na Oxford Street', author: 'Tomasz N.', image: 'london-street', seconds: 9 },
  { id: 'rel-nhs', kind: 'relacja', title: 'Szczepienie w aptece', author: 'Redakcja', image: 'doctor', seconds: 14 },
  { id: 'rel-food', kind: 'relacja', title: 'Polski obiad w Ealing', author: 'Kasia M.', image: 'restaurant', seconds: 11 },
  { id: 'rel-festiwal', kind: 'relacja', title: 'Za kulisami festiwalu', author: 'Redakcja', image: 'festival', seconds: 18 },
];

export const SHORTY: Clip[] = [
  { id: 'sh-stacja', kind: 'short', title: '5 minut do stacji metra', author: 'Redakcja', image: 'bigben-bus', seconds: 24 },
  { id: 'sh-umowa', kind: 'short', title: 'Trzy zdania w umowie najmu', author: 'Poradnik', image: 'books', seconds: 41 },
  { id: 'sh-lot', kind: 'short', title: 'Co spakować na lot do Krakowa', author: 'Anna K.', image: 'plane', seconds: 18 },
  { id: 'sh-diesel', kind: 'short', title: 'Diesel a mała firma', author: 'Piotr W.', image: 'warehouse', seconds: 33 },
  { id: 'sh-apteka', kind: 'short', title: 'Jak umówić szczepienie', author: 'Redakcja', image: 'doctor', seconds: 27 },
  { id: 'sh-mecz', kind: 'short', title: 'Polacy na trybunach', author: 'Sport', image: 'football', seconds: 21 },
  { id: 'sh-kuchnia', kind: 'short', title: 'Niedzielny obiad w 40 sekund', author: 'Kasia M.', image: 'kitchen', seconds: 40 },
  { id: 'sh-bieg', kind: 'short', title: 'Poranny bieg wzdłuż Tamizy', author: 'Redakcja', image: 'sport-run', seconds: 16 },
];

export const ALL_CLIPS = [...RELACJE, ...SHORTY];

export function formatClipTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
