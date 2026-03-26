const API = '/api';

export const registerUser = async ({ name, email, avatarUrl, password }) => {
  const payload = {
    name: String(name || '').trim(),
    email: String(email || '').trim() || null,
    avatarUrl: avatarUrl || null,
    password: String(password || ''),
  };

  if (!payload.name) {
    throw new Error('A név megadása kötelező.');
  }
  if (!payload.password) {
    throw new Error('A jelszó megadása kötelező.');
  }

  const res = await fetch(`${API}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.hiba || 'Nem sikerült a regisztráció.');
  }

  return res.json();
};

export const loginUser = async ({ name, password }) => {
  const payload = { name: String(name || '').trim(), password: String(password || '') };
  if (!payload.name) throw new Error('A név megadása kötelező.');
  if (!payload.password) throw new Error('A jelszó megadása kötelező.');

  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.hiba || 'Nem sikerült a bejelentkezés.');
  }

  return res.json();
};

