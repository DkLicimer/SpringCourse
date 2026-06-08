const BASE = "http://127.0.0.1:8000/api";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) headers["Authorization"] = `Bearer ${getToken()}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Ошибка запроса" }));
    throw new Error(err.detail || "Ошибка");
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  register: (data) => request("/auth/register", { method: "POST", body: data }),
  login: (data) => request("/auth/login", { method: "POST", body: data }),

  getComputers: () => request("/computers"),
  createComputer: (data) => request("/computers", { method: "POST", body: data, auth: true }),
  updateComputer: (id, data) => request(`/computers/${id}`, { method: "PUT", body: data, auth: true }),
  deleteComputer: (id) => request(`/computers/${id}`, { method: "DELETE", auth: true }),

  getBookings: () => request("/bookings", { auth: true }),
  createBooking: (data) => request("/bookings", { method: "POST", body: data, auth: true }),
  cancelBooking: (id) => request(`/bookings/${id}/cancel`, { method: "POST", auth: true }),
};