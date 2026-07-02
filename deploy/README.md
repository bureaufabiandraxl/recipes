# Rezeptschatz Deployment

## Public website

The public Next.js app is configured for static export. Build it locally or on the server:

```bash
npm install
npm run build
```

The exported site is written to `out/` and can be deployed into the ServerPilot app web root for:

```text
rezeptschatz.fabiandraxl.com
```

To build the current Directus-backed static site and publish it to the live ServerPilot app in one step:

```bash
npm run deploy
```

The deploy script uploads `out/` to:

```text
/srv/users/rezeptschatz/apps/rezeptschatz/public/
```

## Directus CMS

Directus is intended to run as a local service on the server and be exposed through the ServerPilot/Nginx app:

```text
rezeptschatz-cms.fabiandraxl.com -> 127.0.0.1:8055
```

On the server:

```bash
cd deploy/directus
cp .env.example .env
# edit .env and replace all secrets
docker compose up -d
```

The real `.env` file must stay on the server and must not be committed.
