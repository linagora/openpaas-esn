#
# Docker base container for ESN OpenPaas
#
# Build (from the repository root):
#
# docker build -f ./docker/dockerfiles/base/Dockerfile -t linagora/esn-base .
#

FROM node:0.10.36-slim
MAINTAINER Linagora Folks

RUN apt-get update
RUN apt-get install -y git \
            libjpeg-dev \
            graphicsmagick \
		    graphicsmagick-imagemagick-compat \
		    libpango1.0-dev \
		    libcairo2-dev

RUN apt-get clean
RUN rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Cache NPM install of package.json has not been changed
# cf http://www.clock.co.uk/blog/a-guide-on-how-to-cache-npm-install-with-docker
COPY package.json /var/www/package.json
RUN cd /var/www && npm install --production
RUN npm install -g bower

# Cache bower
COPY bower.json /var/www/bower.json
RUN cd /var/www && bower install --allow-root

WORKDIR /var/www
