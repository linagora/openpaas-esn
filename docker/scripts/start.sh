#!/bin/bash

if [ "$PROVISION" = true ] ; then
  echo 'Provisioning ESN configuration and data'
  node ./bin/cli configure --host $MONGO_HOST --port $MONGO_PORT --database $MONGO_DBNAME
  node ./bin/cli populate --host $MONGO_HOST --port $MONGO_PORT --database $MONGO_DBNAME
fi

echo 'Starting OpenPaaS ESN'
npm start