# Install OpenPaas with Docker

A Docker environment is provided to ease all the setup for various environments (development, demonstration, ...). It allows to start Docker containers for all the dependencies without having to install anything else than Docker and without having to configure all by hand.

Please take note that the commands for installing packages in this documentation are written for Ubuntu. If you use another distribution, use your regular package manager.

## Install and setup OpenPaas

### 1. Clone the repository

If you are on Ubuntu, run the following commands (as an administrator) if you do not have git already installed on your computer.

```
sudo apt install git
```

Then, you clone the repository


```
git clone https://github.com/linagora/openpaas-esn.git
```

or

```
git clone https://ci.linagora.com/linagora/lgs/openpaas/esn.git
```

### 2. Install Node.js

You can use [nvm](https://github.com/creationix/nvm) to install Node.js. Once `nvm` is installed, type the following commands in the directory of your project :

```
nvm install `cat .nvmrc`
nvm use
```

### 3. Additional packages

You may need some additional packages. For example with a Debian or Ubuntu installation, as an administrator you should use the following command in order to not have any issues caused by npm install

```
sudo apt-get install build-essential python-setuptools graphicsmagick graphicsmagick-imagemagick-compat libjpeg-dev
```

### 4. Install the npm dependencies

```
npm install -g bower grunt-cli
```

### 5. Install project dependencies 

```
npm install
```

If you have any problem relating to `node-canvas` during the dependencies installation, make sure your system has installed [Cairo](http://cairographics.org/). Documentation [can be found here](https://github.com/Automattic/node-canvas).

## Install and setup Docker

### 1. Install docker and docker-compose

For an Ubuntu installation, run the following commands (as an administrator) if you do not have docker and docker-compose already installed on your computer

```
sudo apt install docker docker-compose
```

### 2. Run the services with docker-compose

You can launch the minimum set of OpenPaaS required services (Mongo, Redis, Elasticsearch, SabreDAV) in Docker containers and start the current OpenPaaS ESN repository in your preferred NodeJS environment with the help of docker-compose and some initial setup.
**Note** If you get an error related to .yml's "version" statement check your docker-compose version (it should be 1.10.0+). 

```
ESN_HOST=<YOUR_ESN_IP> ESN_PATH=$PWD docker-compose -f ./docker/dockerfiles/dev/docker-compose.yml up
```

* The YOUR_ESN_IP environment variable is used by components to access to the ESN API (This is the case for SabreDAV for example).
This is useful when working on non Linux host since docker containers can not reach localhost since they run in a virtual machine.

**Note** that services may be accessible at different IPs based on the platform you are running docker-compose on:

* 172.17.0.1 on Linux-based systems
* The docker-machine IP on OS X and Windows (default machine is accessible at 192.168.99.100).

Once started, you have to add some configuration so that OpenPaaS will know how to access services. This is possible with the OpenPaaS CLI:

Generate the *config/db.json* file first. This will be use to connect to the Mongo instance:

```bash
node ./bin/cli.js db --host <YOUR_DOCKER_IP> --port <PORT> --database <DBNAME>
```

* YOUR_DOCKER_IP is the IP where MongoDB launched by docker-compose above can be reached (check the note above)
* PORT is the MongoDB port (default to 27017 which is the one defined by docker-compose above)
* DBNAME is the database name to use (default to esn which is the one defined by docker-compose above)

The 'host' parameter is the only one to change here. The default value should work on Linux computers, while you will have to set your docker-machine IP on OS X or Windows.

Now that the database is configured, you can setup configuration and provision some users in the ESN with the help of the CLI:


```bash
node ./bin/cli.js docker-dev --host <YOUR_DOCKER_IP> --port <PORT> --database <DBNAME>
```

* YOUR_DOCKER_IP is the IP where MongoDB launched by docker-compose above can be reached (check the note above)
* PORT is the MongoDB port (default to 27017 which is the one defined by docker-compose above)
* DBNAME is the database name to use (default to esn which is the one defined by docker-compose above)

### 3. Indexation of the users

```
node ./bin/cli elasticsearch --host localhost --port 9200 --index users
node ./bin/cli reindex --db-host localhost --db-port 27017 --db-name esn --type users
```
### 4. Run the project

Now that all is configured and provisioned, you can run your local ESN as usual:

 ```bash
 npm start
 ```

Running `grunt dev` will start the server in development mode. Whenever you
make changes to server files, the server will be restarted. Make sure you have
started the mongo, redis and elasticsearch servers beforehand.