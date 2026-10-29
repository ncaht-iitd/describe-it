// Client for the Describe service (services/describe_service). Only the server calls it,
// so the service URL, its token and the model API keys never reach the browser.
const SERVICE_URL = () => (process.env.DESCRIBE_SERVICE_URL || 'http://localhost:8001').replace(/\/$/, '');
const TIMEOUT_MS = 120000;

class ServiceError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function call(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(`${SERVICE_URL()}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Token': process.env.SERVICE_TOKEN || '',
        ...(options.headers || {}),
      },
    });
  } catch (err) {
    throw new ServiceError(
      err.name === 'AbortError'
        ? 'The description service took too long to answer. Try again.'
        : 'The description service is not reachable. It may be starting up; try again in a minute.',
      503,
    );
  } finally {
    clearTimeout(timer);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ServiceError(body.detail || `Description service error (${res.status})`, res.status >= 500 ? 502 : res.status);
  return body;
}

const listModels = () => call('/v1/models');

const describe = ({ base64, mediaType, model, promptVersion, context }) => call('/v1/describe', {
  method: 'POST',
  body: JSON.stringify({
    image_base64: base64,
    media_type: mediaType,
    model,
    prompt_version: promptVersion || undefined,
    context,
  }),
});

module.exports = { listModels, describe, ServiceError };
