const RAW_API_URL = import.meta.env.VITE_API_URL || '';
const BASE_URL = RAW_API_URL.endsWith('/') ? RAW_API_URL.slice(0, -1) : RAW_API_URL;
const API_BASE_URL = `${BASE_URL}/api`;

const DEFAULT_ERROR_MSG = 'Unable to connect to the CarbonWise service. Please try again in a moment.';

function formatErrorMessage(detail) {
  if (typeof detail === 'string' && detail.trim()) {
    if (detail.includes('127.0.0.1') || detail.includes('localhost') || detail.includes('ECONNREFUSED') || detail.includes('Traceback')) {
      return DEFAULT_ERROR_MSG;
    }
    return detail;
  }
  return DEFAULT_ERROR_MSG;
}

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error(DEFAULT_ERROR_MSG);
    return await res.json();
  } catch (err) {
    throw new Error(DEFAULT_ERROR_MSG);
  }
}

export async function predictEmission(formData) {
  try {
    const res = await fetch(`${API_BASE_URL}/ml/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(formatErrorMessage(err.detail));
    }
    return await res.json();
  } catch (err) {
    if (err.message && !err.message.includes('fetch') && err.message !== 'Failed to fetch') {
      throw err;
    }
    throw new Error(DEFAULT_ERROR_MSG);
  }
}

export async function simulateScenario(currentData, scenarioData) {
  try {
    const res = await fetch(`${API_BASE_URL}/ml/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current: currentData, scenario: scenarioData }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(formatErrorMessage(err.detail));
    }
    return await res.json();
  } catch (err) {
    if (err.message && !err.message.includes('fetch') && err.message !== 'Failed to fetch') {
      throw err;
    }
    throw new Error(DEFAULT_ERROR_MSG);
  }
}

export async function fetchMetrics() {
  try {
    const res = await fetch(`${API_BASE_URL}/ml/metrics`);
    if (!res.ok) throw new Error(DEFAULT_ERROR_MSG);
    return await res.json();
  } catch (err) {
    throw new Error(DEFAULT_ERROR_MSG);
  }
}

export async function fetchFeatureImportances() {
  try {
    const res = await fetch(`${API_BASE_URL}/ml/features`);
    if (!res.ok) throw new Error(DEFAULT_ERROR_MSG);
    return await res.json();
  } catch (err) {
    throw new Error(DEFAULT_ERROR_MSG);
  }
}

export async function askAssistant(question, context = null) {
  try {
    const res = await fetch(`${API_BASE_URL}/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, context }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(formatErrorMessage(err.detail));
    }
    return await res.json();
  } catch (err) {
    if (err.message && !err.message.includes('fetch') && err.message !== 'Failed to fetch') {
      throw err;
    }
    throw new Error(DEFAULT_ERROR_MSG);
  }
}
