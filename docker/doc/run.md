# Howto use ESN with Docker

The RSE can be used with Docker to ease the deployment of all the required components:

- Redis
- MongoDB
- Apache Cassandra
- Apache James
- Elastic Search
- Sabre DAV
- OpenPaaS ESN

Note: All the docker related instructions below has been tested with docker-compose 1.6.0 and docker 1.10.0.
Please check [docker.com](http://docker.com) for installation instructions.

## Howto Launch OpenPaaS

### With docker-compose

docker-compose is the simplest way to run a distributed application, so you can launch the OpenPaaS platform in a single command.

There are two ways to run the OpenPaaS platform with docker-compose:

1. Build required containers yourself from sources.
2. Run from Docker Hub containers which are available from https://hub.docker.com/u/linagora/

**Build required containers yourself from sources**

The default docker-compose descriptor can be found at the root or the current repository (check the docker-compose.yml file).

You have to build the ESN container before to launch OpenPaaS. Go to the top repository folder then:

```
docker-compose -f ./docker/dockerfiles/platform/docker-compose.yml build
```

Note: If your have an error saying that the linagora/esn-base can not be found, you have to build it before. Refer to the 'dev' section below in this case.

Then you can run:

``` sh
PROVISION=true DOCKER_IP=<YOUR_DOCKER_IP> docker-compose -f ./docker/dockerfiles/platform/docker-compose.yml up
```

**Run from Docker Hub containers (ie build nothing)**

```bash
PROVISION=true DOCKER_IP=<YOUR_DOCKER_IP> docker-compose -f ./docker/dockerfiles/platform/docker-compose-images.yml up
```

In both cases, environment variables are defined like:

- PROVISION (Required on first launch only): Tell OpenPaaS to initialize configuration and provision some users/domains/communities so that once launched, you can log in into OpenPaaS.
- DOCKER_IP: localhost (or 127.0.0.1) on Linux-based system or the docker-machine IP on OS X and Windows (default machine is accessible at 192.168.99.100, type 'docker-machine ip default' to check the value). It is required to set this IP so that the configuration is generated from the right value. If not set, the webserver may not provide some assets correctly.

Launching the platform may take some time (1-2 minutes), grab a coffee and be ready for the next steps!

There are still some things to configure to have a fully operational platform. Let's create required resources on the James Mail Server:

- Add a Domain:

```bash
docker exec esn_james java -jar /root/james-cli.jar -h localhost adddomain open-paas.org
```

You may want to create some users in the newly created domain.
Note that OpenPaaS users and their mailboxes are automatically provisioned on first login from the OpenPaaS application.
So you do not need to create any user to use OpenPaaS, but you can check that all is working with the following commands:

- To create an user:

```bash
docker exec esn_james java -jar /root/james-cli.jar -h localhost adduser me@open-paas.org secret
```

To check that the user is well created, you can telnet on the James IMAP port:

```
telnet <YOUR_DOCKER_IP> 1143
```

and login with:

```
A0 LOGIN me@open-paas.org secret
```

The server should print some logs in the docker-compose console and send you back a login completed message:

```
A0 OK LOGIN completed.
```

Provisioned users have a random generated password. If for some cases, you want to configure and use an external mail application (like in [./mailer.md](./mailer.md)), you can update the user password like this:

```
# Change the admin@open-paas.org password to 'secret'
docker exec esn_james java -jar /root/james-cli.jar -h localhost setpassword admin@open-paas.org secret
```

**We are now ready!** You should now be able to use several services (check the docker-compose.yml file to find the list or exposed ports).
Let's connect to the OpenPaaS Web appliction on http://<YOUR_DOCKER_IP>:8080. If you launched docker-compose with the PROVISION variable set to true, you can log in with

```
username: admin@open-paas.org
password: secret
```

You can check the [./mailer.md](./mailer.md) documentation to look how to configure a Mail client to access to the OpenPaaS mail server.

# Dev

All the OpenPaaS Dockerfiles and docker-compose descriptor heavily use environment variables to create required resources such as configuration files, endpoints, etc...
This allows us to easily configure them when containers are launched, will it be from docker, docker-compose or any other high level abstraction.
