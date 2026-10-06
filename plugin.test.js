const plugin_name = "node-red-dashboard-2-authelia-auth";
const plugin = require('../node-red-dashboard-2-authelia-auth'); // Update with the correct path to your module

describe('Node-RED Dashboard 2.0 Authelia Auth Plugin', () => {
  let RED;
  let hooks;

  beforeEach(() => {
    RED = {
      plugins: {
        registerPlugin: jest.fn(),
      },
      log: {
        debug: jest.fn(),
        warn: jest.fn(),
      },
    };

    // Initialize the plugin with the RED object
    plugin(RED);
    hooks = RED.plugins.registerPlugin.mock.calls[0][1].hooks;
  });

  it('should register the plugin with the correct type and name', () => {
    expect(RED.plugins.registerPlugin).toHaveBeenCalledWith(
      plugin_name,
      expect.objectContaining({
        type: "node-red-dashboard-2",
      })
    );
  });

  describe('onAddConnectionCredentials hook', () => {
    it('should log a debug message if msg._client is not found', () => {
      const conn = { request: { headers: {} } };
      const msg = {};

      expect(hooks.onAddConnectionCredentials(conn, msg)).toEqual({});

      expect(RED.log.debug).toHaveBeenCalledWith(
        `${plugin_name}: msg._client is not found, not adding user info. This sometimes happens when the editor is refreshed with stale connections to the dashboard.`
      );
    });

    it('should log a warning and add an empty user if Authelia user is not found', () => {
      const conn = { request: { headers: {} } };
      const msg = { _client: {} };

      hooks.onAddConnectionCredentials(conn, msg);

      expect(RED.log.warn).toHaveBeenCalledWith(
        `${plugin_name}: Session is not authenticated by Authelia; no user detected. See headers: ${JSON.stringify(conn.request.headers)}`
      );
      expect(msg._client.user.userId).toBeNull();
    });

    it('should add user information to msg._client if Authelia user is found', () => {
      const headers = {
        "remote-user": "test-user",
        "host": "test-host",
        "user-agent": "test-agent",
        "remote-name": "Test User",
        "remote-email": "test@example.com",
        "remote-groups": "group1,group2"
      };
      const conn = { request: { headers } };
      const msg = { _client: {} };

      hooks.onAddConnectionCredentials(conn, msg);

      expect(msg._client.user).toEqual({
        host: "test-host",
        agent: "test-agent",
        userId: "test-user",
        name: "Test User",
        email: "test@example.com",
        groups: ["group1", "group2"],
        provider: "Authelia"
      });
      expect(RED.log.debug).toHaveBeenCalledWith(
        `${plugin_name}: Dashboard interacted with by test-user`
      );
    });
  });

  describe('onIsValidConnection hook', () => {
    const conn = { request: { headers: { "remote-user": "alice" } } };

    it('should allow messages without user', () => {
      expect(hooks.onIsValidConnection(conn, {})).toBe(true);
      expect(hooks.onIsValidConnection(conn, { _client: { socketId: "abc" } })).toBe(true);
    });

    it('should allow messages for the connected user', () => {
      expect(hooks.onIsValidConnection(conn, { _client: { user: { userId: "alice" } } })).toBe(true);
    });

    it('should block messages for another user', () => {
      expect(hooks.onIsValidConnection(conn, { _client: { user: { userId: "bob" } } })).toBe(false);
    });
  });

  describe('onCanSaveInStore hook', () => {
    it('should allow storing messages without user', () => {
      expect(hooks.onCanSaveInStore({ payload: 1 })).toBe(true);
    });

    it('should not store messages for a user', () => {
      expect(hooks.onCanSaveInStore({ _client: { user: { userId: "alice" } } })).toBe(false);
    });
  });
});
