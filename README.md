# OpenPaas

[![Code Climate](https://codeclimate.com/github/linagora/openpaas-esn/badges/gpa.svg)](https://codeclimate.com/github/linagora/openpaas-esn)

OpenPaaS is a collaboration platform for enterprises & organizations.

## Installation (see there for [Ubuntu install](https://github.com/linagora/openpaas-esn/blob/master/doc/install-ubuntu.md))

1.clone the repository

    git clone https://ci.linagora.com/linagora/lgs/openpaas/esn.git
    # or
    git clone https://github.com/linagora/openpaas-esn.git

2.Install dependencies

You can install dependencies yourself, or use the Docker environment as described in [./docker/doc/README.md](./docker/doc/README.md).

- ElasticSearch v2.3.2
- MongoDB v2.6.5
- Redis 3.x
- RabbitMQ 3.6.x

3.Install node.js

You can use [nvm](https://github.com/creationix/nvm) to install Node.js. Once `nvm` is installed, type the following commands in the directory of your project :

```
nvm install `cat .nvmrc`
nvm use
```

4.You may need some additional packages. For example with a Debian installation, as an administrator you should use the following command:

    apt-get install build-essential redis-server rabbitmq-server python-setuptools graphicsmagick graphicsmagick-imagemagick-compat libjpeg-dev

5.Install Sabre/dav

Follow [sabre installation instructions](https://ci.linagora.com/linagora/lgs/openpaas/esn-sabre/blob/master/README.md).

6.Install the npm dependency

    npm install -g bower

7.Go into the project directory and install project dependencies (not as an administrator)

    npm install

If you have any problem relating to `node-canvas` during the dependencies installation,
make sure your system has installed [Cairo](http://cairographics.org/). Documentation [can be found here](https://github.com/Automattic/node-canvas).

If during further manipulations you encounter errors with node modules, try to reinstall them

    rm -rf node_modules/
    npm install

## Testing

You must install npm dependency first

    npm install -g grunt-cli

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

## Debug

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


## Fixtures

Fixtures can be configured in the fixtures folder and injected in the system using grunt:

    grunt fixtures

Note that you must configure contents of files inside **fixtures/config/data** and **fixtures/esn-config/data/** to match your environment, particularly **fixtures/config/data/db.js** in which the host of the mongodb database is defined. Also note that this will override all the current configuration resources with the fixtures ones.

## Elasticsearch Index

Before start using OpenPaaS, you should create indexes on Elasticsearch. If you are not familiar with elasticsearch indexes then please have a look [here](https://www.elastic.co/guide/en/elasticsearch/guide/current/index-doc.html).

To do so, you can simply run the following command from your OpenPaaS folder:

    node ./bin/cli.js elasticsearch

## Starting the server

You should first start mongodb, redis and elasticsearch and [configure OpenPaaS](./doc/configuration.md).

Then 'npm start' to start the OpenPaaS web application:

    npm start


If you encounter the following problem when starting OpenPaaS: `Getting error : [nodemon] Internal watch failed: watch ENOSPC`, then the limit set per user for the max number of watches is reached. To deal with this error, you should do the following:

    echo fs.inotify.max_user_watches=582222 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p

Your ESN can be reached at the following address: http://localhost:8080. Now simply follow the setup wizard.

## Develop OpenPaaS

Running `grunt dev` will start the server in development mode. Whenever you
make changes to server files, the server will be restarted. Make sure you have
started the mongo, redis, rabbitmq and elasticsearch servers beforehand.

While developing, you have some environement variables, to help you speed up on your job.

    ESN_CSS_CACHE_OFF=true grunt dev

Will force the less->css to be generated on every call.

    ESN_CSS_CACHE_ON=true grunt dev

Will enable the less->css cache: the compilation will happen only once.

## Docker

A Docker environment is provided to ease all the setup for various environments (development, demonstration, ...).
It allows to start Docker containers for all the dependencies without having to install anything else than Docker and without having to configure all by hand.

For more details, check the documentation on [./docker/doc/README.md](./docker/doc/README.md)

## Licence

[Affero GPL v3](http://www.gnu.org/licenses/agpl-3.0.html)