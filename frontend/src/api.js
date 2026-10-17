const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function request(path, options) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch {
    throw new Error(
      "Cannot reach the backend. Start FastAPI on port 8000 and try again."
    );
  }

  // 204 No Content has no body
  if (response.status === 204) {
    return null;
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      body.detail || "The backend could not complete the request."
    );
  }

  return body;
}


// ─────────────────────────────────────────────────────────────────────────────
// Demo database
// ─────────────────────────────────────────────────────────────────────────────

export function getSchema() {
  return request("/schema");
}

export function analyzeQuery(query) {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  };

  return Promise.all([
    request("/recommendations", options),
    request("/query-plan", options),
  ]);
}


// ─────────────────────────────────────────────────────────────────────────────
// Real Chinook database
// ─────────────────────────────────────────────────────────────────────────────

export function getRealSchema() {
  return request("/real-schema");
}

export function analyzeRealQuery(query) {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  };

  return Promise.all([
    request("/real-recommendations", options),
    request("/real-query-plan", options),
  ]);
}


// ─────────────────────────────────────────────────────────────────────────────
// History
// ─────────────────────────────────────────────────────────────────────────────

export function saveHistory(rec, plan) {
  return request("/history", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      rec,
      plan,
    }),
  });
}

export function fetchHistory() {
  return request("/history");
}

export function fetchHistoryEntry(id) {
  return request(`/history/${id}`);
}

export function deleteHistoryEntry(id) {
  return request(`/history/${id}`, {
    method: "DELETE",
  });
}

export function clearHistory() {
  return request("/history", {
    method: "DELETE",
  });
}


// ─────────────────────────────────────────────────────────────────────────────
// AI Tutor
// ─────────────────────────────────────────────────────────────────────────────

export function explainAnalysis(rec, plan) {
  return request("/explain", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      rec,
      plan,
    }),
  });
}

export function askFollowup(question, rec, plan) {
  return request("/explain/followup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
      rec,
      plan,
    }),
  });
}

/* SQL Workspace */

export function createWorkspace() {
  return request("/workspace", {
    method: "POST",
  });
}

export function executeWorkspaceSQL(sessionId, sql, parameters = []) {
  return request("/workspace/execute", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
      sql,
      parameters,
    }),
  });
}

export function getWorkspaceSchema(sessionId) {
  return request(`/workspace/${sessionId}/schema`);
}

export function explainWorkspaceQuery(sessionId, query) {
  return request("/workspace/query-plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
      query,
    }),
  });
}

export function deleteWorkspace(sessionId) {
  return request(`/workspace/${sessionId}`, {
    method: "DELETE",
  });
}
