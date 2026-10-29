// Who is calling? The website sends a short-lived Appwrite JWT (Authorization: Bearer ...)
// for signed-in users. We ask Appwrite who it belongs to; nothing is trusted from the browser.
// Admins are users with the "Admin" label in the Appwrite console (same rule as before).
//
// Temporary until the login work: this is the only place that decides roles, so it can be
// replaced without touching the routes.

async function verifyUser(req) {
  const header = req.get('authorization') || '';
  const jwt = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const endpoint = (process.env.APPWRITE_ENDPOINT || '').replace(/\/$/, '');
  const project = process.env.APPWRITE_PROJECT_ID || '';
  if (!jwt || !endpoint || !project) return null;

  try {
    const res = await fetch(`${endpoint}/account`, {
      headers: { 'X-Appwrite-Project': project, 'X-Appwrite-JWT': jwt },
    });
    if (!res.ok) return null;
    const user = await res.json();
    return {
      id: user.$id,
      name: user.name,
      email: user.email,
      isAdmin: Array.isArray(user.labels) && user.labels.map((l) => String(l).toLowerCase()).includes('admin'),
    };
  } catch {
    return null;
  }
}

/** Express middleware: only admins pass. Use `auth.requireAdmin` so tests can replace verifyUser. */
function requireAdmin(req, res, next) {
  module.exports.verifyUser(req).then((user) => {
    if (!user) return res.status(401).json({ success: false, error: 'Log in with an admin account to do this.' });
    if (!user.isAdmin) return res.status(403).json({ success: false, error: 'Only admins can save descriptions to the library.' });
    req.user = user;
    return next();
  }).catch(next);
}

module.exports = { verifyUser, requireAdmin };
