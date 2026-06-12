const API = "http://localhost:5000/api";

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
    if (!res.ok) throw new Error(data.error || "Login failed.");
    localStorage.setItem("token", data.token);
    return { email: data.email, role: data.role, name: data.name };
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
};