# End to end tests

Running OpenPaas end to end tests.

## E2E test using Docker (recommended)

With the help of Docker, you will have full running instance of OpenPaas for
testing purpose. Check documentation [here](https://ci.linagora.com/linagora/lgs/openpaas/esn/blob/master/docker/doc/tests.md).

## E2E test without Docker (experimental)

Sometimes, you do not want to use Docker to run E2E tests. Maybe you do not have enough RAM or
starting a full instance of OpenPaas costing you too much time. Maybe you do not
need to test all features of OpenPaas, consequentially you do not have to set
up a _full_ instance of OpenPaas.

### Prepare an OpenPaas instance

Firstly, you must have an OpenPaas instance running on your machine. Required
services are just MongoDB and Redis, make sure they are running then start your
OpenPaas instance by bellow command:

`npm start`

or

`grunt dev`

Other services might be needed depending on your testing purpose such as
ElasticSearch, ESN Sabre, James. Make sure that it works fine by opening OpenPaas
manually with your favourite browser. If it doesn't work on your browser, obviously
it's impossible to run E2E test.

### Run E2E tests

When OpenPaas instance is ready, you can start running E2E tests.

Start Selenium server:

`./node_modules/grunt-protractor-runner/node_modules/protractor/bin/webdriver-manager start`

Run E2E tests:

`LOCAL=true grunt run_grunt:e2e`

You can also use other environment variables to match your need:

- `BROWSER`: specify your browser to run E2E test, such as `chrome` or `firefox`.
- `TAGS`: specify tags to run only test cases with corresponding tags.

This example command will run E2E tests with Google Chrome browser and only run
test cases that have `@only` tag:

`LOCAL=true TAGS=@only BROWSER=chrome grunt run_grunt:e2e`

### Clean your data

Note that by running E2E tests manually, your data will not be cleaned after
each test. You will have to clean data produced by E2E tests to avoid unexpected
result while running tests.
