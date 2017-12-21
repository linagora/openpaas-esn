#
# Docker container for building openpaas-james Debian Stretch package
#

FROM linagora/fpm-debian-stretch
MAINTAINER Linagora Folks <openpaas@linagora.com>

ARG DEBIAN_FRONTEND=noninteractive
ARG VERSION=0.0.0
ARG ITERATION=1

ADD common/openpaas-james/package /package
ADD debian/common/openpaas-james/package /package

ADD common/openpaas-james/openpaas-james.preinst /root/
ADD common/openpaas-james/openpaas-james.postinst /root/
ADD common/openpaas-james/openpaas-james.postrm /root/

WORKDIR /package
RUN fpm \
  -s dir \
  -t deb \
  --name openpaas-james \
  --version $VERSION \
  --iteration "$ITERATION+stretch" \
  --license AGPLv3 \
  --vendor Linagora \
  --maintainer "Linagora Folks <lgs-openpaas-dev@linagora.com>" \
  --description "OpenPaas Enterprise Social Network - Apache James configuration files for OpenPaaS" \
  --url "http://open-paas.org" \
  --architecture x86_64 \
  --directories /var/log/openpaas/james \
  --deb-user openpaas \
  --deb-group openpaas \
  --depends nginx \
  --depends james \
  --depends cassandra \
  --config-files etc/james \
  --before-install /root/openpaas-james.preinst \
  --after-install /root/openpaas-james.postinst \
  --after-remove /root/openpaas-james.postrm \
  .

VOLUME /result

ENTRYPOINT cp /package/openpaas*.deb /result/
