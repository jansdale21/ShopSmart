import { afterEach, describe, expect, it, vi } from 'vitest';
import { NETWORK_ERROR_MESSAGE, TIMEOUT_ERROR_MESSAGE, request } from './api.js';

// DEF-04 regression tests. fetch is replaced with a fake, so no server or
// external provider is needed to reproduce the failure.
describe('api request error handling', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('replaces the raw "Failed to fetch" error with a useful message when the server is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const result = request('/products');

    await expect(result).rejects.toMatchObject({ message: NETWORK_ERROR_MESSAGE, code: 'NETWORK_ERROR' });
    await expect(result).rejects.not.toThrow('Failed to fetch');
  });

  it('stops waiting and reports a timeout when the server does not answer', async () => {
    vi.stubGlobal('fetch', vi.fn((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        reject(Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' }));
      });
    })));

    await expect(request('/products', {}, 20)).rejects.toMatchObject({
      message: TIMEOUT_ERROR_MESSAGE,
      code: 'TIMEOUT'
    });
  });

  it('keeps the server message and status for API errors such as insufficient stock', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: { code: 'INSUFFICIENT_STOCK', message: 'Only 5 unit(s) of 1080p Webcam are available.' } })
    }));

    await expect(request('/orders', { method: 'POST' })).rejects.toMatchObject({
      message: 'Only 5 unit(s) of 1080p Webcam are available.',
      code: 'INSUFFICIENT_STOCK',
      status: 409
    });
  });

  it('returns the JSON data for a successful response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ status: 'ok' }) }));

    await expect(request('/health')).resolves.toEqual({ status: 'ok' });
  });
});
