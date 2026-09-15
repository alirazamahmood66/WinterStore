const AUTH_KEY = "winterstore_auth";
const USER_KEY = "winterstore_user";

export const getAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    const data = JSON.parse(raw);
    if (data && data.token) return data;
  } catch {
    // ignore corrupted storage
  }
  return null;
};

export const getToken = () => {
  const auth = getAuth();
  return auth ? auth.token : null;
};

export const isAdmin = () => {
  const auth = getAuth();
  return Boolean(auth && auth.user && auth.user.role === "admin");
};

export const setAuth = ({ token, user }) => {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ token, user }));
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({
        email: user.email,
        name: user.name,
        role: user.role,
        loggedIn: true,
        at: new Date().toISOString(),
      })
    );
  } catch {
    // localStorage not available
  }
  window.dispatchEvent(new Event("auth-updated"));
};

export const clearAuth = () => {
  try {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // localStorage not available
  }
  window.dispatchEvent(new Event("auth-updated"));
};