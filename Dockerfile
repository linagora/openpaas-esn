#
# Docker container for ESN OpenPaas
#
# Build:
# docker build -t linagora/esn .
#

FROM linagora/esn-base
MAINTAINER Linagora Folks

WORKDIR /var/www

ADD . /var/www
COPY ./docker/config/docker-db.json config/db.json
COPY ./docker/scripts/start.sh start.sh
RUN ln -s /var/www/bower_components/ /var/www/frontend/components

EXPOSE 8080

CMD ["sh", "start.sh"]