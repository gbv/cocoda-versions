#!/bin/bash

# Prepare Node environment via fnm
export PATH="/root/.local/share/fnm:$PATH"
eval "`fnm env --shell bash`"
fnm install 20
npm i -g zx

./start.mjs
