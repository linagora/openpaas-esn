Hiveety
=======

This is a social network for enterprises & organizations.

Installation
------------

1. clone the repository

        git clone http://ci-openpaas.linagora.com/stash/scm/or/rse.git

2. install node.js

3. install the npm dependencies

        npm install -g mocha grunt-cli bower karma
    
4. install the gjslint dependency

        easy_install http://closure-linter.googlecode.com/files/closure_linter-latest.tar.gz

    more informations [can be found here](https://developers.google.com/closure/utilities/docs/linter_howto)
    
5. Go into the project directory and install project dependencies

        cd rse
        npm install

Testing
-------

You can check that everything works by launching the test suite:

    grunt
    

Starting the server
------------------

Use npm start to start the server !

    npm start
    

Develop the ESN
---------------

Use 

    grunt dev

to start the server in development mode.

Licence
-------

[Affero GPL v3](http://www.gnu.org/licenses/agpl-3.0.html)
