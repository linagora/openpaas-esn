#!/bin/bash

if [ "$PROVISION" = true ] ; then
  wait-for-it.sh $ELASTICSEARCH_HOST:$ELASTICSEARCH_PORT -s -t 60 -- sh ./provision.sh
fi

echo 'Starting OpenPaaS ESN'
npm start