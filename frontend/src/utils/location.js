const HEADERS = {
  'Accept-Language': 'en',
  'User-Agent': 'peer-service-marketplace/1.0',
};

export async function searchCities(query) {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: '7',
  });
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    { headers: HEADERS }
  );
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = await res.json();

  const seen = new Set();
  return data
    .filter(r =>
      r.class === 'place' ||
      r.addresstype === 'city' ||
      r.addresstype === 'town' ||
      r.addresstype === 'village' ||
      r.addresstype === 'municipality'
    )
    .map(r => ({
      short: buildShortName(r),
      full: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    }))
    .filter(r => {
      if (seen.has(r.short)) return false;
      seen.add(r.short);
      return true;
    })
    .slice(0, 5);
}

export async function searchAddresses(query) {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: '6',
    countrycodes: 'us',
  });
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    { headers: HEADERS }
  );
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = await res.json();
  return data.map(r => ({
    label: r.display_name,
    short: r.display_name.split(',').slice(0, 3).join(',').trim(),
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  })).slice(0, 5);
}

export async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: HEADERS }
  );
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = await res.json();
  const a = data.address || {};
  const city = a.city || a.town || a.village || a.county || '';
  const state = a.state || '';
  return city && state ? `${city}, ${state}` : city || state || '';
}

function buildShortName(r) {
  const a = r.address || {};
  const city = a.city || a.town || a.village || a.municipality || a.county || '';
  const region = a.state || a.region || '';
  const country = a.country || '';
  const parts = [city, region, country].filter(Boolean);
  if (parts.length === 0) return r.display_name.split(',').slice(0, 2).join(',').trim();
  if (parts.length >= 3 && (a.country_code === 'us' || a.country_code === 'ca')) {
    return `${parts[0]}, ${parts[1]}`;
  }
  return parts.slice(0, 2).join(', ');
}
