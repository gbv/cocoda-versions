# Cocoda Versions (Docker)

Docker image to manage and serve multiple instances of [Cocoda Mapping Tool](https://github.com/gbv/cocoda).

Note: Experimental.

## Table of Contents
- [Usage via Docker Compose](#usage-via-docker-compose)
  - [Custom Instances](#custom-instances)
- [Maintainers](#maintainers)
- [License](#license)

## Usage via Docker Compose

See also the included `docker-compose.yml` file in this repository.

```yml
services:
  cocoda:
    image: ghcr.io/gbv/cocoda-versions
    volumes:
      - ./data/cocoda:/www/cocoda
      - ./data/configs:/configs
    ports:
      - 8080:80
    environment:
      - TAGS=0.2.0 1.0.0 dev
    restart: unless-stopped
```

In the bind mount `./data/cocoda`, the static files of all Cocoda instances will be placed (to prevent rebuilding them every time).

A special tag `all` can be used to build ALL existing Cocoda versions, plus branches `dev` and `master`. This can be used to provide a history of old Cocoda versions.

The HTTP server serves the instances with their names as subpath, i.e. in the above example, branch `dev` will be availble at http://localhost:8080/dev/. (If `USE_SUBPATH` is set, the subpath `/cocoda/` will be added.)

Starting the HTTP server:

```sh
docker compose up -d
```

Run setup to build or update instances:

```sh
docker compose exec cocoda bash setup.sh
```

### Custom Instances

You can also specify custom Cocoda configurations as `{instance-name}.json` or `{instance-name}/cocoda.json` in the container's `/configs` directory. These will be built in addition to the defined `TAGS`. Custom configurations will use branch `master` by default; a different branch for a particular instance can be specific inside its configuration file as `_branch`. If the latter format is used, all other files (except `cocoda.json`) will be linked into the target build folder (e.g. for logo files). **Note** that static files given in the configuration folder will overwrite files in the build!

## Maintainers

- [@stefandesu](https://github.com/stefandesu)

## License

MIT ©2024 Verbundzentrale des GBV (VZG)
