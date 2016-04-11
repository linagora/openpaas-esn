# Testing OpenPaaS ESN with Docker

Unit tests and integration tests are launched with Grunt (cf Gruntfile.js at the root of the repository).
They can also be launched in Docker containers with the help of the grunt-docker-spawn plugin.

## Unit and integration tests

The related grunt tasks are all starting with the 'docker-' prefix:

- docker-test
- docker-test-unit-storage
- ...

## End to end tests

Before you can start running any E2E tests, run bellow command to prepare an
E2E testing environment:

```bash
grunt test-e2e-prepare
```

Above command will update web driver, pull or build required Docker images, etc.
Once it runs successful, you can perform a full E2E test with:

```bash
grunt test-e2e
```

This is regular way to run end-to-end tests. It will create all required ESN
containers, wait for each service to be available, run protractor tests and then
stop/garbage all containers.

### E2E test in development

Anytime you change your ESN code, you may want to rebuild your ESN image with:

```bash
grunt test-e2e-build
```

If you have newer version of service images like esn-sabre, esn-elasticsearch, etc.
You can pull latest version of them with (don't forget to build ESN images again
after a pull):

```bash
grunt test-e2e-pull
```

By running `grunt test-e2e`, it will remove the containers after it finishes.
Instead, you can skip the containers removal to save time while you're writing
tests. By using the following command, you will reuse the same containers over
the time. So use it carefully, as for example, your database data won't be
removed between tests!

```bash
grunt test-e2e-quick
```

If an unexpected issue makes the container removal failing
(see `docker ps` output), you can do it manually with:

```bash
grunt test-e2e-down
```

#### Run only specified E2E tests

When you have many E2E tests, you may not want to run them all on each time you
write E2E tests for your code. In such cases, you can run only specified
scenarios by leveraging Cucumber [tags](https://github.com/cucumber/cucumber/wiki/Tags).

Let's specify a tag for your feature:

```
@only
Feature: Verify billing
```

Then test only that feature by:

```bash
tags=@only grunt test-e2e-quick
```

#### Logging

If you want more logs, use `--show-logs` option with E2E test tasks, for example:

```bash
grunt test-e2e-prepare --show-logs
```

## Docker settings

While the tests should work out of the box on a Linux platform locally, they need some additional parameters to run on Windows and OS X or on remote host.

```bash
DOCKER_HOST=192.168.99.100 DOCKER_PORT=2376 DOCKER_CERT_PASS=mypass grunt docker-test-modules-midway --docker remote
```

By using the *DOCKER\_* environment variables, we give grunt required environment variables to launch container on the *remote* machine.
The remote configuration is also defined in the Gruntfile under the container.options configuration:

```json
  {
    remote: {
      host: process.env.DOCKER_HOST || '192.168.99.100',
      port: process.env.DOCKER_PORT || 2376,
      ca: fs.readFileSync(process.env.DOCKER_CERT_PATH + '/ca.pem', 'utf-8'),
      cert: fs.readFileSync(process.env.DOCKER_CERT_PATH + '/cert.pem', 'utf-8'),
      key: fs.readFileSync(process.env.DOCKER_CERT_PATH + '/key.pem', 'utf-8'),
      pass: process.env.DOCKER_CERT_PASS || 'mypass'
    }
  }
```

Note that you may need to generate P12 certificates on OS X (As explained here http://blog.couchbase.com/2016/february/enabling-docker-remote-api-docker-machine-mac-osx).

On the docker-machine VM:

```bash
cd $DOCKER_CERT_PATH
```

then

```bash
openssl pkcs12 -export \
-inkey key.pem \
-in cert.pem \
-CAfile ca.pem \
-chain \
-name client-side \
-out cert.p12 \
-password pass:mypass
```

Please note that the password defined just here is the same which is used in DOCKER_CERT_PASS environment variable in the remote configuration above.
