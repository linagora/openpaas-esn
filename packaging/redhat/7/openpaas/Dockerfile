#
# Docker container for building openpaas package
#

FROM linagora/fpm-centos-7
MAINTAINER Linagora Folks <openpaas@linagora.com>

ARG VERSION=0.0.0
ARG ITERATION=1
ARG TREEISH=master

RUN curl -sL https://rpm.nodesource.com/setup_10.x | bash - && \
    yum groupinstall -y 'Development Tools' && \
    yum install -y epel-release && \
    yum install -y git rpm-build nodejs ImageMagick cairo cairo-devel cairomm-devel libjpeg-turbo-devel pango pango-devel pangomm pangomm-devel giflib-devel

RUN git clone --no-single-branch --depth=1 https://ci.linagora.com/linagora/lgs/openpaas/esn.git /package/usr/share/openpaas

ADD common/openpaas/package /package
ADD redhat/7/openpaas/package /package

ADD common/openpaas/openpaas.preinst /root/
ADD redhat/7/openpaas/openpaas.postinst /root/
ADD common/openpaas/openpaas.postrm /root/
ADD common/openpaas/openpaas.prerm /root/

WORKDIR /package/usr/share/openpaas
RUN git checkout $TREEISH && npm i --production && ./node_modules/bower/bin/bower install --allow-root && \
    find . -name .git -type d -exec rm -rf {} +

WORKDIR /package
RUN fpm \
  -s dir \
  -t rpm \
  --name openpaas \
  --version $VERSION \
  --iteration $ITERATION \
  --license AGPLv3 \
  --vendor Linagora \
  --maintainer "Linagora Folks <lgs-openpaas-dev@linagora.com>" \
  --description "OpenPaas Enterprise Social Network - *DAV Server" \
  --url "http://open-paas.org" \
  --architecture x86_64 \
  --directories /etc/openpaas \
  --directories /var/log/openpaas \
  --directories /usr/share/openpaas \
  --rpm-user openpaas \
  --rpm-group openpaas \
  --rpm-dist el7 \
  --depends nginx \
  --depends elasticsearch \
  --depends mongodb-org \
  --depends redis \
  --depends rabbitmq-server \
  --depends java-1.8.0-openjdk \
  --depends nodejs \
  --depends ImageMagick \
  --depends cairo \
  --depends cairomm \
  --depends libjpeg-turbo \
  --depends pango \
  --depends pangomm \
  --depends giflib \
  --before-install /root/openpaas.preinst \
  --after-install /root/openpaas.postinst \
  --before-remove /root/openpaas.prerm \
  --after-remove /root/openpaas.postrm \
  .

VOLUME /result

ENTRYPOINT cp /package/openpaas*.rpm /result/
