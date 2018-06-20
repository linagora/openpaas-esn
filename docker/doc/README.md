# OpenPaaS + Docker documentation

Here is the documentation about running OpenPaaS with the help of Docker.

## TOC

- [dev.md](./dev.md): How to develop with the help of Docker
- [images.md](./images.md): Information about ESN Docker images
- [install.md](./install.md): How to install OpenPaaS with Docker
- [known_issues.md](./known_issues.md): List of docker related issues, and how to fix them
- [mailer.md](./mailer.md): How to configure your mail client to connect to your Dockerized James Mailbox
- [run.md](./run.md): How to launch OpenPaaS in Docker
- [tests.md](./tests.md): How launch unit tests with Docker

## Docker survival guide

**Show running containers**

```
docker ps
```

**Launch bash in a running container**

```
docker exec -it CONTAINER_ID_OR_NAME /bin/bash
```

**Kill all the containers**

```
docker kill $(docker ps -a -q)
```

**Remove all the containers**

```
docker rm $(docker ps -a -q)
```

**Force update images to latest***

```
docker-compose -f YOUR_COMPOSE_FILE pull
```
