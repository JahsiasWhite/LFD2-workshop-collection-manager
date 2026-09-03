const DEFAULT_TIMEOUT_MS = 20000;

export function getErrorCopy(error) {
  const code = error?.code;
  const status = error?.status;
  const message = error?.message || '';

  if (code === 'TIMEOUT' || code === 'DATABASE_TIMEOUT') {
    return {
      title: "This is taking too long",
      message:
        'The mod database did not respond in time. It may be down or waking up.',
    };
  }

  if (code === 'NETWORK') {
    return {
      title: "Can't reach the server",
      message:
        'Check your connection, or the API may be offline. Retry in a moment.',
    };
  }

  if (code === 'DATABASE_UNAVAILABLE' || status === 503) {
    return {
      title: 'Mod database is unavailable',
      message:
        message ||
        'We could not load workshop data right now. This is usually temporary.',
    };
  }

  if (status >= 500) {
    return {
      title: "Couldn't load mods",
      message:
        message || 'The server hit an error while loading workshop data.',
    };
  }

  return {
    title: "Couldn't load mods",
    message: message || 'Something went wrong. Please try again.',
  };
}

export async function fetchJson(
  url,
  options = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener('abort', () => controller.abort(), {
        once: true,
      });
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const error = new Error(
        data?.error || `Request failed (${response.status})`
      );
      error.status = response.status;
      error.code = data?.code;
      error.friendly = true;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.friendly) {
      throw error;
    }

    // A newer request cancelled this one — not a timeout
    if (options.signal?.aborted) {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      throw abortError;
    }

    if (error.name === 'AbortError') {
      const timeoutError = new Error(
        'The request timed out. The database may be unavailable.'
      );
      timeoutError.code = 'TIMEOUT';
      timeoutError.friendly = true;
      throw timeoutError;
    }

    const networkError = new Error(
      'Could not reach the server. Check your connection or try again.'
    );
    networkError.code = 'NETWORK';
    networkError.friendly = true;
    throw networkError;
  } finally {
    clearTimeout(timeoutId);
  }
}
