[![Node.js CI](https://github.com/aikitori/node-red-dashboard-2-authelia-auth/actions/workflows/node.js.yml/badge.svg)](https://github.com/aikitori/node-red-dashboard-2-authelia-auth/actions/workflows/node.js.yml)
# Node-RED Dashboard with Authelia Authentication

Use [Authelia](https://www.authelia.com/) as an authentication provider for the [Node-RED Dashboard 2](https://github.com/FlowFuse/node-red-dashboard).

Heavily copied from: [node-red-dashboard-2-cloudflare-auth](https://github.com/fullmetal-fred/node-red-dashboard-2-cloudflare-auth)
Thank you :)

You need an Authelia-protected Node-RED instance.

## Requirements
 - Node-RED 3.1 or newer
 - FlowFuse Dashboard (`@flowfuse/node-red-dashboard`) 1.10 or newer
 - A working Authelia instance with the default snippets.

## Installation

Install the plugin in your Node-RED user directory (usually `~/.node-red`) or via "Manage palette" in the editor:

```
npm install @aikitori/node-red-dashboard-2-authelia-auth
```

Restart Node-RED. Then open the Dashboard 2.0 sidebar in the editor, go to "Client Data" and enable "Authelia".

The user info is added to `msg._client.user`:

```json
{
  "host": "red.example.com",
  "agent": "Mozilla/5.0 ...",
  "userId": "alice",
  "name": "Alice",
  "email": "alice@example.com",
  "groups": ["admins", "users"],
  "provider": "Authelia"
}
```

If Authelia sends no user, `userId` is `null`.

## Sending messages to a single user

Nodes with "Accept Client Constraints" enabled in the "Client Data" tab only send a message to the connections of the user in `msg._client.user`.
To send a message to all browser tabs of a user, keep `msg._client.user` and remove `socketId` and `clientId`:

```js
msg._client = { user: msg._client.user };
return msg;
```

Such messages are not stored in the Dashboard data store, so they are not shown to other users when they connect later.

## Nginx Snippets

Refer to the [Authelia Nginx Integration Guide](https://www.authelia.com/integration/proxies/nginx/)

## Setting Up Authelia

Please read the documentation from Authelia:
https://www.authelia.com/integration/prologue/get-started/

### Minimal Docker Compose Configuration

Note: This setup is not secure and should be used for testing purposes only.

```

services:
  authelia:
    image: authelia/authelia
    container_name: authelia
    volumes:
      - ./authelia:/config
    ports:
      - 9091:9091
    restart: unless-stopped
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/Berlin

```

`configuration.yml`

Create a configuration.yml file for Authelia with the following content:

```
server:
  address: 'tcp://:9091/'
logs_level: 'debug'
jwt_secret: insecure_secret
authentication_backend:
  file:
    path: /config/users.yml
totp:
  issuer: example.com
session:
  cookies:
    - domain: 'example.com'
      authelia_url: 'https://auth.example.com'
      default_redirection_url: 'https://www.red.example.com'
storage:
  encryption_key: 'you_must_generate_a_random_string_of_more_than_twenty_chars_and_configure_this'
  local:
    path: /config/db.sqlite
access_control:
  default_policy: bypass
  rules:
    - domain: "red.example.com"
      policy: one_factor
notifier:
  filesystem:
    filename: /config/emails.txt

```

## Setting Up Nginx

### `auth.conf`

Create an auth.conf file for the authentication server:

```
server {
listen 443      ssl;
listen [::]:443 ssl;
server_name auth.*;

ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;


 set $upstream http://127.0.0.1:9091;

    location / {
        include /etc/nginx/snippets/proxy.conf;
        proxy_pass $upstream;
    }

    location = /api/verify {
        proxy_pass $upstream;
    }

    location /api/authz/ {
        proxy_pass $upstream;
    }


}
```

### `red.conf`

Create a red.conf file for the Node-RED server:

```
server {
    listen 443 ssl http2;
    server_name red.example.com;

    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;

    include /etc/nginx/snippets/authelia-location.conf;

    location / {
        include /etc/nginx/snippets/proxy.conf;
        include /etc/nginx/snippets/authelia-authrequest.conf;
        proxy_pass http://127.0.0.1:1880;
    }
}

```

This setup enables Authelia to act as an authentication provider for the Node-RED Dashboard, securing access through Nginx. Ensure you replace placeholders such as example.com with your actual domain and adjust paths and settings according to your environment.
