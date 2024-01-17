# Cocoda Versions (Docker)

Docker image to manage and serve multiple instances of [Cocoda Mapping Tool](https://github.com/gbv/cocoda).

Note: Experimental.

## Usage via Docker Compose

```yml
version: "3"

services:
  cocoda:
    image: ghcr.io/gbv/cocoda-versions
    volumes:
      - ./data/cocoda:/www/cocoda
    ports:
      - 8080:80
    environment:
      - TAGS=0.2.0 1.0.0 dev
    restart: unless-stopped
```

In the bind mount `./data/cocoda`, the static files of all Cocoda instances will be placed (to prevent rebuilding them every time). In that folder, you can also specify custom Cocoda configurations as `{instance-name}.json`. These will be built in addition to the defined `TAGS`. Custom configurations will use branch `master` by default; a different branch for a particular instance can be specific inside its configuration file as `_branch`.

A special tag `all` can be used to build ALL existing Cocoda versions, plus branches `dev` and `master`. This can be used to provide a history of old Cocoda versions.

The HTTP server serves the instances under the subpath `/cocoda/`, i.e. in the above example, branch `dev` will be availble at http://localhost:8080/cocoda/dev/.

## To-Do
- [ ] Consider using other HTTP server instead of [http-server](https://github.com/http-party/http-server)
- [ ] Separate build step from container start (only start HTTP server on container start)
- [ ] Update specific versions/branches without restarting container.
