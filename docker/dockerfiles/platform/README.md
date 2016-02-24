# OpenPaaS Platform

Launch OpenPaaS platform from docker hub images.

From the root of the current repository:

```bash
PROVISION=true DOCKER_IP=<YOUR_DOCKER_IP> docker-compose -f ./docker/dockerfiles/platform/docker-compose.yml up
```

Check the complete documentation on [../../doc/run.md](../../doc/run.md)
