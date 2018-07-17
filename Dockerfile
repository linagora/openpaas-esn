#
# Docker container for ESN OpenPaas
#
# Build:
# docker build -t linagora/esn .
#

FROM linagora/esn-base:1.1
MAINTAINER Linagora Folks

COPY . /var/www
RUN sed -i -e '/"bower": "1.*"/ d' -e '/"postinstall.*"/ d' package.json
RUN npm install --production
RUN bower install --allow-root --production
RUN cp -f /var/www/docker/config/jwt/public /var/www/docker/config/james/jwt_publickey

EXPOSE 8080
CMD ["sh", "/var/www/docker/scripts/start.sh"]
