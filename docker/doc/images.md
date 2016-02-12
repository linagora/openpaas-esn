## Images

We currently use several official images, and some custom ones:

- Redis: redis:latest
- MongoDB: mongo:2.6.6
- Apache Cassandra: cassandra:2.2.3
- Apache James: linagora/james-project
- Elastic Search: linagora/esn-elasticsearch and elasticsearch:1.5.2
- Sabre DAV: linagora/esn-sabre

## linagora/esn-base

The OpenPaaS ESN uses a base image which contains all required npm and bower dependencies so that it is quick to build distributions on top of it.
This image is located under docker/dockerfiles/base/Dockerfile. You can build it from the project home directory with the following command:

``` sh
docker build -f ./docker/dockerfiles/base/Dockerfile -t linagora/esn-base .
```

Note that this one needs to be built as soon as a bower or an npm dependency is updated.
