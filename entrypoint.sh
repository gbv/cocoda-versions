#!/bin/bash

PORT=${PORT:-80}
FOLDER=/www/cocoda/
if [ "$USE_SUBPATH" == "true" ] || [ "$USE_SUBPATH" == "1" ]; then
  FOLDER=/www/
fi
echo "Starting http-server on port $PORT (path: $FOLDER)..."
http-server -s -d false -p "$PORT" $FOLDER
