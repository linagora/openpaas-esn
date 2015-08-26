OpenPaas
=======

This is a social network for enterprises & organizations.

Installation on Ubuntu
-------------------------

This manual will guide you through the system-wide installation process of elasticsearch, mongodb and nodeJS on Linux/ubuntu

See also [General installation instructions](https://ci.open-paas.org/stash/projects/OR/repos/rse/browse/README.md)

1. Open a terminal and install git

        sudo apt-get install git

2. clone the repository

        git clone https://ci.open-paas.org/stash/scm/or/rse.git

3. Install ElasticSearch 1.3.5
 Download and install ElasticSearch 1.3.5 [deb package](https://www.elastic.co/downloads/past-releases/elasticsearch-1-3-5) from elastic website

        wget https://download.elastic.co/elasticsearch/elasticsearch/elasticsearch-1.3.5.deb
        sudo dpkg -i elasticsearch-1.3.5.deb

 Pin the version to avoid unwanted updates

        echo "elasticsearch hold" | sudo dpkg --set-selections

 Create a symlink to your elastic search bin somewhere in your path if this was not done during the previous step (alternatively, you can add /usr/share/elasticsearch/bin/ to your path)

        sudo ln -s /usr/share/elasticsearch/bin/elasticsearch /usr/bin/elasticsearch

 **Only the elasticsearch user should be able to install plugins**
Elasticsearch plugin dir may have not been created during the installation, or may have been given ownership to root. [This was a bug](https://github.com/elastic/elasticsearch/issues/8419)

        sudo mkdir /usr/share/elasticsearch/plugins
        sudo chown elasticsearch:elasticsearch /usr/share/elasticsearch/plugins
        sudo chmod 755 /usr/share/elasticsearch/plugins

 **Config dir may have not been created (when in a sysV system)**

        sudo ln -s /etc/elasticsearch /usr/share/elasticsearch/config

4. Install MongoDB 2.6.5 from the mongoDB repositories [instructions](http://docs.mongodb.org/v2.6/tutorial/install-mongodb-on-ubuntu/)

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

5. Retrieve rse-scripts
        git clone https://ci.open-paas.org/stash/scm/or/rse-scripts.git

 Run the scripts (java and curl are needed)

        sudo apt-get install openjdk-7-jdk curl

 Specify the path to ElasticSearch plugin and run the first script (as elasticsearch user):

        sudo -u elasticsearch bash
        export ES_BIN_PLUGIN=/usr/share/elasticsearch/bin/plugin
        ./1_elasticsearch_river_install.sh

 Start elasticsearch and run the second script (as your regular sudoer user)
        
        sudo service elasticsearch start
 or
 
        sudo /usr/share/elasticsearch/bin/elasticsearch -Des.pidfile=$PID_DIR/elasticsearch.pid -Des.default.path.home=$ES_HOME -Des.default.path.logs=$LOG_DIR -Des.default.path.data=$DATA_DIR -Des.default.config=$CONF_FILE -Des.default.path.conf=$CONF_DIR

 Wait until elasticsearch is up

        ./2_config_elasticsearch_analyser.sh

 Before running step 3, you must configure MongoDB cluster in replica set. Open `/etc/mongod.conf` and modify replSet

        replSet=rs
        
 Then restart MongoDB

        service mongod restart

 This may fail **in ubuntu 15.04** and you may need to start it as `mongod --replSet=rs`

 Change the hostname of the machine to 127.0.0.1 (**this will break communication between your terminal and X**)

        hostname 127.0.0.1

 Open the mongo shell (with `mongo`) and launch

        > rs.initiate()

 About a minute later, you will have a PRIMARY prompt that will appear when checking the status of MongoDB

        > rs.status()
        
 Then continue with 3rd script (when the cluster is running as a PRIMARY node)

        3_config_elasticsearch_mongodb_river.sh

 **After successfully running this script, you can restore your hostname**

 If you missed something during the previous steps, a script `delete_elasticsearch_mongodb_river.sh` is available. After using it, please go back to step 2 again.

6. Install node.js

 Please note that your version of node.js must be greater than version 0.10.28 but less than or equal to 0.10.36. We highly recommend that you use [nvm](https://github.com/creationix/nvm) to install a specific version of node.

        curl https://raw.githubusercontent.com/creationix/nvm/v0.11.1/install.sh | bash

 You will have to reopen your terminal or run source ~/.profile

        nvm install 0.10.36

 Usually, nvm will switch to use the most recently installed version. You can explicitly tell nvm to use the version we just downloaded by typing:

        nvm use 0.10.36

 For a system-wide install, run this command now and **any time you change your node version**

        n=$(which node);n=${n%/bin/node}; chmod -R 755 $n/bin/*; sudo cp -r $n/{bin,lib,share} /usr/local

7. You may need some additional packages.

        sudo apt-get install build-essential redis-server python-setuptools graphicsmagick graphicsmagick-imagemagick-compat libcairo2-dev libpango1.0-dev libgif-dev

8. Install the npm dependencies

        sudo npm install -g mocha grunt-cli bower karma-cli #node-gyp
    
9. Install the gjslint dependency

        sudo easy_install http://closure-linter.googlecode.com/files/closure_linter-latest.tar.gz

    more informations [can be found here](https://developers.google.com/closure/utilities/docs/linter_howto)
    
10. Go into the project directory and install project dependencies (not as an administrator)

        cd rse
        npm install

 This may fail with EACCESS and you may need to remove ~/.npm and repeat step 10

If you have any problem relating to `node-canvas` during the dependencies installation,
make sure your system has installed [Cairo](http://cairographics.org/). Documentation [can be found here](https://github.com/Automattic/node-canvas).

Testing
-------

You can check that everything works by launching the test suite:

    grunt

If you want to launch tests from a single test, you can specify the file as command line argument.
For example, you can launch the backend tests on the test/unit-backend/webserver/index.js file like this:

    grunt test-unit-backend --test=test/unit-backend/webserver/index.js

Note: This works for backend and midway tests.

Some specialized Grunt tasks are available :

    grunt linters # launch hinter and linter against the codebase
    grunt test-frontend # only run the fontend unit tests
    grunt test-unit-backend # only run the unit backend tests
    grunt test-midway-backend # only run the midway backend tests
    grunt test # launch all the testsuite

Fixtures
--------

Fixtures can be configured in the fixtures folder and injected in the system using grunt:

    grunt fixtures

