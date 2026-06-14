const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SESSION_TOKEN_KEY = "sentinel_session_token";

export function saveSessionToken(sessionToken) {
  localStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
}

export function getSessionToken() {
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

export function clearSessionToken() {
  localStorage.removeItem(SESSION_TOKEN_KEY);
}

export async function make_auth_request(payload, endpoint) {
  const response = await fetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

export function signupUser(payload) {
  return make_auth_request(payload, "signup");
}

export function verifyEmail(payload) {
  return make_auth_request(payload, "verify-email");
}

export function login(payload) {
  return make_auth_request(payload, "login");
}

export function resendOTP(payload) {
  return make_auth_request(payload, "resend-code");
}

export async function make_get_request(endpoint, params = {}, options = {}) {
  const queryString = new URLSearchParams(params).toString();

  const url = queryString
    ? `${API_BASE_URL}/api/${endpoint}?${queryString}`
    : `${API_BASE_URL}/api/${endpoint}`;

  const headers = {};

  if (options.authenticated) {
    const sessionToken = getSessionToken();

    if (sessionToken) {
      headers.Authorization = `Bearer ${sessionToken}`;
    }
  }

  const response = await fetch(url, { headers })

  let data = null

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };

}

export function getAvailableProviders(){
  return make_get_request("setup/providers", {}, { authenticated: true })
}

export function getAvailableModels(payload) {
  return make_get_request("setup/models", payload, { authenticated: true })
}

export async function make_post_request(payload, endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (options.authenticated) {
    const sessionToken = getSessionToken();

    if (sessionToken) {
      headers.Authorization = `Bearer ${sessionToken}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}/api/${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

export async function make_put_request(payload, endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (options.authenticated) {
    const sessionToken = getSessionToken();

    if (sessionToken) {
      headers.Authorization = `Bearer ${sessionToken}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}/api/${endpoint}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(payload),
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

export function save_api_key(payload){
  return make_post_request(payload, "setup/save_api_key", { authenticated: true })
}

export function validate_assets(payload){
  return make_post_request(payload, "setup/validate-assets", { authenticated: true })
}

export function save_watchlist(payload){
  return make_put_request(payload, "setup/save-watchlist", { authenticated: true })
}
  
