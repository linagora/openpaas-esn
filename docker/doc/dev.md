# Setup a Dev environment with Docker

You can launch the minimum set of OpenPaaS required services (Mongo, Redis, Elasticseach, SabreDAV) in Docker containers
and start the current OpenPaaS ESN repository in your preferred NodeJS environment with the help of docker-compose and some initial setup.

```
ESN_HOST=<YOUR_ESN_IP> ESN_PATH=$PWD docker-compose -f ./docker/dockerfiles/dev/docker-compose.yml up
```

- The YOUR_ESN_IP environment variable is used by components to access to the ESN API (This is the case for SabreDAV for example).
This is useful when working on non Linux host since docker containers can not reach localhost since they run in a virtual machine.

**Note** that services may be accessible at different IPs based on the platform you are running docker-compose on:

- 172.17.0.1 on Linux-based systems
- The docker-machine IP on OS X and Windows (default machine is accessible at 192.168.99.100).

Once started, you have to add some configuration so that OpenPaaS will know how to access services. This is possible with the OpenPaaS CLI:

Generate the *config/db.json* file first. This will be use to connect to the Mongo instance:

```bash
node ./bin/cli.js db --host <YOUR_DOCKER_IP> --port <PORT> --database <DBNAME>
```

- YOUR_DOCKER_IP is the IP where MongoDB launched by docker-compose above can be reached (check the note above)
- PORT is the MongoDB port (default to 27017 which is the one defined by docker-compose above)
- DBNAME is the database name to use (default to esn which is the one defined by docker-compose above)

The 'host' parameter is the only one to change here. The default value should work on Linux computers, while you will have to set your docker-machine IP on OS X or Windows.

Now that the database is configured, you can setup configuration and provision some users in the ESN with the help of the CLI:


```bash
node ./bin/cli.js docker-dev --host <YOUR_DOCKER_IP> --port <PORT> --database <DBNAME>
```

- YOUR_DOCKER_IP is the IP where MongoDB launched by docker-compose above can be reached (check the note above)
- PORT is the MongoDB port (default to 27017 which is the one defined by docker-compose above)
- DBNAME is the database name to use (default to esn which is the one defined by docker-compose above)

Now that all is configured and provisioned, you can run your local ESN as usual:

 ```bash
 npm start
 ```

## Working on esn-sabre code

If you also working on esn-sabre and you do not want to have to rebuild linagora/esn-sabre and restart docker-compose each time you change
the code, you can run the following command. However if you edit the composer.json, you will have to rebuild the image.

```
ESN_HOST=<YOUR_ESN_IP> ESN_SABRE_PATH=/path/to/esn-sabre ESN_PATH=$PWD docker-compose -f ./docker/dockerfiles/dev/docker-compose-sabre-dev.yml up
```

If you also need to modify library code for debugging purpose, you will need to install composer in order to build the esn-sabre dependencies on your machine and not inside docker. On ubuntu that will be

```
sudo apt-get install composer
```

Then you will need to fetch the esn-sabre dependencies:
```
cd /path/to/esn-sabre
composer install --ignore-platform-reqs
```
Now, when you edit the esn-sabre dependencies, changes are reflected inside the container.

If you want to watch log of Sabre, you can do it with the following command:
```
docker exec -it dev_sabre_1 tail -f /var/log/nginx/error.log
```

where `dev_sabre_1` is the container name that run Sabre, you can check it with:
```
docker ps
```

### Debugging esn-sabre

The image `dev_sabre_1` has xdebug installed on it. Here is a small tutorial on how to use it with PhpStorm and Visual Studio Code:

### Visual Studio Code

* Install the extension [Php Debug](https://marketplace.visualstudio.com/items?itemName=felixfbecker.php-debug)
* Go to the Debug view (on the left panel: `Ctrl + Shift + D`)
* Add a new configuration:

```
  {
    "name": "Listen for XDebug",
    "type": "php",
    "request": "launch",
    "port": 9000,
    "localSourceRoot": "${workspaceRoot}",
    "serverSourceRoot": "/var/www"
 }
```

### PhpStorm

* On PhpStorm go to `File -> Settings -> Languages & Frameworks -> PHP -> Debug`. Check that those parameters are the same:
    * Xdebug:
        * **Debug port:** 9000
* Still on the Settings window: `Languages & Frameworks -> PHP -> Servers`. Add a new server with those parameters:
    * **Name:** sabre-dev
    * **Host:** localhost
    * **Port:** 8001
    * **Debugger:** Xdebug
    * Check Use path mappings:
        * Project Files:
            * **File/Directory:** you sabre local path
            * **Absolute path on the server:** /var/www
* Go to `Run -> Edit Configurations...`. Add a new `Php Remote Debug` configuration with those parameters:
    * **Name:** sabre-debug
    * **Servers:** sabre-dev
    * **Ide key(session id):** debug
