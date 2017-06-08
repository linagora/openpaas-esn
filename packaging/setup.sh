#!/bin/sh -e

LINUX=''

# Utilities

log() {
    echo "----- $*"
}

runIf() {
    if [ "${LINUX}" = "${1}" ]
    then
        eval ${2}
    fi
}

quit() {
    [ -n "${2}" ] && log "${2}"

    log "Exiting (${1})"
    exit ${1}
}

# Actual process

setup() {
    detectPlatform
    installPrerequisites
    addRepositories
    update
    quit 0
}

detectPlatform() {
    [ -z "${LINUX}" ] && [ -r /etc/debian_version ] && LINUX=debian
    [ -z "${LINUX}" ] && [ -r /etc/redhat-release ] && LINUX=redhat

    if [ -z "${LINUX}" ]
    then
        quit 1 "Sorry, OpenPaas only supports Debian Jessie and RHEL 7 for now. Stay tuned !"
    else
        log "Detected ${LINUX}"
    fi
}

installPrerequisites() {
    runIf debian 'apt-get install -y apt-transport-https'
}

addRepositories() {
    case "${LINUX}" in
        debian) addDebianRepositories;;
        redhat) addRedhatRepositories;;
     esac
}

update() {
     runIf debian 'apt-get update'
}

addDebianRepositories() {
    apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
    apt-key adv --keyserver pool.sks-keyservers.net --recv-key A278B781FE4B2BDA
    wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | apt-key add -
    wget -qO - https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add -
    wget -qO - https://packages.linagora.com/deb/packages.linagora.com.key | apt-key add -

    addDebianRepository elasticsearch "deb http://packages.elastic.co/elasticsearch/2.x/debian stable main"
    addDebianRepository cassandra "deb http://www.apache.org/dist/cassandra/debian 22x main"
    addDebianRepository mongodb-org "deb http://repo.mongodb.org/apt/debian jessie/mongodb-org/3.2 main"
    addDebianRepository nodesource "deb https://deb.nodesource.com/node_6.x jessie main"
    addDebianRepository backports "deb http://deb.debian.org/debian jessie-backports main"
    addDebianRepository openpaas "deb https://packages.linagora.com/deb oncommit openpaas"
}

addDebianRepository() {
    echo "${2}" > /etc/apt/sources.list.d/${1}.list

    log "Added repository '${1}'"
}

addRedhatRepositories() {
    addRedhatRepository epel 'http://download.fedoraproject.org/pub/epel/7/$basearch'
    addRedhatRepository remi 'http://rpms.remirepo.net/enterprise/7/remi/$basearch/'
    addRedhatRepository remi-safe 'http://rpms.remirepo.net/enterprise/7/safe/$basearch/'
    addRedhatRepository remi-php56 'http://rpms.remirepo.net/enterprise/7/php56/$basearch/'
    addRedhatRepository elasticsearch 'https://packages.elastic.co/elasticsearch/2.x/centos'
    addRedhatRepository mongodb-org 'https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/3.0/x86_64/'
    addRedhatRepository datastax 'http://rpm.datastax.com/community'
    addRedhatRepository nodesource 'https://rpm.nodesource.com/pub_6.x/el/7/$basearch'
    addRedhatRepository openpaas 'https://packages.linagora.com/rpm/oncommit/7/'
}

addRedhatRepository() {
    cat << EOF > /etc/yum.repos.d/${1}.repo
[${1}]
name=${1}
baseurl=${2}
enabled=1
gpgcheck = 0

EOF

    log "Added repository '${1}'"
}

# Do the job

setup
