# shellcheck disable=SC2148

# Prepare Node environment via fnm
export PATH="/root/.local/share/fnm:$PATH"
# Automatic shell detection seems to fail in Docker, so we're specifying bash manually
eval "$(fnm env --shell bash)"
