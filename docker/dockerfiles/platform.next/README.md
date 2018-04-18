# OpenPaaS Platform

Launch the whole OpenPaaS platform with next-generation components.

## With docker-compose installed on your machine

From the root of the current repository:

```bash
PROVISION=true DOCKER_IP=<YOUR_DOCKER_IP> ESN_PATH=$PWD docker-compose -f ./docker/dockerfiles/platform.next/docker-compose.yml up
```
You may have to build it first:

```bash
docker-compose -f ./docker/dockerfiles/platform.next/docker-compose.yml build
```

Or, to launch all from existing images (even the current node project):

```bash
PROVISION=true DOCKER_IP=<YOUR_DOCKER_IP> ESN_PATH=$PWD docker-compose -f ./docker/dockerfiles/platform.next/docker-compose-images.yml up
```

## Web applications

* OpenPaaS: http://localhost:8080
* Petals Cockpit: http://localhost:18080

## Accessing Petals Cockpit

> This documentation will be moved later.

1. Find the container name of Petals Cockpit (docker ps | grep cockpit). <span style="color: red">To be removed very soon</span>
2. Type in `docker logs <container-id-for-cockpit>`. <span style="color: red">To be removed very soon</span>
3. Follow the shown URL to create a new user. <span style="color: red">To be removed very soon</span>
4. Log in.
5. Configure the access to Petals ESB: IP address = host IP address, port = 7700, user/pwd/passphrase = petals
