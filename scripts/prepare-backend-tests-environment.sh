#!/bin/bash

if [ "$1" = "help" ] || [ "$1" = "-h" ] ; then
  echo "Usage: $0 [port]"
  exit
fi

CONFIG_FILE="test/unit-backend/default.test.json"

if [ ! -f "$CONFIG_FILE" ] ; then
  echo "Error: no test file $CONFIG_FILE"
  exit 1
fi

WEBSERVER_PORT=
WSSERVER_PORT=
if [ "$1" ] ; then
  WEBSERVER_PORT="$1"
fi
if [ "$WEBSERVER_PORT" = "" ] ; then
  WEBSERVER_PORT=4567
fi

if [ "$2" ] ; then
  WSSERVER_PORT="$2"
fi
if [ "$WSSERVER_PORT" = "" ] ; then
  WSSERVER_PORT=4567
fi

mkdir -p tmp >/dev/null 2>&1

CONFIG_FILENAME=$(basename "$CONFIG_FILE")
CONFIG_TARGET_FILE="config/$CONFIG_FILENAME"

cat "$CONFIG_FILE" | sed "s/__WEBSERVER_PORT___/$WEBSERVER_PORT/g" \
                  |  sed "s/__WSSERVER_PORT___/$WSSERVER_PORT/g"   \
                  > "$CONFIG_TARGET_FILE"
RET=$?
if [ $RET -ne 0 ] ; then
  echo "Error: can't copy $CONFIG_FILE to $CONFIG_TARGET_FILE"
fi

# mocha --colors --reporter spec test/unit-backend/**/*.js test/unit-backend/

# rm -f "$CONFIG_TARGET_FILE"
