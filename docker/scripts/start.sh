#!/bin/bash

if [ "$PROVISION" = true ] ; then

  timeout=60;
  [ -z "$ELASTICSEARCH_INIT_TIMEOUT" ] || timeout="$ELASTICSEARCH_INIT_TIMEOUT"
  echo ${timeout}

  wait-for-it.sh $ELASTICSEARCH_HOST:$ELASTICSEARCH_PORT -s -t ${timeout} -- sh ./provision.sh
fi

echo 'Starting OpenPaaS ESN'
npm start
