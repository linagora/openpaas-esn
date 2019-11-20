#!/bin/bash

export GENERATE_DB_CONFIG_FROM_ENV=${GENERATE_DB_CONFIG_FROM_ENV:-true}

if [ "${GENERATE_DB_CONFIG_FROM_ENV}" = true ] ; then
  # Generate config/db.json using connection string or separate variables
  if [ -z "$ESN_MONGO_URI" ] ; then
    node bin/cli db --host $MONGO_HOST --port $MONGO_PORT --database $MONGO_DBNAME
  else
    if [ -z "$ESN_MONGO_USER" ] ; then
      node bin/cli db --connection-string "mongodb://${ESN_MONGO_USER}:${ESN_MONGO_PASSWORD}${ESN_MONGO_URI}"
    else
      node bin/cli db --connection-string "mongodb://${ESN_MONGO_URI}"
    fi
  fi
fi

if [ "$PROVISION" = true ] ; then

  timeout=60;
  [ -z "$ELASTICSEARCH_INIT_TIMEOUT" ] || timeout="$ELASTICSEARCH_INIT_TIMEOUT"
  wait-for-it.sh $ELASTICSEARCH_HOST:$ELASTICSEARCH_PORT -s -t ${timeout}

  timeout=60;
  [ -z "$MONGO_INIT_TIMEOUT" ] || timeout="$MONGO_INIT_TIMEOUT"
  wait-for-it.sh $MONGO_HOST:$MONGO_PORT -s -t ${timeout} -- sh /var/www/docker/scripts/provision.sh

fi

echo 'Starting OpenPaaS ESN'
npm start
