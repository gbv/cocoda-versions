#!/bin/bash

PORT=${PORT:-80}
http-server -s -d false -p "$PORT" /www/
