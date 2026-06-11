export const AuthService = {
  login: async (email, password) => {
    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to authenticate with server.");
      }

      localStorage.setItem("token", data.token);

      return {
        email: email, 
        role: data.role, 
        name: email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1)
      };
      
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
  },

  hasAccess: (currentRole, requiredRole) => {
    const weights = { member: 1, hr: 2, admin: 3 };
    return weights[currentRole] >= weights[requiredRole];
  }
};