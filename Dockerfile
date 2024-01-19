FROM ubuntu:22.04
WORKDIR /root

# Use bash as shell (instead of sh)
SHELL ["/bin/bash", "-c"]

RUN apt update
# Install dependencies
RUN apt install -y curl git wget unzip jq
# Install dependencies for building manual
RUN apt install -y pandoc make
# Install fnm for managing Node.js versions
RUN curl -fsSL https://fnm.vercel.app/install | bash

COPY . .
ENV BASH_ENV=/root/.bash_profile

# Install Node.js and global npm dependencies
RUN ./install.sh

# Directory where all Cocoda installations will live
RUN mkdir -p /www/cocoda

# Start HTTP server
CMD ./entrypoint.sh
