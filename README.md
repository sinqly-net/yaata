# yaata
yet another api testing app

## Local development

The local Docker Compose file starts PostgreSQL 18.6 with the same connection
settings as `backend/config.yaml`: database `postgres`, user `postgres`,
password `postgres`, and schema `public`.

From the repository root, start the database with:

```sh
docker compose -f docker-compose.local.yml up -d db
```

The database is published only on the local machine at `127.0.0.1:5432` and
stores its data in the named `postgres_data` volume. Stopping or recreating the
container keeps the data. `docker compose -f docker-compose.local.yml down`
also preserves it; `docker compose -f docker-compose.local.yml down -v` deletes
the volume and all database data.

The Compose credentials are for local development only. PostgreSQL uses the
`POSTGRES_*` values to initialize a new data volume; changing them later does
not change the credentials in an existing volume. Do not reuse these values or
the local Keycloak client secret in production. The backend configuration file
is ignored by Git because it contains local credentials.

The browser-facing backend host in `backend/config.yaml` is
`http://localhost:5000`, where the local Caddy reverse proxy listens. Configure
the Keycloak client with the exact callback URI
`http://localhost:5000/api/auth/callback`. To ensure only your accountant can
sign in, restrict access to the `devop` client in Keycloak (for example with
client roles/authorization or an explicit user allow-list); having only one
intended user does not itself prevent other realm users from authenticating.
This HTTP localhost setup and its development secret are not suitable for
production.

Starting PostgreSQL does not create the application's tables. The repository
does not currently provide database migrations, so the required schema still
needs to be created before the backend can use the database.

## Backend tests

The backend tests run as an independent GitLab CI job when a commit is pushed
to the `staging` branch. The job installs the locked Python dependencies and
runs the standard-library `unittest` suite; it does not start the backend,
PostgreSQL, or Keycloak, and it does not need the local `backend/config.yaml`
file.

To run the same checks locally from the repository root:

```sh
cd backend
uv sync --locked
uv run --no-sync python -m unittest discover -s tests -v
```

## GitHub staging mirror

After the backend test job passes, a push pipeline for the GitLab `staging`
branch mirrors that commit to `https://github.com/sinqly-net/yaata.git`, also on
`staging`. Other branches and tags are not pushed. Stale staging pipelines are
skipped, mirror jobs are serialized, and Git rejects non-fast-forward pushes
rather than overwriting GitHub history.

For the mirror job, add a masked and protected GitLab CI/CD variable named
`GITHUB_TOKEN`. Its GitHub fine-grained personal access token should be limited
to the `sinqly-net/yaata` repository and have **Contents: Read and write** access.
Protect the GitLab `staging` branch so the protected variable is available to
its pipeline. The mirror job fails if the token is missing or GitHub rejects
the push; it does not put the token in the remote URL.
