# Command Line Interface

OpenPaaS ESN comes with a CLI to ease several configuration steps. From the root directory:

```bash
$ node ./bin/cli
```

## Commands

**configure**

It will set the global configuration in the mongodb database defined from CLI options.
The global configuration is generated from the data in [../fixtures/esn-config/data](../fixtures/esn-config/data) and so from environment variables:

- REDIS_HOST: default is localhost
- REDIS_PORT: default is 6379
- WEB_HOST: default is localhost
- WEB_PORT:default is 8080
- DAV_SERVER_HOST: default is localhost
- DAV_SERVER_PORT: default is 8001
- ELASTICSEARCH_HOST: default is localhost
- ELASTICSEARCH_PORT: default is 9200
- JMAP_SERVER_HOST=: default is localhost 
- JMAP_SERVER_PORT: default is 80
- JMAP_SERVER_PATH: default is jmap

```bash
$ JMAP_SERVER_HOST=mail.open-paas.org node ./bin/cli configure --host localhost --port 27017 --database esn
```

This will connect to the mongodb database esn on localhost:27017, set the JMAP_SERVER_HOST value to mail.open-paas.org and inject all the configuration at the right place. 

**db**

It will generate and override the [../config/db.json](../config/db.json) file from CLI options.

```bash
$ node ./bin/cli db --host localhost --port 27017 --database esn
```

**docker-dev**

It will generate all the configuration so that components can be run in docker and reached from your local OpenPaaS instance.

```bash
$ node ./bin/cli docker-dev --host localhost --port 27017 --database esn
```

**populate**

It will populate the mongodb database defined from CLI options with initial required data to use OpenPaaS.

```bash
$ node ./bin/cli populate --host localhost --port 27017 --database esn
```

Once populated, you should be able to log into the OpenPaaS instance using user 'admin@open-paas.org' and password 'secret'.
