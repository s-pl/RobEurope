import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getVapidPublicKey,
  subscribePush,
  unsubscribePush,
  sendTestPush
} from '../controller/push.controller.js';
import {
  getPublicKey,
  saveSubscription,
  removeSubscription,
  sendPushToUser
} from '../utils/push.js';

vi.mock('../utils/push.js', () => ({
  getPublicKey: vi.fn(() => 'mock-public-key'),
  saveSubscription: vi.fn(),
  removeSubscription: vi.fn(),
  sendPushToUser: vi.fn()
}));

describe('Push Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = { body: {}, user: null };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    vi.clearAllMocks();
  });

  it('exposes the configured VAPID public key', async () => {
    await getVapidPublicKey(req, res);

    expect(getPublicKey).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ publicKey: 'mock-public-key' });
  });

  it('rejects push subscription attempts without an authenticated user', async () => {
    await subscribePush(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(saveSubscription).not.toHaveBeenCalled();
  });

  it('requires an endpoint parameter when unsubscribing', async () => {
    req.user = { id: 'user-1' };

    await unsubscribePush(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'endpoint required' });
    expect(removeSubscription).not.toHaveBeenCalled();
  });

  it('sends a canned push payload to the current user', async () => {
    req.user = { id: 'user-2' };
    sendPushToUser.mockResolvedValue({ ok: true });

    await sendTestPush(req, res);

    expect(sendPushToUser).toHaveBeenCalledWith(
      'user-2',
      expect.objectContaining({
        title: 'Test push',
        body: expect.any(String)
      })
    );
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });
});
