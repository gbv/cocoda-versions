#!/bin/bash

PORT=${PORT:-80}
echo "Starting http-server on port $PORT..."
http-server -s -d false -p "$PORT" /www/
