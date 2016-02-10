# Howto use ESN with Docker

The RSE can be used with Docker to ease the deployment of all the required components:

- Redis
- MongoDB
- Apache Cassandra
- Apache James
- Elastic Search
- Sabre DAV

We provide the standard ways to use Docker: by launching each component in its own container by hand, or by using docker-compose.

## Images

We currently use several official images, and some custom ones:

- Redis: redis:latest
- MongoDB: mongo:2.6.6
- Apache Cassandra: cassandra:latest
- Apache James: linagora/james
- Elastic Search: linagora/esn-elastic
- Sabre DAV: linagora/esn-sabre

## Launch OpenPaaS

### With docker-compose

docker-compose is the simpler way to run a distributed application, so you can launch the OpenPaaS platform in a single command.

You have to build the container before to launch OpenPaaS:

```
docker-compose build
```

Note: If your have an error saying that the linagora/esn-base can not be found, you have to build it before. Refer to the 'dev' section below in this case.

Then you can run:

``` sh
INIT_DB=true DOCKER_IP=192.168.99.100 docker-compose up
```

Where environment variables are:

- DOCKER_IP: This is required to set the IP you use to access to docker-machine (192.168.99.100 is the docker-machine ip on OS X for example). If not set, the webserver may not provide some assets correctly.
- INIT_DB (Required on first launch): Tell OpenPaaS to initialize configuration and provision some users/domains/communities so that once launched, you can log in into OpenPaaS.

## Dev

All the OpenPaaS Dockerfiles and docker-compose descriptor heavily use environment variables to create required resources such as configuration files, endpoints, etc...
This allows us to easily configure them when containers are launched, will it be from docker, docker-compose or any other high level abstraction.

### OpenPaaS ESN Images

The OpenPaaS ESN uses a base image which contains all required npm and bower dependencies so that it is quick to build distributions on top of it.
This image is located under docker/dockerfiles/base/Dockerfile. You can build it from the project home directory with the following command:

``` sh
docker build -f ./docker/dockerfiles/base/Dockerfile -t linagora/esn-base .
```

Note that this one needs to be built as soon as a bower or an npm dependency is updated.
