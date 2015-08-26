#!/bin/bash

BASE_DIR=`dirname $0`

echo "Starting ESN instance..."
node server.js &> /dev/null &
PROC1=`echo $!`
sleep 10
echo "ESN started on pid $PROC1"

echo "Starting webdriver-manager instance..."
webdriver-manager start &> /dev/null &
PROC2=`echo $!`
sleep 3
echo "webdriver-manager started on pid $PROC2"

grunt cucumber

echo "Killing ESN instance... (pid=$PROC1)"
kill -9 $PROC1
sleep 1
echo "Killing webdriver-manager instance... (pid=$PROC2)"
kill -9 $PROC2
sleep 1
PROC3=`ps -faux --sort=start_time | grep java | grep -v grep | awk '//{print $2}' | tail -1`
echo "Killing java remaining instance... (pid=$PROC2)"
kill -9 $PROC3
sleep 1
echo "Done"
