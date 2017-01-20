# Command Line Interface

OpenPaaS ESN comes with a CLI to ease several configuration steps. From the root directory:

```bash
$ node ./bin/cli --help
```

## Commands

**configure**

It will set the global configuration in the mongodb database defined from CLI options.
The global configuration is generated from the data in [../fixtures/esn-config/data](../fixtures/esn-config/data) and so from environment variables:

- REDIS_HOST: default is `localhost`
- REDIS_PORT: default is `6379`
- WEB_HOST: default is `localhost`
- WEB_PORT:default is `8080`
- DAV_SERVER_HOST: default is `localhost`
- DAV_SERVER_PORT: default is `8001`
- ELASTICSEARCH_HOST: default is `localhost`
- ELASTICSEARCH_PORT: default is `9200`
- JMAP_SERVER_HOST: default is `localhost`
- AMQP_HOST: default is `amqp`
- AMQP_PORT: default is `5672`

```bash
$ DAV_SERVER_HOST=dav.open-paas.org node ./bin/cli configure
```

This will connect to the MongoDB database of the ESN instance, set the `DAV_SERVER_HOST` value to `dav.open-paas.org` and inject all the configuration at the right place.

**db**

It will generate and override the [../config/db.json](../config/db.json) file from CLI options.

```bash
$ node ./bin/cli db --host localhost --port 27017 --database esn
```

A full connection string is also support:

```bash
$ node ./bin/cli db --connection-string mongodb://db1.example.net,db2.example.net:2500/?replicaSet=test
```

**docker-dev**

It will generate all the configuration so that components can be run in docker and reached from your local OpenPaaS instance.

```bash
$ node ./bin/cli docker-dev --host localhost --port 27017 --database esn
```

**elasticsearch**

It will create the indexes on the elasticsearch instance defined from CLI options.

```bash
$ node ./bin/cli elasticsearch --host localhost --port 9200 --index contacts
```

- host: default is localhost
- port: default is 9200
- index: Defines the index to create. When not set, it will create all the required indexes.

**reindex**

It will index or reindex data from the DB to ES.

```bash
$ node ./bin/cli reindex --es-host localhost --es-port 9200 --type users
```

- es-host: default is localhost
- es-port: default is 9200
- type: the data type to reindex. Possible values: users, contacts

**populate**

It will populate the MongoDB database with initial required data to use OpenPaaS.

```bash
$ node ./bin/cli populate
```

Once populated, you should be able to log into the OpenPaaS instance using user `admin@open-paas.org` and password `secret`.

**init**

Performs the initial setup of an OpenPaas instance, by configuring a domain and an administrator
along with the associated default configurations. Also configures the various storage servers.
This reads environment variables to know what to configure, as per the *populate*, *elasticsearch* and *configure* commands.

```bash
$ node ./bin/cli init --email admin@domain.org --password secret
```

- email: required, the email address of the domain administrator. The OpenPaas domain name is taken from the email address
- password: optional, the password of the domain administrator. When omitted,
the username of the email address will be used as password;

**domain**

This command allows you to manage domains of an OpenPaaS instance. For example,
to create a new domain, type:

```bash
$ node ./bin/cli domain create --email admin@domain.org --password secret
```

The new domain will be created and the administrator login is `admin@domain.org`
with password `secret`.

- email: required, the email address of the domain administrator. The OpenPaas domain name is taken from the email address
- password: optional, the password of the domain administrator. When omitted,
the username of the email address will be used as password;

To see all option, use `help` command:

```bash
$ node ./bin/cli help domain
```
