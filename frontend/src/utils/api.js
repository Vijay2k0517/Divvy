const BASE_URL = "http://localhost:8000/api";

function getToken() {
  return localStorage.getItem("divvy_token");
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem("divvy_token");
    localStorage.removeItem("divvy_user");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ detail: "Something went wrong" }));
    throw new Error(err.detail || "Request failed");
  }

  return res.json();
}

// ─── Auth ────────────────────────────────────────────
export const auth = {
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  signup: (name, email, password) =>
    request("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  me: () => request("/auth/me"),

  logout: () => request("/auth/logout", { method: "POST" }).catch(() => {}),
};

// ─── Dashboard ───────────────────────────────────────
export const dashboard = {
  stats: () => request("/dashboard/stats"),
  monthlySpending: () => request("/dashboard/monthly-spending"),
  categoryDistribution: () => request("/dashboard/category-distribution"),
  weeklyComparison: () => request("/dashboard/weekly-comparison"),
  aiInsights: () => request("/dashboard/ai-insights"),
  recentTransactions: () => request("/dashboard/recent-transactions"),
};

// ─── Transactions ────────────────────────────────────
export const transactions = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.category && params.category !== "All")
      query.set("category", params.category);
    if (params.skip != null) query.set("skip", params.skip);
    if (params.limit != null) query.set("limit", params.limit);
    return request(`/transactions?${query.toString()}`);
  },

  create: (data) =>
    request("/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id) => request(`/transactions/${id}`, { method: "DELETE" }),

  categories: () => request("/transactions/categories"),
};

// ─── Analytics ───────────────────────────────────────
export const analytics = {
  monthly: () => request("/analytics/monthly"),
  heatmap: () => request("/analytics/heatmap"),
  predictions: () => request("/analytics/predictions"),
  quickStats: () => request("/analytics/quick-stats"),
};

// ─── Insights ────────────────────────────────────────
export const insights = {
  list: () => request("/insights"),
  healthScore: () => request("/insights/health-score"),
};

// ─── Budgets ─────────────────────────────────────────
export const budgets = {
  list: () => request("/budgets"),

  create: (data) =>
    request("/budgets", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/budgets/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id) => request(`/budgets/${id}`, { method: "DELETE" }),
};

// ─── User ────────────────────────────────────────────
export const user = {
  profile: () => request("/user/profile"),

  updateProfile: (data) =>
    request("/user/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  changePassword: (current_password, new_password) =>
    request("/user/password", {
      method: "PUT",
      body: JSON.stringify({ current_password, new_password }),
    }),
};
