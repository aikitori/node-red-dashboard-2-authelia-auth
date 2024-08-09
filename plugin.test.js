const plugin_name = "node-red-dashboard-2-authelia-auth";
const plugin = require('../node-red-dashboard-2-authelia-auth'); // Update with the correct path to your module

describe('Node-RED Dashboard 2.0 Authelia Auth Plugin', () => {
  let RED;

  beforeEach(() => {
    RED = {
      plugins: {
        registerPlugin: jest.fn(),
      },
    };

    // Initialize the plugin with the RED object
    plugin(RED);
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
    let onAddConnectionCredentials;

    beforeEach(() => {
      onAddConnectionCredentials = RED.plugins.registerPlugin.mock.calls[0][1].hooks.onAddConnectionCredentials;
    });

    it('should log a message if msg._client is not found', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const conn = { request: { headers: {} } };
      const msg = {};

      onAddConnectionCredentials(conn, msg);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        `${plugin_name}: msg._client is not found, not adding user info. This sometimes happens when the editor is refreshed with stale connections to the dashboard.`
      );

      consoleLogSpy.mockRestore();
    });

    it('should log a warning if Authelia user is not found', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const conn = { request: { headers: {} } };
      const msg = { _client: {} };

      onAddConnectionCredentials(conn, msg);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `${plugin_name}: Session is not authenticated by Authelia; no user detected. See headers: ${JSON.stringify(conn.request.headers)}`
      );

      consoleWarnSpy.mockRestore();
    });

    it('should add user information to msg._client if Authelia user is found', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
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

      onAddConnectionCredentials(conn, msg);

      expect(msg._client.user).toEqual({
        host: "test-host",
        agent: "test-agent",
        userId: "test-user",
        name: "Test User",
        email: "test@example.com",
        groups: ["group1", "group2"],
        provider: "Authelia"
      });

      consoleLogSpy.mockRestore();
    });
  });
});
