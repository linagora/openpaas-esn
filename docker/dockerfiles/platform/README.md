# OpenPaaS Platform

Launch the whole OpenPaaS platform.

From the root of the current repository:

```bash
PROVISION=true DOCKER_IP=<YOUR_DOCKER_IP> docker-compose -f ./docker/dockerfiles/platform/docker-compose.yml up
```
You may have to build it first

```bash
docker-compose -f ./docker/dockerfiles/platform/docker-compose.yml build
```

or, to launch all from existing images (even the current node project):

```bash
PROVISION=true DOCKER_IP=<YOUR_DOCKER_IP> docker-compose -f ./docker/dockerfiles/platform/docker-compose-images.yml up
```

Check the complete documentation on [../../doc/run.md](../../doc/run.md)
