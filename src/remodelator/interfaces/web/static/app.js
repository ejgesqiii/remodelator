const state = {
  userId: localStorage.getItem("remodelator_user_id") || null,
  selectedEstimateId: null,
};

const logEl = document.getElementById("log-output");
const sessionPill = document.getElementById("session-pill");
const estimateListEl = document.getElementById("estimate-list");
const estimatePreviewEl = document.getElementById("estimate-preview");
const adminOutputEl = document.getElementById("admin-output");

function setSession(userId) {
  state.userId = userId;
  if (userId) {
    localStorage.setItem("remodelator_user_id", userId);
    sessionPill.textContent = `Session: ${userId.slice(0, 8)}...`;
  } else {
    localStorage.removeItem("remodelator_user_id");
    sessionPill.textContent = "No user session";
  }
}

function log(title, payload) {
  const line = `\n[${new Date().toLocaleTimeString()}] ${title}\n${JSON.stringify(payload, null, 2)}\n`;
  logEl.textContent = line + logEl.textContent;
}

async function api(path, opts = {}) {
  const headers = { "content-type": "application/json", ...(opts.headers || {}) };
  if (state.userId) headers["x-user-id"] = state.userId;

  const response = await fetch(path, { ...opts, headers });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || JSON.stringify(data));
  }
  return data;
}

async function refreshEstimates() {
  if (!state.userId) {
    estimateListEl.innerHTML = "";
    estimatePreviewEl.textContent = "No estimate selected.";
    return;
  }

  const estimates = await api("/estimates", { method: "GET" });
  estimateListEl.innerHTML = "";
  estimates.forEach((est) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.textContent = `${est.title} (${est.status})`;
    btn.onclick = async () => {
      state.selectedEstimateId = est.id;
      const full = await api(`/estimates/${est.id}`, { method: "GET" });
      estimatePreviewEl.textContent = JSON.stringify(full, null, 2);
      log("Estimate selected", full);
    };
    li.appendChild(btn);
    estimateListEl.appendChild(li);
  });
}

document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    await api("/db/migrate", { method: "POST", body: "{}" });
    await api("/db/seed", { method: "POST", body: "{}" });
    const result = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: fd.get("email"),
        password: fd.get("password"),
        full_name: fd.get("full_name") || "",
      }),
    });
    setSession(result.user_id);
    log("Registered", result);
    await refreshEstimates();
  } catch (err) {
    log("Register error", { message: err.message });
  }
});

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const result = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
    });
    setSession(result.user_id);
    log("Logged in", result);
    await refreshEstimates();
  } catch (err) {
    log("Login error", { message: err.message });
  }
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  setSession(null);
  state.selectedEstimateId = null;
  await refreshEstimates();
  log("Logged out", { status: "ok" });
});

document.getElementById("estimate-create-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!state.userId) return log("Create estimate", { message: "Login required" });

  const fd = new FormData(e.target);
  try {
    const result = await api("/estimates", {
      method: "POST",
      body: JSON.stringify({
        title: fd.get("title"),
        customer_name: fd.get("customer_name") || "",
      }),
    });
    state.selectedEstimateId = result.id;
    log("Estimate created", result);
    await refreshEstimates();
  } catch (err) {
    log("Estimate create error", { message: err.message });
  }
});

document.getElementById("line-item-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!state.selectedEstimateId) return log("Add line item", { message: "Select estimate first" });

  const fd = new FormData(e.target);
  try {
    const result = await api(`/estimates/${state.selectedEstimateId}/line-items`, {
      method: "POST",
      body: JSON.stringify({
        item_name: fd.get("item_name"),
        quantity: String(fd.get("quantity") || "1"),
        unit_price: String(fd.get("unit_price") || "0"),
      }),
    });
    log("Line item added", result);
    const full = await api(`/estimates/${state.selectedEstimateId}`, { method: "GET" });
    estimatePreviewEl.textContent = JSON.stringify(full, null, 2);
  } catch (err) {
    log("Line item error", { message: err.message });
  }
});

document.getElementById("recalc-btn").addEventListener("click", async () => {
  if (!state.selectedEstimateId) return log("Recalc", { message: "Select estimate first" });
  try {
    const result = await api(`/estimates/${state.selectedEstimateId}/recalc`, { method: "POST", body: "{}" });
    estimatePreviewEl.textContent = JSON.stringify(result, null, 2);
    log("Recalculated", result);
  } catch (err) {
    log("Recalc error", { message: err.message });
  }
});

document.getElementById("proposal-btn").addEventListener("click", async () => {
  if (!state.selectedEstimateId) return log("Proposal", { message: "Select estimate first" });
  try {
    const result = await api(`/proposals/${state.selectedEstimateId}/render`, { method: "GET" });
    log("Proposal rendered", result);
  } catch (err) {
    log("Proposal error", { message: err.message });
  }
});

document.getElementById("billing-btn").addEventListener("click", async () => {
  if (!state.selectedEstimateId) return log("Billing", { message: "Select estimate first" });
  try {
    const idempotencyKey = document.getElementById("idempotency-input").value || null;
    const result = await api(`/billing/simulate-estimate-charge`, {
      method: "POST",
      body: JSON.stringify({ estimate_id: state.selectedEstimateId, idempotency_key: idempotencyKey }),
    });
    log("Billing simulated", result);
  } catch (err) {
    log("Billing error", { message: err.message });
  }
});

async function runAdmin(path) {
  try {
    const key = document.getElementById("admin-key-input").value || "local-admin-key";
    const response = await fetch(path, { headers: { "x-admin-key": key } });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.detail || JSON.stringify(payload));
    adminOutputEl.textContent = JSON.stringify(payload, null, 2);
    log(`Admin ${path}`, payload);
  } catch (err) {
    adminOutputEl.textContent = `Error: ${err.message}`;
    log("Admin error", { message: err.message });
  }
}

document.getElementById("admin-summary-btn").addEventListener("click", () => runAdmin("/admin/summary"));
document.getElementById("admin-users-btn").addEventListener("click", () => runAdmin("/admin/users?limit=50"));
document.getElementById("admin-activity-btn").addEventListener("click", () => runAdmin("/admin/activity?limit=50"));
document.getElementById("admin-billing-btn").addEventListener("click", () => runAdmin("/admin/billing-ledger?limit=50"));
document.getElementById("admin-reset-btn").addEventListener("click", async () => {
  try {
    const key = document.getElementById("admin-key-input").value || "local-admin-key";
    const response = await fetch("/admin/demo-reset", { method: "POST", headers: { "x-admin-key": key } });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.detail || JSON.stringify(payload));
    adminOutputEl.textContent = JSON.stringify(payload, null, 2);
    log("Admin demo reset", payload);
    state.selectedEstimateId = null;
    estimatePreviewEl.textContent = "No estimate selected.";
    await refreshEstimates();
  } catch (err) {
    adminOutputEl.textContent = `Error: ${err.message}`;
    log("Admin reset error", { message: err.message });
  }
});

setSession(state.userId);
refreshEstimates().catch((err) => log("Init error", { message: err.message }));
