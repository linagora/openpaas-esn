# Base dockerfile

This is a base docker file for OpenPaaS ESN which may be extended by other Docker files. 

It only contains the NPM and Bower dependencies in /var/www/node_modules and /var/www/bower_components so that
they do not have to be installed again and again when business code changes.

## Build

From project root:

```bash
docker build -f ./docker/dockerfiles/base/Dockerfile -t linagora/esn-base .
```
