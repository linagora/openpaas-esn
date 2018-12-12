#
# Docker container for ESN OpenPaas
#
# Build:
# docker build -t linagora/esn .
#

FROM node:8-jessie-slim
MAINTAINER Linagora Folks

RUN apt-get update && \
    apt-get install -y git \
            libjpeg-dev=1:1.3.* \
            graphicsmagick=1.3.* \
            graphicsmagick-imagemagick-compat=1.3.* \
            libpango1.0-dev=1.36.* \
            libcairo2-dev=1.14.* && \
    apt-get clean && \
    wget https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh -O /usr/bin/wait-for-it.sh && \
    chmod +x /usr/bin/wait-for-it.sh && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY . /var/www
WORKDIR /var/www
RUN npm install -g bower
RUN sed -i -e '/"bower": "1.*"/ d' -e '/"postinstall.*"/ d' package.json
RUN npm install --production
RUN bower install --allow-root --production
RUN cp -f /var/www/docker/config/jwt/public /var/www/docker/config/james/jwt_publickey
EXPOSE 8080
CMD ["sh", "/var/www/docker/scripts/start.sh"]
