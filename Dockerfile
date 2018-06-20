#
# Docker container for ESN OpenPaaS
#
# Build:
# docker build -t linagora/esn .
#

FROM linagora/esn-base:latest
MAINTAINER Linagora Folks

WORKDIR /var/www

COPY . /var/www
RUN cp /var/www/docker/scripts/start.sh /var/www/start.sh
RUN cp /var/www/docker/scripts/provision.sh /var/www/provision.sh
RUN ln -s /var/www/bower_components/ /var/www/frontend/components
RUN cp -f /var/www/docker/config/jwt/public /var/www/docker/config/james/jwt_publickey

EXPOSE 8080

CMD ["sh", "start.sh"]
