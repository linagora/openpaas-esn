# OpenPaaS Platform

Launch the whole OpenPaaS platform.

## With docker-compose installed on your machine

From the root of the current repository:

```bash
PROVISION=true DOCKER_IP=<YOUR_DOCKER_IP> ESN_PATH=$PWD docker-compose -f ./docker/dockerfiles/platform/docker-compose.yml up
```
You may have to build it first

```bash
docker-compose -f ./docker/dockerfiles/platform/docker-compose.yml build
```

or, to launch all from existing images (even the current node project):

```bash
PROVISION=true DOCKER_IP=<YOUR_DOCKER_IP> ESN_PATH=$PWD docker-compose -f ./docker/dockerfiles/platform/docker-compose-images.yml up
```

## Without docker-compose installed on your machine

You can avoid to install docker-compose, by running it as a container with the following command:

```bash
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -e ESN_PATH=$PWD -v $PWD:/compose  -e PROVISION=true -e DOCKER_IP=<YOUR_DOCKER_IP> -w /compose -ti docker/compose:1.6.2 -f docker/dockerfiles/platform/docker-compose.yml up
```

Check the complete documentation on [../../doc/run.md](../../doc/run.md)
