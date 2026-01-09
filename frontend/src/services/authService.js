const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const login = async (username, password) => {
  const response = await fetch(`${API_URL}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  if (response.ok) {
    localStorage.setItem("token", data.token);
    return data;
  } else {
    throw new Error(data.message);
  }
};

export const signup = async (username, password, confirmPassword) => {
  const response = await fetch(`${API_URL}/users/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, confirmPassword }),
  });

  const data = await response.json();
  if (response.ok) {
    return data;
  } else {
    throw new Error(data.message);
  }
};

export const updateStats = async (stats) => {
  const token = localStorage.getItem("token");
  if (!token) return;

  await fetch(`${API_URL}/users/stats`, {
    method: "PUT",
    headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(stats),
  });
};