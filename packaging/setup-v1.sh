#!/bin/sh -e

LINUX=''
LINUX_VERSION=''
DEBIAN_RELEASE=''

# Utilities

log() {
    echo "----- $*"
}

runIf() {
    if [ "${LINUX}" = "${1}" ]
    then
        if [ -n "${3}" ]
        then
            if [ "${LINUX_VERSION}" = "${2}" ]
            then
                eval ${3}
            fi
        else
            eval ${2}
        fi
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
        quit 1 "Sorry, OpenPaaS only supports Debian or RHEL/CentOS for now. Stay tuned!"
    else
        runIf debian 'LINUX_VERSION=`grep -om1 '[0-9]*' /etc/debian_version | head -n1`'
        runIf redhat 'LINUX_VERSION=`grep -om1 '[0-9]*' /etc/redhat-release | head -n1`'

        if [ "${LINUX}" = "debian" ]
        then
            [ "${LINUX_VERSION}" -lt 8 -o "${LINUX_VERSION}" -gt 9 ] && quit 1 "Sorry, OpenPaaS only supports Debian 8 and 9. Stay tuned!"

            case "${LINUX_VERSION}" in
                8) DEBIAN_RELEASE=jessie;;
                9) DEBIAN_RELEASE=stretch;;
            esac
        elif [ "${LINUX}" = "redhat" ]
        then
            [ "${LINUX_VERSION}" -ne 7 ] && quit 1 "Sorry, OpenPaaS only supports RHEL/CentOS 7. Stay tuned!"
        fi

        log "Detected ${LINUX} ${LINUX_VERSION}"
    fi
}

installPrerequisites() {
    runIf debian 'apt-get install -y apt-transport-https'
    runIf debian 9 'apt-get install -y dirmngr' # https://unix.stackexchange.com/questions/401547/gpg-keyserver-receive-failed-no-dirmngr
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
    wget -qO - https://packages.sury.org/php/apt.gpg | apt-key add -

    addDebianRepository elasticsearch "deb http://packages.elastic.co/elasticsearch/2.x/debian stable main"
    addDebianRepository cassandra "deb http://www.apache.org/dist/cassandra/debian 22x main"
    addDebianRepository nodesource "deb https://deb.nodesource.com/node_8.x ${DEBIAN_RELEASE} main"
    addDebianRepository openpaas "deb https://packages.linagora.com/deb/openpaas/v1 ${DEBIAN_RELEASE} main"
    addDebianRepository sury.org "deb https://packages.sury.org/php/ ${DEBIAN_RELEASE} main" # To support PHP5.6 on Debian Stretch (see https://deb.sury.org/)

    runIf debian 8 'addDebianRepository backports "deb http://deb.debian.org/debian jessie-backports main"'
    runIf debian 8 'addDebianRepository mongodb-org "deb http://repo.mongodb.org/apt/debian jessie/mongodb-org/3.2 main"'
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
    addRedhatRepository nodesource 'https://rpm.nodesource.com/pub_8.x/el/7/$basearch'
    addRedhatRepository openpaas 'https://packages.linagora.com/rpm/v1/7/'
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
