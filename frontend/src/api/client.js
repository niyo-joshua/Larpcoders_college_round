// Privacy-first API client
// Guarantees:
// - Zero cookies sent (credentials: 'omit')
// - Zero referrer sent (referrerPolicy: 'no-referrer')
// - Zero caching (cache: 'no-store')
// - Admin token retained strictly in memory (never localStorage or cookies)

const BASE_URL = import.meta.env.VITE_API_URL || '';

let adminToken = null;

export function setAdminToken(token) {
  adminToken = token;
}

export function getAdminToken() {
  return adminToken;
}

export function clearAdminToken() {
  adminToken = null;
}

async function request(path, { method = 'GET', body, auth = false, headers = {} } = {}) {
  const opts = {
    method,
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (auth && adminToken) {
    opts.headers.Authorization = `Bearer ${adminToken}`;
  }

  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, opts);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = new Error((data && data.detail) || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  health: () => request('/api/health'),

  getCompanies: () => request('/api/reports/companies'),

  // Phone SMS OTP flow
  sendOtp: (phone_number) =>
    request('/api/credentials/send-otp', {
      method: 'POST',
      body: { phone_number },
    }),

  verifyOtp: ({ phone_number, otp_code }) =>
    request('/api/credentials/verify-otp', {
      method: 'POST',
      body: { phone_number, otp_code },
    }),

  // Classic signed token flow (supports phone/otp or legacy eligibility_code)
  redeemEligibility: (codeOrObj) => {
    const body = typeof codeOrObj === 'string' ? { eligibility_code: codeOrObj } : codeOrObj;
    return request('/api/credentials/redeem', {
      method: 'POST',
      body,
    });
  },

  // Cryptographic Chaum RSA Blind Signature flow
  getBlindPublicKey: () => request('/api/credentials/public-key'),

  blindSign: ({ phone_number, otp_code, eligibility_code, blinded_message }) =>
    request('/api/credentials/blind-sign', {
      method: 'POST',
      body: { phone_number, otp_code, eligibility_code, blinded_message },
    }),

  submitReport: ({
    credential,
    blind_tag,
    blind_signature,
    reporter_phone,
    company_name,
    category,
    title,
    description,
    severity,
  }) =>
    request('/api/reports', {
      method: 'POST',
      body: {
        credential,
        blind_tag,
        blind_signature,
        reporter_phone,
        company_name,
        category,
        title,
        description,
        severity,
      },
    }),


  trackReport: ({ report_id, tracking_secret }) =>
    request('/api/reports/track', {
      method: 'POST',
      body: { report_id, tracking_secret },
    }),

  adminLogin: ({ username, password }) =>
    request('/api/admin/login', {
      method: 'POST',
      body: { username, password },
    }),

  adminListReports: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    ).toString();

    return request(`/api/admin/reports${qs ? `?${qs}` : ''}`, { auth: true });
  },

  adminGetReport: (id) => request(`/api/admin/reports/${id}`, { auth: true }),

  adminUpdateReport: (id, patch) =>
    request(`/api/admin/reports/${id}`, {
      method: 'PATCH',
      body: patch,
      auth: true,
    }),

  adminCompanyReports: (companyName) =>
    request(`/api/admin/company/${encodeURIComponent(companyName)}`, { auth: true }),

  adminAnalytics: () => request('/api/admin/analytics', { auth: true }),
};