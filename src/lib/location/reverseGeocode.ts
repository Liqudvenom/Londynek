import type { LocationResult } from './types';

/** Coordinates → nearest postcode and district (server proxies the provider). */
export async function reverseGeocode(lat: number, lng: number, signal?: AbortSignal): Promise<LocationResult | null> {
  const res = await fetch(`/api/location/reverse?${new URLSearchParams({ lat: String(lat), lng: String(lng) })}`, { signal, headers: { Accept: 'application/json' } });
  const body = (await res.json().catch(() => null)) as { data?: LocationResult | null; error?: { message: string } } | null;
  if (!res.ok || !body || body.error) throw new Error(body?.error?.message ?? 'Nie udało się ustalić adresu.');
  return body.data ?? null;
}

/** Browser geolocation as a promise. Rejects with a Polish message the UI can show. */
export function currentPosition(timeoutMs = 10000): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('Twoja przeglądarka nie udostępnia lokalizacji.'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => reject(new Error(e.code === e.PERMISSION_DENIED ? 'Brak zgody na udostępnienie lokalizacji.' : 'Nie udało się ustalić Twojej lokalizacji.')),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 120000 },
    );
  });
}
