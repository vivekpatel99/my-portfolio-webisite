import { describe, expect, it } from 'vitest';
import {
  assertLoopbackPreviewUrl,
  assertLoopbackWebSocketUrl,
  resolveLoopbackRedirectUrl,
  resolveQaTargets,
} from '../tests/qa/qa-local-only.js';

describe('QA_LOCAL_ONLY guard', () => {
  it.each(['http://localhost:3000', 'http://127.0.0.1:3000', 'http://[::1]:3000'])(
    'accepts the loopback preview URL %s',
    (previewURL) => {
      expect(() => assertLoopbackPreviewUrl(previewURL)).not.toThrow();
    },
  );

  it.each([
    'https://www.vivekapatel.com',
    'https://127.0.0.1.nip.io',
    'ftp://127.0.0.1:3000',
    'http://user:password@127.0.0.1:3000',
    'not a URL',
  ])('rejects unsafe preview URL %s', (previewURL) => {
    expect(() => assertLoopbackPreviewUrl(previewURL)).toThrow('QA_LOCAL_ONLY requires');
  });

  it('limits local-only QA targets to the preview', () => {
    expect(resolveQaTargets({
      localOnly: true,
      previewURL: 'http://127.0.0.1:3000',
      prodURL: 'https://www.vivekapatel.com',
    })).toEqual([['preview', 'http://127.0.0.1:3000']]);
  });

  it('retains production targets when local-only mode is not requested', () => {
    expect(resolveQaTargets({
      localOnly: false,
      previewURL: 'http://127.0.0.1:3000',
      prodURL: 'https://www.vivekapatel.com',
    })).toEqual([
      ['preview', 'http://127.0.0.1:3000'],
      ['prod', 'https://www.vivekapatel.com'],
    ]);
  });

  it('refuses a redirect from the local preview to an external destination', () => {
    expect(() => resolveLoopbackRedirectUrl(
      'http://127.0.0.1:3000/contact/',
      'https://www.vivekapatel.com/contact/',
    )).toThrow('QA_LOCAL_ONLY requires');
  });

  it('allows a relative redirect that remains on the local preview', () => {
    expect(resolveLoopbackRedirectUrl(
      'http://127.0.0.1:3000/contact',
      '/contact/',
    )).toBe('http://127.0.0.1:3000/contact/');
  });

  it.each(['ws://localhost:3000', 'ws://127.0.0.1:3000', 'wss://[::1]:3000'])(
    'accepts the loopback WebSocket URL %s',
    (socketURL) => {
      expect(() => assertLoopbackWebSocketUrl(socketURL)).not.toThrow();
    },
  );

  it.each(['wss://external.invalid', 'http://127.0.0.1:3000'])(
    'rejects an unsafe WebSocket URL %s',
    (socketURL) => {
      expect(() => assertLoopbackWebSocketUrl(socketURL)).toThrow('QA_LOCAL_ONLY requires');
    },
  );
});
