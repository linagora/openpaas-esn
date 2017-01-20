#!/bin/bash

# Generate config/db.json
node bin/cli db --host $MONGO_HOST --port $MONGO_PORT --database $MONGO_DBNAME

if [ "$PROVISION" = true ] ; then

  timeout=60;
  [ -z "$ELASTICSEARCH_INIT_TIMEOUT" ] || timeout="$ELASTICSEARCH_INIT_TIMEOUT"
  wait-for-it.sh $ELASTICSEARCH_HOST:$ELASTICSEARCH_PORT -s -t ${timeout}

  timeout=60;
  [ -z "$MONGO_INIT_TIMEOUT" ] || timeout="$MONGO_INIT_TIMEOUT"
  wait-for-it.sh $MONGO_HOST:$MONGO_PORT -s -t ${timeout} -- sh ./provision.sh

fi

echo 'Starting OpenPaaS ESN'
npm start
