# OpenPaas installation on Ubuntu

This manual will guide you through the system-wide installation process of elasticsearch, mongodb and nodeJS on Linux/ubuntu

See also [General installation instructions](https://ci.linagora.com/linagora/lgs/openpaas/esn/blob/master/README.md)

1.Open a terminal and install git

        sudo apt-get install git

2.clone the repository

        git clone https://ci.linagora.com/linagora/lgs/openpaas/esn.git

3.Install ElasticSearch 2.3.2
 Download and install ElasticSearch 2.3.2 [deb package](https://www.elastic.co/downloads/past-releases/elasticsearch-2-3-2) from elastic website

        wget https://download.elastic.co/elasticsearch/release/org/elasticsearch/distribution/deb/elasticsearch/2.3.2/elasticsearch-2.3.2.deb
        sudo dpkg -i elasticsearch-2.3.2.deb

 Pin the version to avoid unwanted updates

        echo "elasticsearch hold" | sudo dpkg --set-selections

 Create a symlink to your elastic search bin somewhere in your path if this was not done during the previous step (alternatively, you can add /usr/share/elasticsearch/bin/ to your path)

        sudo ln -s /usr/share/elasticsearch/bin/elasticsearch /usr/bin/elasticsearch

 **Config dir may have not been created (when in a sysV system)**

        sudo ln -s /etc/elasticsearch /usr/share/elasticsearch/config

4.Install MongoDB 2.6.5 from the mongoDB repositories [instructions](http://docs.mongodb.org/v2.6/tutorial/install-mongodb-on-ubuntu/)

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

5.Install node.js

Please note that your version of node.js must be 8.x.x
We highly recommend that you use [nvm](https://github.com/creationix/nvm) to install a specific version of node.

        curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.32.1/install.sh | bash

 You will have to reopen your terminal or run source ~/.profile

        nvm install 8

 Usually, nvm will switch to use the most recently installed version. You can explicitly tell nvm to use the version we just downloaded by typing:

        nvm use 8

 For a system-wide install, run this command now and **any time you change your node version**

        n=$(which node);n=${n%/bin/node}; chmod -R 755 $n/bin/*; sudo cp -r $n/{bin,lib,share} /usr/local

6.You may need some additional packages.

        sudo apt-get install build-essential redis-server python-setuptools graphicsmagick graphicsmagick-imagemagick-compat libcairo2-dev libpango1.0-dev libgif-dev

7.Install the npm dependency

    npm install -g bower

8.Go into the project directory and install project dependencies (not as an administrator)

        cd rse
        npm install

 This may fail with EACCESS and you may need to remove ~/.npm and repeat step 9

If you have any problem relating to `node-canvas` during the dependencies installation,
make sure your system has installed [Cairo](http://cairographics.org/). Documentation [can be found here](https://github.com/Automattic/node-canvas).

If during further manipulations you encounter errors with node modules, try to reinstall them

    rm -rf node_modules/
    npm install

9.Install Sabre/dav

Follow [sabre installation instructions](https://ci.linagora.com/linagora/lgs/openpaas/esn-sabre/blob/master/README.md).

## Testing

You must install npm dependency first

    npm install -g grunt-cli

You can check that everything works by launching the test suite (this may be long):

    grunt --chunk=1

Note that, due to the large amount of tests, you eventually need the `--chunk 1` option. It will create one new nodejs process per js test file. It prevents the memory to be overused by mocha, which would lead to tests failures.
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

## Fixtures

Fixtures can be configured in the fixtures folder and injected in the system using grunt:

    grunt fixtures

Note that you must configure contents of files inside **fixtures/config/data** and **fixtures/esn-config/data/** to match your environment, particularly **fixtures/config/data/db.js** in which the host of the mongodb database is defined. Also note that this will override all the current configuration resources with the fixtures ones.
