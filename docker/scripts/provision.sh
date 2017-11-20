#!/bin/bash

echo 'Provisioning ESN configuration and data'
node ./bin/cli configure
node ./bin/cli elasticsearch --host $ELASTICSEARCH_HOST --port $ELASTICSEARCH_PORT
node ./bin/cli populate
node ./bin/cli platformadmin init --email admin@open-paas.org
