const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const AuthService = {

  register: async ({ name, email, password, domain }) => {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, domain }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed.");
    return data;
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
    return { email: data.email, role: data.role, name: data.name };
  },

  resendVerification: async (email) => {
    const res = await fetch(`${API}/auth/resend-verification`, {
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

  logout: () => localStorage.removeItem("token"),
  getToken: () => localStorage.getItem("token"),

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