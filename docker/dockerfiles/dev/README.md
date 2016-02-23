# Dev Docker files

This folder contains a collection of Docker files which may be used to ease ESN development.

## Files

### docker-compose.yml

A compose file to launch Redis, Mongodb, Elasticsearch and SabreDAV.

```bash
ESN_HOST=<YOUR_ESN_IP> docker-compose -f ./docker/dockerfiles/dev/docker-compose.yml up
```

Check the complete documentation on [../../doc/dev.md](../../doc/dev.md)