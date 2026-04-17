const BASE = import.meta.env.VITE_API_BASE || "/api";

export function getToken() {
  return localStorage.getItem("token");
}

export function saveToken(token) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

export function apiFetch(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  return fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}

export function releaseEscrow(bookingId) {
  return apiFetch("/payments/release-escrow/", {
    method: "POST",
    body: JSON.stringify({ booking_id: bookingId }),
  });
}

export function refundBooking(bookingId) {
  return apiFetch("/payments/refund-booking/", {
    method: "POST",
    body: JSON.stringify({ booking_id: bookingId }),
  });
}

export function parseApiError(data, fallback = "Something went wrong.") {
  return data.detail || data.error || fallback;
}
