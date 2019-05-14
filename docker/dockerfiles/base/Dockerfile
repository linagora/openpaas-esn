#
# Docker base container for ESN OpenPaas
#
# Build (from the repository root):
#
# docker build -f ./docker/dockerfiles/base/Dockerfile -t linagora/esn-base .
#

FROM node:10-stretch
MAINTAINER Linagora Folks

RUN apt-get update && \
    apt-get install -y git \
            libjpeg-dev \
            graphicsmagick \
            graphicsmagick-imagemagick-compat \
            libpango1.0-dev \
            libcairo2-dev && \
    apt-get clean && \
    wget https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh -O /usr/bin/wait-for-it.sh && \
    chmod +x /usr/bin/wait-for-it.sh && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /var/www
# Cache NPM install of package.json has not been changed
# cf http://www.clock.co.uk/blog/a-guide-on-how-to-cache-npm-install-with-docker
RUN npm install -g bower
COPY .bowerrc bower.json package.json /var/www/
RUN sed -i -e '/"bower": "1.*"/ d' -e '/"postinstall.*"/ d' package.json
RUN npm install --production
RUN bower install --allow-root --production
