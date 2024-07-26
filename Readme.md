# Todo ...

Use Authelia as an auth provider for the Dashboard

Heavely copied from: https://github.com/fullmetal-fred/node-red-dashboard-2-cloudflare-auth/tree/main
Thank you :)



# Requirements
you need a working Authelia instance with the default snippets.

## nginx snippets

https://www.authelia.com/integration/proxies/nginx/

## authelia

minimal docker compose. 
Not Secure!!!!

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

configuration.yml

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

## nginx

auth.conf

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
red.conf
 
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