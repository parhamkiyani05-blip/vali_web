const API = (
  import.meta.env.VITE_API_URL ||
  'https://backup-api.vali-transport.ir'
).replace(/\/+$/, '');

export const apiBase = API;


// ========================================
// Session
// ========================================

export function getSession() {
  try {
    return JSON.parse(
      localStorage.getItem('vali_session') || 'null'
    );
  } catch {
    return null;
  }
}


export function setSession(session) {
  localStorage.setItem(
    'vali_session',
    JSON.stringify(session)
  );
}


export function clearSession() {
  localStorage.removeItem('vali_session');
}


// ========================================
// API Request
// ========================================

export async function request(path, options = {}) {
  const session = getSession();

  const res = await fetch(`${API}${path}`, {
    ...options,

    headers: {
      'Content-Type': 'application/json',

      ...(session?.token
        ? {
            Authorization:
              `Bearer ${session.token}`
          }
        : {}),

      ...(options.headers || {})
    }
  });


  if (!res.ok) {
    let data = {};

    try {
      data = await res.json();
    } catch {}

    throw new Error(
      data.error ||
      `HTTP_${res.status}`
    );
  }


  if (res.status === 204) {
    return null;
  }

  return res.json();
}


// ========================================
// Login Online
// ========================================

export async function onlineLogin(
  username,
  password
) {
  return request('/api/auth/login', {
    method: 'POST',

    body: JSON.stringify({
      username,
      password
    })
  });
}


// ========================================
// SHA-256
// ========================================

async function sha256(text) {
  const data =
    new TextEncoder().encode(text);

  const digest =
    await crypto.subtle.digest(
      'SHA-256',
      data
    );

  return [
    ...new Uint8Array(digest)
  ]
    .map(
      b =>
        b.toString(16).padStart(2, '0')
    )
    .join('');
}


// ========================================
// Offline Login Verifier
// ========================================

export async function saveOfflineVerifier(
  username,
  password
) {
  const normalizedUsername =
    username
      .trim()
      .toLowerCase();

  const verifier = await sha256(
    `${normalizedUsername}::${password}`
  );

  localStorage.setItem(
    'vali_offline_verifier',

    JSON.stringify({
      username: normalizedUsername,
      verifier
    })
  );
}


export async function canOfflineLogin(
  username,
  password
) {
  let saved = null;

  try {
    saved = JSON.parse(
      localStorage.getItem(
        'vali_offline_verifier'
      ) || 'null'
    );
  } catch {
    return false;
  }


  if (!saved) {
    return false;
  }


  const normalizedUsername =
    username
      .trim()
      .toLowerCase();


  const verifier =
    await sha256(
      `${normalizedUsername}::${password}`
    );


  return (
    saved.username ===
      normalizedUsername &&
    saved.verifier === verifier
  );
}


// ========================================
// Offline Expense Queue
// ========================================

export function queueExpense(payload) {
  let q = [];

  try {
    q = JSON.parse(
      localStorage.getItem(
        'vali_outbox'
      ) || '[]'
    );
  } catch {
    q = [];
  }


  q.push({
    id:
      crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,

    type: 'expense',

    payload,

    createdAt:
      new Date().toISOString()
  });


  localStorage.setItem(
    'vali_outbox',
    JSON.stringify(q)
  );

  return q.length;
}


// ========================================
// Outbox Count
// ========================================

export function outboxCount() {
  try {
    return JSON.parse(
      localStorage.getItem(
        'vali_outbox'
      ) || '[]'
    ).length;

  } catch {
    return 0;
  }
}


// ========================================
// Flush Offline Queue
// ========================================

export async function flushOutbox() {
  let q = [];

  try {
    q = JSON.parse(
      localStorage.getItem(
        'vali_outbox'
      ) || '[]'
    );
  } catch {
    q = [];
  }


  if (!q.length) {
    return 0;
  }


  const remain = [];


  for (const item of q) {
    try {

      if (item.type === 'expense') {
        await request(
          '/api/expenses',
          {
            method: 'POST',

            body:
              JSON.stringify(
                item.payload
              )
          }
        );
      }

    } catch {
      remain.push(item);
    }
  }


  localStorage.setItem(
    'vali_outbox',
    JSON.stringify(remain)
  );


  return remain.length;
}
