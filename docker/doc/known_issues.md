# Known Issues

Here is a list of known issues and how to solve them.

- **James not started**. It is possible that the James server exits on launch if some of its dependencies are not fully started. You can then relaunch the James server with the following command:

```
docker-compose restart james
```

Note that this will not append the container logs to the main docker-compose logs, so you can get them by running 'docker-compose logs -f esn_james'

- **http://<YOUR_DOCKER_IP>:8080 unreachable**. The ESN to MongoDB connection may fail in some condition. Try to relaunch the ESN service:

```
docker-compose restart esn
```

- **Data is not provisioned**

They may have some database connection timeout at startup and so no user is available and you can not connect to the application.
Try to relaunch the ESN service:

```
docker-compose restart esn
```

If it still does not work, restart all the services.

- **Elasticsearch errors**

If you have an error like:

```
wait-for-it.sh: timeout occurred after waiting 30 seconds for localhost:9200
```

It means that your docker-compose platform is quite slow. You can increase the timeout value by setting the ELASTICSEARCH_INIT_TIMEOUT environment variable.

```
ELASTICSEARCH_INIT_TIMEOUT=120 docker-compose ...
```

- **OutOfMemoryError** when launching james. It is possible that docker is not well configured on some distributions with systemd.

Try:

```
systemctl status docker.service
● docker.service - Docker Application Container Engine
   Loaded: loaded (/usr/lib/systemd/system/docker.service; enabled; vendor preset: disabled)
   Active: active (running) since Wed 2016-03-02 11:22:38 CET; 4min 30s ago
     Docs: https://docs.docker.com
 Main PID: 18869 (docker)
    Tasks: 312 (512)
   CGroup: /system.slice/docker.service
```

Note the Tasks line, the 512 limit is not enough for us.

To change the settings find the docker.service systemd conf. For me it is:

```
vim /etc/systemd/system/multi-user.target.wants/docker.service
```

Then add the line **TasksMax=infinity** under **[Service]**.
Now restart:

```
systemctl restart docker.service
```

You may have to also run (if you are asked to):

```
systemctl daemon-reload
```

- **When I log in, the page is empty**. First be sure that you have created the domain in james.

```
docker exec esn_james java -jar /root/james-cli.jar -h localhost adddomain open-paas.org
```

Then, this may comes from james auto-provisioning task that may not be finished yet. Wait a few seconds then reload the page.
