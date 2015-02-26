OpenPaas
=======

This is a social network for enterprises & organizations.

Installation
------------

1. clone the repository

        git clone https://ci.open-paas.org/stash/scm/or/rse.git

2. You may need some additional packages. For example with a Debian installation, as an administrator you should use the following commands:

	apt-get install build-essential redis-server mongodb npm python-setuptools graphicsmagick graphicsmagick-imagemagick-compat

You also need node.js. Please note that your version of node.js must be greater than version 0.10.28 but less than or equal to 0.10.36. We highly recommend that you use [nvm](https://github.com/creationix/nvm) to install a specific version of node.

3. Install the npm dependencies (as an administrator)

        npm install -g mocha grunt-cli bower karma-cli
    
4. Install the gjslint dependency (as an administrator)

        easy_install http://closure-linter.googlecode.com/files/closure_linter-latest.tar.gz

    more informations [can be found here](https://developers.google.com/closure/utilities/docs/linter_howto)
    
5. Go into the project directory and install project dependencies

        cd rse
        npm install

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
    grunt test-midway-bakend # only run the midway backend tests
    grunt test # launch all the testsuite

Fixtures
--------

Fixtures can be configured in the fixtures folder and injected in the system using grunt:

    grunt fixtures

Note that this will override all the current configuration resources with the fixtures ones.

Starting the server
------------------

You should first start mongodb and redis-server.

Then npm start to start the ESN server !
 
    npm start


Your ESN can be reached at the following address: http://<ip>:8080. Now simply follow the wizard to 
prepare your working ESN with MongoDB port (default is 27017)
    

Develop the ESN
---------------

Running `grunt dev` will start the server in development mode. Whenever you
make changes to server files, the server will be restarted. Make sure you have
started the mongo, redis and elasticsearch servers beforehand.

In addition, you can run `grunt debug` to start the node-inspector debugger
server. Visit the displayed URL in Chrome or Opera to start the graphical
debugging session. Note that startup takes a while, you must wait until the ESN
webserver starts to do anything meaningful.

Licence
-------

[Affero GPL v3](http://www.gnu.org/licenses/agpl-3.0.html)
