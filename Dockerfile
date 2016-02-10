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
COPY ./docker/config/db.json config/db.json
RUN ln -s /var/www/build/frontend /var/www/frontend/components
#RUN ln -s /var/www/bower_components /var/www/frontend/components

EXPOSE 8080

CMD ["npm", "start"]