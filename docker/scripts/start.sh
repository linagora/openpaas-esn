#!/bin/bash

export GENERATE_DB_CONFIG_FROM_ENV=${GENERATE_DB_CONFIG_FROM_ENV:-true}

if [ "${GENERATE_DB_CONFIG_FROM_ENV}" = true ] ; then
  # Generate config/db.json using connection string or separate variables
  if [ -z $MONGO_CONNECTION_STRING ] ; then
    node bin/cli db --host $MONGO_HOST --port $MONGO_PORT --database $MONGO_DBNAME
  else
    node bin/cli db --connection-string $MONGO_CONNECTION_STRING
  fi
fi

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
