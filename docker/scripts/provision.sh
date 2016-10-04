#!/bin/bash

echo 'Provisioning ESN configuration and data'
node ./bin/cli configure --host $MONGO_HOST --port $MONGO_PORT --database $MONGO_DBNAME
node ./bin/cli elasticsearch --host $ELASTICSEARCH_HOST --port $ELASTICSEARCH_PORT
node ./bin/cli populate --host $MONGO_HOST --port $MONGO_PORT --database $MONGO_DBNAME
