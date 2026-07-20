const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export { API };

const SESSION_KEY = "session";

export const AuthService = {

  signup: async ({ email, passcode, password }) => {
    const res = await fetch(`${API}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, passcode, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Account creation failed.");
    localStorage.setItem("token", data.token);
    const session = { email: data.email, role: data.role, name: data.name };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  login: async (email, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || "Login failed.");
      err.code  = data.code;
      err.email = data.email;
      throw err;
    }
    localStorage.setItem("token", data.token);
    const session = { email: data.email, role: data.role, name: data.name };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  resendPasscode: async (email) => {
    const res = await fetch(`${API}/auth/resend-passcode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to resend.");
    return data;
  },

  forgotPassword: async (email) => {
    const res = await fetch(`${API}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed.");
    return data;
  },

  resetPassword: async (token, password) => {
    const res = await fetch(`${API}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Reset failed.");
    return data;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem(SESSION_KEY);
  },

  getToken: () => localStorage.getItem("token"),

  getCurrentUserId: () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const payload = token.split(".")[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
      return decoded.id || null;
    } catch {
      return null;
    }
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const res = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        localStorage.removeItem("token");
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      const data = await res.json();
      const session = { email: data.email, role: data.role, name: data.name, domain: data.domain, batch: data.batch };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return session;
    } catch {
      const cached = localStorage.getItem(SESSION_KEY);
      return cached ? JSON.parse(cached) : null;
    }
  },

  apiFetch: async (path, options = {}) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed.");
    return data;
  },

  hasAccess: (currentRole, requiredRole) => {
    const weights = { intern: 1, hr: 2, admin: 3 };
    return weights[currentRole] >= weights[requiredRole];
  },

  getApiBase: () => API,
};