const API_BASE_URL = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error('Failed to fetch API health status');
  return res.json();
}

export async function predictEmission(formData) {
  const res = await fetch(`${API_BASE_URL}/ml/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Error computing carbon emission prediction');
  }
  return res.json();
}

export async function simulateScenario(currentData, scenarioData) {
  const res = await fetch(`${API_BASE_URL}/ml/scenario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ current: currentData, scenario: scenarioData }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Error calculating scenario simulation');
  }
  return res.json();
}

export async function fetchMetrics() {
  const res = await fetch(`${API_BASE_URL}/ml/metrics`);
  if (!res.ok) throw new Error('Failed to load ML model metrics');
  return res.json();
}

export async function fetchFeatureImportances() {
  const res = await fetch(`${API_BASE_URL}/ml/features`);
  if (!res.ok) throw new Error('Failed to load feature importances');
  return res.json();
}

export async function askAssistant(question, context = null) {
  const res = await fetch(`${API_BASE_URL}/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, context }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Error communicating with AI Assistant');
  }
  return res.json();
}
