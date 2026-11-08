const request = require('supertest');

const CallbackServer = require('../callbackServer');

describe('CallbackServer', () => {
  let callbackServer;
  let consoleSpy;

  beforeEach(async () => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation();

    callbackServer = new CallbackServer(0);
    await callbackServer.start();
  });

  afterEach(() => {
    callbackServer.stop();
    consoleSpy.mockRestore();
  });

  describe('authorization success', () => {
    it('resolves the callback promise with the authorization code', async () => {
      const callbackPromise = callbackServer.waitForCallback();

      const res = await request(callbackServer.server)
        .get('/callback?code=valid-code')
        .expect(200);

      await expect(callbackPromise).resolves.toEqual({ code: 'valid-code' });
      expect(res.text).toContain('Authorization Successful');
    });

    it('does not reflect the authorization code in the response', async () => {
      const res = await request(callbackServer.server)
        .get('/callback?code=%3Cscript%3Ealert(1)%3C/script%3E')
        .expect(200);

      expect(res.text).not.toContain('<script>alert(1)</script>');
      expect(res.text).not.toContain('Authorization code:');
    });
  });

  describe('authorization failure', () => {
    it('escapes the error query parameter in the HTML response', async () => {
      const callbackPromise = callbackServer.waitForCallback();

      const res = await request(callbackServer.server)
        .get('/callback?error=%3Cscript%3Ealert(1)%3C/script%3E')
        .expect(400);

      await expect(callbackPromise).resolves.toEqual({
        error: '<script>alert(1)</script>',
      });
      expect(res.text).not.toContain('<script>alert(1)</script>');
      expect(res.text).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
      expect(res.text).toContain('Authorization Failed');
    });
  });
});
