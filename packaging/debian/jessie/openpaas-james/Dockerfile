#
# Docker container for building openpaas-james package
#

FROM linagora/fpm-debian-jessie
MAINTAINER Linagora Folks <openpaas@linagora.com>

ARG DEBIAN_FRONTEND=noninteractive
ARG VERSION=0.0.0
ARG ITERATION=1

ADD package /package
ADD openpaas-james.preinst /root/
ADD openpaas-james.postinst /root/

WORKDIR /package
RUN fpm \
  -s dir \
  -t deb \
  --name openpaas-james \
  --version $VERSION \
  --iteration $ITERATION \
  --license AGPLv3 \
  --vendor Linagora \
  --maintainer "Linagora Folks <lgs-openpaas-dev@linagora.com>" \
  --description "OpenPaas Enterprise Social Network - *DAV Server" \
  --url "http://open-paas.org" \
  --architecture x86_64 \
  --deb-user openpaas \
  --deb-group openpaas \
  --depends nginx \
  --depends james \
  --before-install /root/openpaas-james.preinst \
  --after-install /root/openpaas-james.postinst \
  .

VOLUME /result

ENTRYPOINT cp /package/openpaas*.deb /result/
