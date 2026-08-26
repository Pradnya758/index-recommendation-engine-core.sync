const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function request(path, options) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch {
    throw new Error("Cannot reach the backend. Start FastAPI on port 8000 and try again.");
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.detail || "The backend could not complete the request.");
  }
  return body;
}

export function getSchema() {
  return request("/schema");
}

export function analyzeQuery(query) {
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  };
  return Promise.all([request("/recommendations", options), request("/query-plan", options)]);
}
