## Setup local openpaas with thunderbird

### Thunderbird

Setup Server Name to: localhost
Server Port: 1143
Username: yourUser@yourDomainName (ex: admin@open-paas.org)

### James

If you are not using a ldap you need to update the password of your user in james

In order to do that you need a token from your admin account:

1 - Connect to esn with an admin account. 
2 - Go to the administration panel then platform-admin
3 - In modules, James set some quota for the emails
4 - In your devtool, open the network panel, filter with JMAP
5 - In the request header you can copy the token


Now you can follow the james doc: `https://james.apache.org/server/manage-webadmin.html#Updating_a_user_password`

# Be warn to you need to had this to your curl: `-H 'Accept: application/json' -H 'Content-Type: application/json' -H "Authorization: Bearer your token"`

ex:

```
curl -XPUT http://localhost:8000/users/admin@open-paas.org -d '{"password": "secret"}' -H 'Accept: application/json' -H 'Content-Type: application/json' -H "Authorization: Bearer your token"
```