#
# Docker container for building openpaas Debian Stretch package
#

FROM linagora/fpm-debian-stretch
MAINTAINER Linagora Folks <openpaas@linagora.com>

ARG DEBIAN_FRONTEND=noninteractive
ARG VERSION=0.0.0
ARG ITERATION=1
ARG TREEISH=master

RUN apt-get update && apt-get install -y wget && \
    wget -q -O - http://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add -; \
    echo "deb http://deb.nodesource.com/node_10.x jessie main" > /etc/apt/sources.list.d/node.list && \
    apt-get update && \
    apt-get -y install git build-essential python-setuptools graphicsmagick g++ nodejs \
    graphicsmagick-imagemagick-compat libjpeg-dev libcairo2-dev libjpeg62-turbo-dev libpango1.0-dev libgif-dev

RUN git clone --no-single-branch --depth=1 https://ci.linagora.com/linagora/lgs/openpaas/esn.git /package/usr/share/openpaas

ADD common/openpaas/package /package
ADD debian/common/openpaas/package /package

ADD common/openpaas/openpaas.preinst /root/
ADD common/openpaas/openpaas.postinst /root/
ADD common/openpaas/openpaas.postrm /root/
ADD common/openpaas/openpaas.prerm /root/

WORKDIR /package/usr/share/openpaas
RUN git checkout $TREEISH && npm i --production && ./node_modules/bower/bin/bower install --allow-root && \
    find . -name .git -type d -exec rm -rf {} +

WORKDIR /package
RUN fpm \
  -s dir \
  -t deb \
  --name openpaas \
  --version $VERSION \
  --iteration "$ITERATION+stretch" \
  --license AGPLv3 \
  --vendor Linagora \
  --maintainer "Linagora Folks <lgs-openpaas-dev@linagora.com>" \
  --description "OpenPaas Enterprise Social Network - Application Server" \
  --url "http://open-paas.org" \
  --architecture x86_64 \
  --directories /etc/openpaas \
  --directories /var/log/openpaas \
  --directories /usr/share/openpaas \
  --deb-user openpaas \
  --deb-group openpaas \
  --depends nginx \
  --depends elasticsearch \
  --depends mongodb \
  --depends redis-server \
  --depends rabbitmq-server \
  --depends openjdk-8-jdk \
  --depends nodejs \
  --depends graphicsmagick \
  --depends graphicsmagick-imagemagick-compat \
  --depends libcairo2 \
  --depends libjpeg62-turbo \
  --depends libpango1.0-0 \
  --depends libgif7 \
  --before-install /root/openpaas.preinst \
  --after-install /root/openpaas.postinst \
  --before-remove /root/openpaas.prerm \
  --after-remove /root/openpaas.postrm \
  .

VOLUME /result

ENTRYPOINT cp /package/openpaas*.deb /result/
