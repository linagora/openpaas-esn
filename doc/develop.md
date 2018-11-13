# OpenPaaS installation for developpers

## Get your local ESN up & running

This guide will walk you through running ESN locally from its sources. At the end, you will have a running nodejs server on your machine. All external services ESN relies on such as the MongoDB database or the James email server will be deployed using docker and docker-compose.

> Note that these instructions are targetted at Ubuntu users, though they should work for any other Debian-based distributions.

> If you have an error during this process, check the [Common Errors](#common-errors-during-installation) section at the end of this document.

#### 1. Clone the repository

    git clone https://ci.linagora.com/linagora/lgs/openpaas/esn.git
    # or
    git clone https://github.com/linagora/openpaas-esn.git

Go into the project folder

    cd esn

> Note: All following commands need to be run within the project folder.

#### 2. Get required services

OpenPaaS relies on various other services for its core functionalities, such as MongoDB, Redis, Elasticseach, SabreDAV or Apache James.

The recommended way (described below) to get them without tedious install steps is using our development docker-compose recipe. It will allow you to run those services using Docker containers and start the current OpenPaaS ESN repository in your preferred NodeJS environment.

> Note: if you prefer installing all services in your machine or don't want to use docker, you can have a look at [this documentation](./required-services.md), then continue with the next sections. But it's not recommended.

##### Get Docker & docker-compose

Install the last stable version of [docker](https://docs.docker.com/install/#supported-platforms) && [docker-compose](https://docs.docker.com/compose/install/) following official documentation.

> Verify that you can execute docker commands as a non-root user, running:   
`docker run hello-world`     
If it doesn't work, see this documentation on [how to run docker as a non-root user](https://docs.docker.com/install/linux/linux-postinstall/#manage-docker-as-a-non-root-user).

#### Download & run the services

From the ESN folder, run this docker-compose command:
```
ESN_HOST="172.17.0.1" ESN_PATH="$PWD" docker-compose -f ./docker/dockerfiles/dev/docker-compose.yml up
```

> You can save the above command (using an alias for example with an absolute path to the file) as you will need to run it everytime you need to start the containers.

> The ESN_HOST variable is used by containers to access the API of the ESN that you will run locally (This is the case for SabreDAV for example). This is useful when working on non Linux host since docker containers can not reach localhost since they run in a virtual machine.
`172.17.0.1` is for linux-based systems, on OS X and windows enter the docker-machine IP (default machine is accessible at `192.168.99.100`)

Once this is done, you should have all the services running and can continue to the ESN installation itself. Add the `-d` option to the above command to have services running in background.

#### Troubleshoot on Fedora and other RHEL-based distributions

##### No route to host

On Fedora, SabreDAV may have troubles contacting ESN from its container. If you see the following error in SabreDAV containter's logs:

```
<d:error xmlns:d="DAV:" xmlns:s="http://sabredav.org/ns">
  <s:sabredav-version>3.2.0</s:sabredav-version>
  <s:exception>Sabre\HTTP\ClientException</s:exception>
  <s:message>Failed to connect to 172.17.0.1 port 8080: No route to host</s:message>
  <s:file>/var/www/vendor/sabre/http/lib/Client.php</s:file>
  <s:line>356</s:line>
  <s:code>7</s:code>
  <s:stacktrace>#0 /var/www/vendor/sabre/http/lib/Client.php(103): Sabre\HTTP\Client-&gt;doRequest(Object(Sabre\HTTP\Request))
```

This may be a problem with `firewalld`. Follow the instructions [here](https://support.onegini.com/hc/en-us/articles/115000769311-Firewalld-error-with-Docker-No-route-to-host-) to authorize intercontainer communication.

#### 3. Install node.js

You can use [nvm](https://github.com/creationix/nvm) to install Node.js. Once `nvm` is installed, type the following commands in the directory of your project :

```
nvm install `cat .nvmrc`
nvm use
```

#### 4. Install additional packages
With an Ubuntu installation, you need to install additional packages to run ESN:

    sudo apt-get install build-essential python-setuptools graphicsmagick graphicsmagick-imagemagick-compat libcairo2-dev libpango1.0-dev libgif-dev libjpeg-dev libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev build-essential g++

#### 5. Install project dependencies
OpenPaaS uses npm for its backend dependencies and bower for frontend dependencies.
Install bower globally:

    npm install -g bower

We also rely on Grunt to run development-related tasks. Install it globally by running:

    npm install -g grunt-cli

Go into the project directory and install project dependencies (not as an administrator)

    npm install

#### 6. Configure your ESN

You have to add some configuration so that OpenPaaS will know how to access services. This is possible with the OpenPaaS CLI.

##### a. Database connection

Generate the *config/db.json* file first. This will be used by the nodejs application to connect to its MongoDB database running in docker:

```bash
node ./bin/cli.js db --host 172.17.0.1
```

> 172.17.0.1 is for linux. It's the IP where MongoDB launched by docker-compose above can be reached. You will have to set your docker-machine IP on OS X or Windows.

##### b. External services parameters and default users provisionning

Now that the database access is configured, you can setup configuration and provision some users in the ESN with the help of the CLI:

```bash
node ./bin/cli.js docker-dev
```

##### c. Elevate the admin user as platform admin

The previous command created user accounts within the `open-paas.org` default domain, including a domain admin.
To have this admin manage the whole OpenPaaS platform (not only his domain), elevate his privileges to `platform admin` by running:

```bash
node ./bin/cli.js platformadmin init --email admin@open-paas.org
```

#### 7. Run it
You are now ready to go!

Start the ESN server in development mode:

```bash
grunt dev
```

Whenever you make changes to server files, the server will be restarted. Make sure you have started the mongo, redis, rabbitmq and elasticsearch servers beforehand (through docker or locally).

Your ESN can now be reached at the following address: http://localhost:8080.

You can connect with the default admin user:
> Username: `admin@open-paas.org`    
> Password: `secret`

You can also log in as any other demo user, their username is `user[0-9]@open-paas.org` and their password is always `secret`.

While developing, you have some environement variables, to help you speed up on your job.

    ESN_CSS_CACHE_OFF=true grunt dev

Will force the less->css to be generated on every call.

    ESN_CSS_CACHE_ON=true grunt dev

Will enable the less->css cache: the compilation will happen only once.

Of course, you can also start ESN using:

    node server.js

------------

## Tools & developers information

### Testing

You can check that everything works by launching the test suite (this may be long):

    grunt --chunk=1

Note that, due to the large amount of tests, you eventually need the `--chunk=1` option. It will create one new nodejs process per js test file. It prevents the memory to be overused by mocha, which would lead to tests failures.
If you want to launch tests from a single test, you can specify the file as command line argument.
For example, you can launch the backend tests on the test/unit-backend/webserver/index.js file like this:

    grunt test-unit-backend --test=test/unit-backend/webserver/index.js

Note: This works for backend and midway tests.

Some specialized Grunt tasks are available, check the Gruntfile.js for more:

    grunt linters # launch hinter and linter against the codebase
    grunt test-frontend # only run the fontend unit tests
    grunt test-unit-backend # only run the unit backend tests
    grunt test-midway-backend # only run the midway backend tests
    grunt test # launch all the testsuite

### Debug

You can debug the backend thanks to Node debugger. Launch with the `--inspect` flag or `--inspect-brk` if you want to break on the first line of the application

    node --inspect server.js

    Debugger listening on ws://127.0.0.1:9229/fe0b0fa5-6a26-4ac3-ac74-c6f254c2e24c
    For help see https://nodejs.org/en/docs/inspector

This debugger can be reached in two ways as explained [here](https://nodejs.org/en/docs/inspector/#inspector-tools-clients). Once done you will have the message `Debugger attached` in your terminal. Now you can add breakpoints, inspect, have fun and feel the power.

If you need to have access to the source code (not the minified one), then you should do:

    NODE_ENV="dev" node --inspect --inspect-brk server.js

Yon can also debug backend tests using `INSPECT=true` environment variable:

    INSPECT=true grunt test-midway-backend
    ...
    Debugger listening on ws://127.0.0.1:9229/1859ec1c-bbc8-4044-9f5c-d9dd71e7720f
    For help see https://nodejs.org/en/docs/inspector

## Cli usage

The ESN cli can be used for several maintenance commands such as reindexing data in Elasticsearch.
See [the cli documentation](./cli.md) for more information.

## Fixtures

Fixtures can be configured in the fixtures folder and injected in the system using grunt:

    grunt fixtures

Note that you must configure contents of files inside **fixtures/config/data** and **fixtures/esn-config/data/** to match your environment, particularly **fixtures/config/data/db.js** in which the host of the mongodb database is defined. Also note that this will override all the current configuration resources with the fixtures ones.

------------

## Common errors during installation

#### Execute from the ESN Folder

All commands should be run from the `esn` project folder. Check that you are correctly placed or use `cd` to go into the `esn` folder you cloned using git.

#### When running `npm install`
###### EACCESS error

`npm install` may fail with EACCESS and you may need to remove ~/.npm and repeat step 5.

###### Cairo & node-canvas

If you have any problem related to `node-canvas` during the dependencies installation, you might have an issue with [Cairo](http://cairographics.org/).  

Check that the installation of the [packages listed above](#4-install-additional-packages) worked fine with `apt-get`.

###### Ursa module

If you have issues related to the `ursa` module, you need to reinstall the npm dependencies:

    rm -rf node_modules/
    npm install

#### Default values for Cli commands
If you changed default values from the docker-compose file (you shouldn't need to do that), you might need additional options that can be passed to the `node ./bin/cli.js` commands above so they can talk to the right container. See the [Cli documentation](./cli.md) about that.
