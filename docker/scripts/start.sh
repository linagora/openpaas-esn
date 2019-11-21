#!/bin/bash

export GENERATE_DB_CONFIG_FROM_ENV=${GENERATE_DB_CONFIG_FROM_ENV:-true}

if [ "${GENERATE_DB_CONFIG_FROM_ENV}" = true ] ; then
  # Generate config/db.json using connection string or separate variables
  if [ -n "${ESN_MONGO_URI}" ] ; then
    if [ -n "${ESN_MONGO_USER}" ] ; then
      connectionString="mongodb://${ESN_MONGO_USER}:${ESN_MONGO_PASSWORD}@${ESN_MONGO_URI}"
    else
      connectionString="mongodb://${ESN_MONGO_URI}"
    fi
  elif [ -n "${MONGO_CONNECTION_STRING}" ] ; then
    connectionString="${MONGO_CONNECTION_STRING}"
  else
    connectionString="mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_DBNAME}"
  fi

  node bin/cli db --connection-string ${connectionString}
fi

#Local dev user injection mode (deprecated, should use LDAP instead)
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
