# Install OpenPaas required services on Ubuntu

This guide aims to help you install the following dependencies, required for OpenPaaS to run on your machine:

- ElasticSearch v6.3.2
- MongoDB v2.6.5
- Redis 3.x
- RabbitMQ 3.6.x

> To avoid these steps, you can get those dependencies running in containers, using docker & docker-compose. Have a look at [Step 2 of the recommended installation process](./develop.md#2-get-required-services)!

### 1.Install ElasticSearch 6.3.2
 Download and install ElasticSearch 6.3.2 [deb package](https://www.elastic.co/downloads/past-releases/elasticsearch-6-3-2) from elastic website

        wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-6.3.2.deb
        sudo dpkg -i elasticsearch-6.3.2.deb

 Pin the version to avoid unwanted updates

        echo "elasticsearch hold" | sudo dpkg --set-selections

 Create a symlink to your elastic search bin somewhere in your path if this was not done during the previous step (alternatively, you can add /usr/share/elasticsearch/bin/ to your path)

        sudo ln -s /usr/share/elasticsearch/bin/elasticsearch /usr/bin/elasticsearch

 **Config dir may have not been created (when in a sysV system)**

        sudo ln -s /etc/elasticsearch /usr/share/elasticsearch/config

### 2.Install MongoDB 2.6.5 from the mongoDB repositories 
[Instructions](http://docs.mongodb.org/v2.6/tutorial/install-mongodb-on-ubuntu/)

  Import GPG key

        sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10

  Create list file for mongoDB

        echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | sudo tee /etc/apt/sources.list.d/mongodb.list

  Update apt cache

        sudo apt-get update

  Install mongoDB 2.6.5

        sudo apt-get install -y mongodb-org=2.6.5 mongodb-org-server=2.6.5 mongodb-org-shell=2.6.5 mongodb-org-mongos=2.6.5 mongodb-org-tools=2.6.5

  Pin current version to avoid updates (lastest version in this repository is 2.6.9 but this may vary)

        echo "mongodb-org hold" | sudo dpkg --set-selections
        echo "mongodb-org-server hold" | sudo dpkg --set-selections
        echo "mongodb-org-shell hold" | sudo dpkg --set-selections
        echo "mongodb-org-mongos hold" | sudo dpkg --set-selections
        echo "mongodb-org-tools hold" | sudo dpkg --set-selections

  _Note for Ubuntu 16.04:_

  In order to properly launch MongoDB as a service on Ubuntu 16.04, we additionally need to create a unit file called `mongodb.service` describing the service inside `/etc/systemd/system`:

        sudo nano /etc/systemd/system/mongodb.service

  In `mongodb.service`, paste in the following contents:

        [Unit]
        Description=High-performance, schema-free document-oriented database
        After=network.target

        [Service]
        User=mongodb
        ExecStart=/usr/bin/mongod --quiet --config /etc/mongod.conf

        [Install]
        WantedBy=multi-user.target

### 3.Install Redis

    sudo apt-get install redis-server

### 4.Install Sabre/dav

Follow [sabre installation instructions](https://ci.linagora.com/linagora/lgs/openpaas/esn-sabre/blob/master/README.md).


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
    "pathMappings": {"/var/www": "${workspaceRoot}"}
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
