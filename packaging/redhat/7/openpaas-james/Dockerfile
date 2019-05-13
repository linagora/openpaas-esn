#
# Docker container for building openpaas-james package
#

FROM linagora/fpm-centos-7
MAINTAINER Linagora Folks <openpaas@linagora.com>

ARG VERSION=0.0.0
ARG ITERATION=1

RUN yum install -y rpm-build

ADD common/openpaas-james/package /package
ADD redhat/7/openpaas-james/package /package

ADD common/openpaas-james/openpaas-james.preinst /root/
ADD common/openpaas-james/openpaas-james.postinst /root/
ADD common/openpaas-james/openpaas-james.postrm /root/

WORKDIR /package
RUN fpm \
  -s dir \
  -t rpm \
  --name openpaas-james \
  --version $VERSION \
  --iteration $ITERATION \
  --license AGPLv3 \
  --vendor Linagora \
  --maintainer "Linagora Folks <lgs-openpaas-dev@linagora.com>" \
  --description "OpenPaas Enterprise Social Network - *DAV Server" \
  --url "http://open-paas.org" \
  --architecture x86_64 \
  --directories /var/log/openpaas/james \
  --rpm-user openpaas \
  --rpm-group openpaas \
  --rpm-dist el7 \
  --depends nginx \
  --depends james \
  --depends cassandra \
  --config-files etc/james \
  --before-install /root/openpaas-james.preinst \
  --after-install /root/openpaas-james.postinst \
  --after-remove /root/openpaas-james.postrm \
  .

VOLUME /result

ENTRYPOINT cp /package/openpaas*.rpm /result/
