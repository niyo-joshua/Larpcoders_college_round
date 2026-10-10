// Minimal API client.
// Privacy notes:
// - No cookies sent (credentials: 'omit').
// - No referrer sent.
// - No caching.
// - Never console.log request bodies (may contain credentials).

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Admin token kept in memory only. Never localStorage.
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

    redeemEligibility: (eligibility_code) =>
        request('/api/credentials/redeem', {
            method: 'POST',
            body: { eligibility_code },
        }),

    submitReport: ({ credential, category, title, description, severity }) =>
        request('/api/reports', {
            method: 'POST',
            body: { credential, category, title, description, severity },
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

    adminAnalytics: () => request('/api/admin/analytics', { auth: true }),
};