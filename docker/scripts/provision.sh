#!/bin/bash

echo 'Provisioning ESN configuration and data'
node ./bin/cli configure --host $MONGO_HOST --port $MONGO_PORT --database $MONGO_DBNAME
node ./bin/cli populate --host $MONGO_HOST --port $MONGO_PORT --database $MONGO_DBNAME