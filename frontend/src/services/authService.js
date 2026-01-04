const API_URL = "http://localhost:3000/users"; 

export const login = async (username, password) => {
  const response = await fetch(`${API_URL}/login`, {
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
  const response = await fetch(`${API_URL}/`, {
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

// --- NEW FUNCTION ADDED HERE ---
export const getUserProfile = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
      throw new Error("No authentication token found");
  }

  const response = await fetch(`${API_URL}/me`, {
    method: "GET",
    headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    },
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

  await fetch(`${API_URL}/stats`, {
    method: "PUT",
    headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(stats),
  });
};