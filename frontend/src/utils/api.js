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
    if (params.page != null) query.set("page", params.page);
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

// ─── Predictions ─────────────────────────────────────
export const predictions = {
  generate: (data) =>
    request("/predictions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  models: () => request("/predictions/models"),
};

// ─── Categorization ──────────────────────────────────
export const categorization = {
  predict: (data) =>
    request("/categorization/predict", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  bulk: (data) =>
    request("/categorization/bulk", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  train: () =>
    request("/categorization/train", { method: "POST" }),
};

// ─── Anomalies ───────────────────────────────────────
export const anomalies = {
  scan: () => request("/anomalies/scan", { method: "POST" }),
  list: () => request("/anomalies"),
  acknowledge: (id) =>
    request(`/anomalies/${id}/acknowledge`, { method: "PUT" }),
};

// ─── Chat ────────────────────────────────────────────
export const chat = {
  createSession: () =>
    request("/chat/sessions", { method: "POST" }),
  sessions: () => request("/chat/sessions"),
  messages: (sessionId) => request(`/chat/sessions/${sessionId}/messages`),
  send: (sessionId, message) =>
    request(`/chat/sessions/${sessionId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  deleteSession: (sessionId) =>
    request(`/chat/sessions/${sessionId}`, { method: "DELETE" }),
};

// ─── Investments ─────────────────────────────────────
export const investments = {
  portfolio: () => request("/investments/portfolio"),
  list: () => request("/investments"),
  create: (data) =>
    request("/investments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    request(`/investments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    request(`/investments/${id}`, { method: "DELETE" }),
  snapshot: () =>
    request("/investments/snapshot", { method: "POST" }),
  performance: (params = {}) => {
    const query = new URLSearchParams();
    if (params.days) query.set("days", params.days);
    return request(`/investments/performance?${query.toString()}`);
  },
};

// ─── Notifications ───────────────────────────────────
export const notifications = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.unread_only) query.set("unread_only", "true");
    return request(`/notifications?${query.toString()}`);
  },
  markRead: (id) =>
    request(`/notifications/${id}/read`, { method: "PUT" }),
  markAllRead: () =>
    request("/notifications/read-all", { method: "PUT" }),
  delete: (id) =>
    request(`/notifications/${id}`, { method: "DELETE" }),
  rules: () => request("/notifications/rules"),
  createRule: (data) =>
    request("/notifications/rules", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteRule: (id) =>
    request(`/notifications/rules/${id}`, { method: "DELETE" }),
  evaluate: () =>
    request("/notifications/evaluate", { method: "POST" }),
};

// ─── Collaborative Budgets ───────────────────────────
export const collaborative = {
  list: () => request("/shared-budgets"),
  create: (data) =>
    request("/shared-budgets", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  detail: (id) => request(`/shared-budgets/${id}`),
  join: (inviteCode) =>
    request("/shared-budgets/join", {
      method: "POST",
      body: JSON.stringify({ invite_code: inviteCode }),
    }),
  contribute: (id, data) =>
    request(`/shared-budgets/${id}/contributions`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  leave: (id) =>
    request(`/shared-budgets/${id}/leave`, { method: "DELETE" }),
  delete: (id) =>
    request(`/shared-budgets/${id}`, { method: "DELETE" }),
};

// ─── Recommendations ─────────────────────────────────
export const recommendations = {
  generate: () =>
    request("/recommendations/generate", { method: "POST" }),
  list: () => request("/recommendations"),
  action: (id, action) =>
    request(`/recommendations/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: action }),
    }),
};

// ─── Goals ───────────────────────────────────────────
export const goals = {
  list: () => request("/goals"),
  create: (data) =>
    request("/goals", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    request(`/goals/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    request(`/goals/${id}`, { method: "DELETE" }),
  contribute: (id, amount) =>
    request(`/goals/${id}/contribute`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),
};

// ─── Feed ────────────────────────────────────────────
export const feed = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", params.limit);
    if (params.offset) query.set("offset", params.offset);
    return request(`/feed?${query.toString()}`);
  },
  dismiss: (id) =>
    request(`/feed/${id}/dismiss`, { method: "PUT" }),
};
