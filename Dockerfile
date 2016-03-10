#
# Docker container for ESN OpenPaas
#
# Build:
# docker build -t linagora/esn .
#

FROM linagora/esn-base:mach10
MAINTAINER Linagora Folks

WORKDIR /var/www

COPY . /var/www
RUN cp /var/www/docker/config/docker-db.json /var/www/config/db.json
RUN cp /var/www/docker/scripts/start.sh /var/www/start.sh
RUN cp /var/www/docker/scripts/provision.sh /var/www/provision.sh
RUN ln -s /var/www/bower_components/ /var/www/frontend/components

EXPOSE 8080

CMD ["sh", "start.sh"]