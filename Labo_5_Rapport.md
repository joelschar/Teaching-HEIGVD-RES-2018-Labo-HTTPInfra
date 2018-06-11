# Labo 5 HTTP

## Step 1 apache static
`fb-apache-static`

### Acceptance criteria

* OK You have a GitHub repo with everything needed to build the Docker image.
* OK You do a demo, where you build the image, run a container and access content from a browser.
* OK You have used a nice looking web template, different from the one shown in the webcast.
* OK You are able to explain what you do in the Dockerfile.
* OK You are able to show where the apache config files are located (in a running container).
* OK You have documented your configuration in your report.

### Realisation

image docker de base, php : [image docker php](https://hub.docker.com/_/php/)

lancer le container docker du serveur apache directement : `docker run -d -p 9090:80 php:7.0-apache`

créer une image du container : `docker build -t res/apache_php .`
lancer l'image du container :
    `docker run -d -p 9090:80 res/apache_php`
    `docker run -d -p 9091:80 res/apache_php`

accèder au container en mode intéractif : `docker exec -it <container name> /bin/bash`

Il faut rebuild l'image pour que les nouveaux fichiers soient copiés.

Pour que tous les fichiers soient chargés correctement, il est nécessaire que les droits adéquats soient donnés sur les répertoires dans `/var/www/html`. Pour résoudre ce problème nous avons donnés tous les droits sur tous les fichiers.

apache config files `/etc/apache2/`


## Step 2 express
`fb-express-dynamic`

### Acceptance criteria

* OK You have a GitHub repo with everything needed to build the Docker image.
* OK You do a demo, where you build the image, run a container and access content from a browser.
* OK You generate dynamic, random content and return a JSON payload to the client.
* OK You cannot return the same content as the webcast (you cannot return a list of people).
* OK You don't have to use express.js; if you want, you can use another JavaScript web framework or event another language.
* OK You have documented your configuration in your report.

### Realisation

#### a
image docker de base, node : [image docker node](https://hub.docker.com/_/node/)

Dans le rep src qui va contenir les fichiers sources de l'application : `npm init`
Va générer le fichier package.json

Installer le module change :  `npm install --save chance`

create docker image : `docker build -t res/express_companies .`
`docker run res/express_companies`
Les containers ne restent pas en exécution car dès que le script est termié le container d'arrête.

#### b
Détail d'une requête http : [construction d'une requête http](https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/)

Framework web : Express.js
Installer express : `npm install --save express`

Ecrire le serveur de génération d'entreprises sous forme d'un serveur http.
Créer une image docker avec ce client: `docker build -t res/express_companies .`
Créer un container depuis cette image : `docker run res/express_companies`
Ou avec un port mapping : `docker run -d -p 3000:3000 res/express_companies`
Accèder à la machine sur son adresse ip / ou localhost : `telnet 172.17.0.3 3000` / `telnet localhost 3000`

##### postman
permet de générer et sauver des requêtes http


## Step 3
`fb-apache-reverse-proxy`


### Acceptance criteria

* OK You have a GitHub repo with everything needed to build the Docker image for the container.
* OK You do a demo, where you start from an "empty" Docker environment (no container running) and where you start 3 containers: static server, dynamic server and reverse proxy; in the demo, you prove that the routing is done correctly by the reverse proxy.
* OK You can explain and prove that the static and dynamic servers cannot be reached directly (reverse proxy is a single entry point in the infra).
* OK You are able to explain why the static configuration is fragile and needs to be improved.
	Parce que les adresses ip sont inscrite en dure dans le code du reverse proxy donc compliquer a changer et peuvent être fausses.
* OK You have documented your configuration in your report.

### Realisation

Mise en place d'un reverse proxy avec apache afin de rediriger les requêtes dynamiques vers un container et les requêtes de contenu dynamiques vers un autre container.
#### a
explication du setup

#### b
Démarrer un container "apache_static" (port 80) : `docker run -d --name apache_static res/apache_php`
Démarrer un container "expresse_dynmaic" (port 3000): `docker run -d --name express_dynamic res/express_companies`

On fait un `docker inspect <container name>`pour obtenir les adresses IP ( celle-ci changent dynamiquement )
apache_static : 172.17.0.2
express_dynamique : i172.17.0.3

Run un container apache en interactif sur le port 8080 pour faire des essais : `docker run -it -p 8080:80 php:7.0-apache /bin/bash`

Dans `/etc/apache2`

Apache2 :
activer un module : `a2enmod`
activer un site	: `a2ensite`

dans `/etc/apache2/sites-available`, copier `000-default.conf`->`001-reverse-proxy.conf`

Pour éditer le fichier il faut installer vim  : `apt-get update`-> `apt-get install vim`
doit être refait à chaque fois car il n'y à pas de persistance des données sur ce container.
On peut donc mettre ces commandes dans le "Dockerfile" pour quelle soit faite à chaque lancement.

Modifier le fichier de configuration `001-reverse-proxy.conf` pour que les requêtes soit dirigées enfonction du paramètre host indiqué dans le requête.
```
<VirtualHost *:80>
	ServerName demo.res.ch

	ErrorLog ${APACHE_LOG_DIR}/error.log
	CustomLog ${APACHE_LOG_DIR}/access.log combined

	ProxyPass "/api/companies/" "http://172.17.0.3:3000/"
	ProxyPassReverse "/api/companies/" "http://172.17.0.3:3000/"

	ProxyPass "/" "http://172.17.0.2:80/"
	ProxyPassReverse "/" "http://172.17.0.2:80/"
</VirtualHost>
```

- La règle par défaut "/" doit être en dernier.
- Il est important de bien écrire les "/" de fin de ligne "/api/students/" -> "http://ip:port/" ++TRÈS IMPORTANT++
- On enlève "ServerAdmin" et "DocumentRoot" car le serveur ne va pas transmettre de contenu static.
- Il faut ajouter les éléments "ProxyPass" et "ProxyPassReverse" du modeul proxy.
- "ProxyPassReverse" pour que les entêtes de retour correspondent au serveur proxy.

redémarer le serveur apache : `service apache2 restart`

Le site est maintenant "available" mais pas encore "enable".
Activer le site : `a2ensite 001-reverse-proxy.conf`
Recharger apache : `service apache2 reload` -> "ProxyPass" inconnu car lié à une module
=> Activer les modules nécessaires : `a2enmod proxy` et `a2enmod proxy_http`
-> Recharcher apache2 : `service apache2 reload`

Tester le setup
`telnet localhost 80`  : KO
`telnet localhost 3000`: KO
`telnet localhost 8080`: OK

>GET / HTTP/1.0
>Host: demo.res.ch
-> contenu web

>GET /api/companies/ HTTP/1.0
>Host: demo.res.ch
-> list d'étudiants

Le reverse proxy fonctionne donc correctement

#### c
Intégrer le setup dans une image docker

la structures des fichiers `sites-available/000-default.conf` et `sites-available/001-reverse-proxy.conf` pour qu'ils puissent être copiés dans l'image docker.
Et créer un "Dockerfile" qui effectue la copie est lance les commandes d'activation.
>FROM php:7.0-apache
>
>COPY conf/ /etc/apache2
>
>RUN a2enmod proxy proxy_http
>RUN a2ensite 000-* 001-*

"COPY" vient ajouter du contenu dans le répertoire "sites-available" déjà présent sur le serveur (on ne va pas écraser le contenu du réptertoir apache2)

On crée un fichier `000-default.conf` dans le quel on créer un virtual host vide. De cette manière si le champ "Host: " de la requête n'est pas renseigné correctement, emet une erreur au lieu de rediriger automatiquement vers la configuration de `000-reverse-proxy.conf`

`000-default.conf`:
```
<VirtualHost *:80>
</VirtualHost>
```

`001-reverse-proxy.conf`
```
<VirtualHost *:80>
   ServerName demo.res.ch

   #ErrorLog ${APACHE_LOG_DIR}/error.log
   #CustomLog ${APACHE_LOG_DIR}/access.log combined

   ProxyPass "/api/companies/" "http://172.17.0.3:3000/"
   ProxyPassReverse "/api/companies/" "http://172.17.0.3:3000/"
   ProxyPass "/" "http://172.17.0.2:80/"
   ProxyPassReverse "/" "http://172.17.0.2:80/">
</VirtualHost>
```

Constuire l'image docker : `docker build -t res/apache_reverse_proxy .`
Démarrer le container : `docker run -d -p 8080:80 --name apache-reverse-proxy res/apache_reverse_proxy`

Si on accède à "localhost:8080" -> on obtien le message "Forbiden", car le navigateur n'envoie pas le nom de domaine "Host: demo.res.ch".
Il faut configurer le fichier host pour que cela fonctionne.
`/etc/hosts`


## Step 4 AJAX requests with JQuery
`fb-ajax-jquery`

### Acceptance criteria

* OK You have a GitHub repo with everything needed to build the various images.
* OK You do a complete, end-to-end demonstration: the web page is dynamically updated every few seconds (with the data coming from the dynamic backend).
* OK You are able to prove that AJAX requests are sent by the browser and you can show the content of th responses.
* OK You are able to explain why your demo would not work without a reverse proxy (because of a security restriction).
	the data has to come from the same origine or the browser will block the request.
* OK You have documented your configuration in your report.

### Realisation

Arrêter les containers : `docker kill <container name>`
Supprimer tous les containers : `docker rm \`docker ps -qa\``

Ajouter l'installation de vim dans le Dockerfile de l'image `apache-php-image`
```
FROM php:7.0-apache

RUN apt-get update && \
    apt-get install -y vim

COPY content/ /var/www/html/
```

Rebuild l'image : `docker build -t res/apache_php .`
Idem pour reverser_proxy : `docker build -t res/apache_reverse_proxy .`
Idem pour express_students : `docker build -t res/express_companies .`

relancer les containers dans le bon ordre pour que les adresse ip soient juste selon la config du proxy.
apache-statis: `docker run -d --name apache-static res/apache_php`
expresse-dynamic: `docker run -d --name express-dynamic res/express_companies`
reverse-proxy: `docker run -d -p 8080:80 --name apache-reverse-proxy res/apache_reverse_proxy`

On se connect sur le container "apache-static" pour faire la configuration ajax
`docker exec -it apache-static /bin/bash`

garder une copie de `index.html` -> `index.html.orig`

Inclure un script js en bas de la page index.html pour chager les students
```
<!-- Custom script to load students -->
<script src="js/companies.js"></script>
```

On crée le script `students.js` dans js
- la variable "$" est un nom de variable utilisé par JQuery. -> quand JQuery à fini d'être chargé, alors exécuter cette fonction.
- Le script va faire une requête sur le serveur "express-students" pour récupérer le tableau json.
```
$(function(){
	console.log("loading students");

	function loadStudents() {
		$.getJSON( "/api/students/", function( students ) {
			console.log(students);
			var message = "Nobody is here";
			if ( students.length > 0 ) {
				message = students[0].firstName + " " + students[0].lastName;
			}
			$(".welcom").text(message);
		});
	};
	loadStudents();
	setInterval( loadStudents , 2000 );
});
```

- `$.getJSON( "/api/companies/", function( companies ) {` : emet une requête de contun JSON vers "/api/companies/" et transmet la réponse à la fonction de call back
- `$(".company").text(message);` : récupère un élément du "DOM" page html pour le remplacer avec le message ( référene un nom de classe ici company, également disponnible pour d'autre attributs).

Copier le script et les modifs du fichier index.html sur les fichiers hors de l'image.
Rebuild l'image : `docker build -t res/apache_php .`
relancer les containers dans le bon ordre


## Step 5 Dynamic reverse proxy
`fb-dynamic_reverse_proxy`

### Acceptance criteria

* You have a GitHub repo with everything needed to build the various images.
* You have found a way to replace the static configuration of the reverse proxy (hard-coded IP adresses) with a dynamic configuration.
* You may use the approach presented in the webcast (environment variables and PHP script executed when the reverse proxy container is started), or you may use another approach. The requirement is that you should not have to rebuild the reverse proxy Docker image when the IP addresses of the servers change.
* You are able to do an end-to-end demo with a well-prepared scenario. Make sure that you can demonstrate that everything works fine when the IP addresses change!
* You are able to explain how you have implemented the solution and walk us through the configuration and the code.
* You have documented your configuration in your report.

### Realisation

Il est possible de définir des variable d'environnement à l'exécussion d'un docker, ces variables pourront être modifiés depuis l'extérieur du container et accessible depuis l'intéreur.
```docker run -d
	-e STATIC_APP=172.17.0.x:80
	-e DYNAMIC_APP=172.17.0.y:3000
	--name apache_reverse_proxy
	-p 8080:80
	res/apache_reverse_proxy
```

Créer un script `setup.sh` pour faire la configuration dynamique.

essai des variable d'env : `docker run -e HELLO=world -e RES=heigvd -it res/apache_reverse_proxy /bin/bash`
Il est ensuite possible de voir ces variables dans le container avec `export`.

Modifier le Dockerfile du reverse proxy pour executer la commande de configuration avant de démarrer.

Créer un fichier qui démarre appache ( on s'inspire des scripts utilisé par les auteurs de l'image docker )
[script de lancement du docker](https://github.com/docker-library/php/tree/78125d0d3c32a87a05f56c12ca45778e3d4bb7c9/7.0/stretch/apache)
script : `apache2-foreground`
-> c'est dans ce script qu'on va écrire la configuration setup.sh

rendre le script exécutable: `chmod 755 apache2-foreground`

Il faut modifier notre Dockerfile pour copier ce script à la place de l'autre dans l'image
`COPY apache2-foreground /usr/local/bin/`

Rebuild l'image : `docker build -t res/apache_reverse_proxy .`
contrôler le fonctionnement : `docker run -e STATIC_APP=172.17.0.2:80 -e DYNAMIC_APP=172.17.0.3:3000 res/apache_reverse_proxy`
On voit mnt les valeurs affichées dans les logs de boot.

#### template de configuration avec php
Créer le fichier "templates" dans "apache_reverse_proxy"
Créer dans template "config-template.php", un template de configuration du serveur apach2

><?php
>    $dynamic_app = getenv('DYNAMIC_APP');
>    $static_app = getenv('STATIC_APP');
>?>
><VirtualHost *:80>
>    ServerName demo.res.ch
>    
>    ProxyPass '/api/students/' 'http://<?php print "$dynamic_app"?>/'
>    ProxyPassReverse '/api/students/' 'http://<?php print "$dynamic_app"?>/'
>   
>    ProxyPass '/' 'http://<?php print "$static_app"?>/'
>    ProxyPassReverse '/' 'http://<?php print "$static_app"?>/'
></VirtualHost>

Dans le Dockerfile copier le contenu du template dans /var/apache2/
`COPY templates /var/apache2/templates`

Rebuild l'image : `docker build -t res/apache_reverse_proxy .`
Contrôler la copie : `docker run -it -t res/apache_reverse_proxy /bin/bash`

au démarrage du container lancer le script et placer le résultat du template dans le fichier de config
- ajouter dans `apache2-foreground`: `php /var/apache2/templates/config-template.php > /etc/apache2/sites-available/001-reverse-proxy.conf`

build et contrôler que le fichier soient créés et copiés correctmeent
avec variable d'env : `docker run -it -e STATIC_APP=172.17.0.x:80 -e DYNAMIC_APP=172.17.0.y:3000 -t res/apache_reverse_proxy`
accèder au container pour contrôler le contenu du fichier 001-* soit correcte dans "sites-available" et sites-enable" : `docker exec -it festive_almeida /bin/bash`
on constat que les fichiers contiennent bien les valeurs passée en paramètre au lancement du container.

#### tester le setup dynamic
lancer le serveur apache static : `docker run -d -t res/apache_php` 3x + `docker run -d --name apache-static -t res/apache_php`
lancer le serveur express : `docker run -d -t res/express_students` 2x + `docker run -d --name express_dynamic -t res/express_students`
De cette manière les containers utilisé n'auront pas les ips 2 et 3 comme normalement.

récupérer les adresses ip avec instpect :
static : 5
dynamic : 8

lancer le proxy avec les bonnes adresses : `docker run -d -e STATIC_APP=172.17.0.5:80 -e DYNAMIC_APP=172.17.0.8:3000 --name apache-reverse-proxy -p 8080:80 -t res/apache_reverse_proxy`

contrôler que les ip soient juste sur le reverse proxy avec : `docker logs apache-reverse-proxy`


## Step 5, Load Balancing Reverse proxy
`fb-load-balancing-reverse-proxy`

### Acceptace criteria
* You extend the reverse proxy configuration to support **load balancing**. 
* You show that you can have **multiple static server nodes** and **multiple dynamic server nodes**. 
* You prove that the **load balancer** can distribute HTTP requests between these nodes.
* You have documented your configuration and your validation procedure in your report.

### Realisation

Activer les modules `mod_proxy_balancer` et `mod_lbmethod_byrequests` dans le dockerfile pour qu'il soit installé au démarage du container. Ces deux modules sont nécessaire pour faire du load balancing entre plusieurs serveurs apache.
Rebuild l'image : `docker build -t res/apache_reverse_proxy .`



Faire un test du set up avec load balancer:
- lancer deux containers apache static : `docker run -d -t res/apache_php`
- lancer un container reverse proxy : `docker run -d -e STATIC_APP=172.17.0.2:80 -p 8080:80 -t res/apache_reverse_proxy`
On va faire la config manuellement ici (checker les ip et config du proxy.)
static 1 : 2
static 2 : 3
proxy : 4

se connecter en interactif sur le proxy
tester que le site est possible sur les deux containers.
et en passant pas le proxy (demo.res.ch:8080)

configurer le load balancing entre les deux serveurs : `001-reverse-proxy.conf`
><VirtualHost *:80>
>	ServerName demo.res.ch
>
>	<Proxy balancer://static>
>		BalancerMemeber 'http://172.17.0.2:80'
>		BalancerMemeber 'http://172.17.0.3:80'
>	</Proxy>
>	ProxyPass '/' 'balancer://static/'
>	ProxyPassReverse '/' 'balancer://static/'
></VirtualHost>

Reload apache : `service apache2 reload`
vérifier que le site est tjr disponnible en stoppand l'un ou lautre des container.

lancer deux containers express dynamic : `docker run -d -t res/express_students`
configuer pour le load balancing pour le service dynamic:
><VirtualHost *:80>
>	ServerName demo.res.ch
>
>	<Proxy balancer://dynamic>
>		BalancerMember 'http://172.17.0.5:3000'
>		BalancerMember 'http://172.17.0.6:3000'
>	</Proxy>
>	ProxyPass '/api/students/' 'balancer://dynamic/'
>	ProxyPassReverse '/api/students/' 'balancer://dynamic/'
>
>	<Proxy balancer://static>
>		BalancerMember 'http://172.17.0.2:80'
>		BalancerMember 'http://172.17.0.3:80'
>	</Proxy>
>	ProxyPass '/' 'balancer://static/'
>	ProxyPassReverse '/' 'balancer://static/'
></VirtualHost>

Tester que le service est tjr disponnbible en stoppant l'un ou l'autre des containers.

Activer le `balancer-manager`:
ajouter en haut de `001-reverse-proxy.conf`:
><Location /balancer-manager>
>	SetHandler balancer-manager
>	Order Deny,Allow
>	Deny from all
>	Allow form all setup
></Location>
>ProxyPass /balancer-manager !
accès : `demo.res.ch:8080/balancer-manager`

Adaptation du template dynamique pour faire la configuration au boot avec des variables d'environnement.
Le setup est prévu pour deux noeuds static et deux noeuds dynamiques.
`config-template-balancer.php`:
><?php
>    $dynamic_app1 = getenv('DYNAMIC_APP1');
>    $dynamic_app2 = getenv('DYNAMIC_APP2');
>    $static_app1 = getenv('STATIC_APP1');
>    $static_app2 = getenv('STATIC_APP2');
>
>?>
><VirtualHost *:80>
>    ServerName demo.res.ch
>
>    <Location /balancer-manager>
>        SetHandler balancer-manager
>        Order Deny,Allow
>        Deny from all
>        Allow from all
>    </Location>
>    ProxyPass /balancer-manager !
>
>    <Proxy balancer://dynamic>
>        BalancerMember 'http://<?php print "$dynamic_app1"?>'
>        BalancerMember 'http://<?php print "$dynamic_app2"?>'
>    </Proxy>
>    ProxyPass '/api/students/' 'balancer://dynamic/'
>    ProxyPassReverse '/api/students/' 'balancer://dynamic/'
>
>    <Proxy balancer://static>
>        BalancerMember 'http://<?php print "$static_app1"?>'
>        BalancerMember 'http://<?php print "$static_app2"?>'
>    </Proxy>
>    ProxyPass '/' 'balancer://static//'
>    ProxyPassReverse '/' 'balancer://static/'
></VirtualHost>

rebuild : `docker build -t res/apache_reverse_proxy .`
delete all container: `docker rm `docker ps -qa` `

run static 1: `docker run -d --name apache-static1 -t res/apache_php`
run static 2: `docker run -d --name apache-static2 -t res/apache_php`
run dynamic 1: `docker run -d --name express_dynamic1 -t res/express_students`
run dynamic 2: `docker run -d --name express_dynamic2 -t res/express_students`

run proxy : `docker run -d -e STATIC_APP1=172.17.0.2:80 -e STATIC_APP2=172.17.0.3:80 -e DYNAMIC_APP1=172.17.0.4:3000 -e DYNAMIC_APP2=172.17.0.5:3000 --name apache-reverse-proxy -p 8080:80 -t res/apache_reverse_proxy`

contrôle infrastructure et tester
La reprise par l'autre noeud peut être assez longue.(patience)


## Step 6, load balancing avec sticky session.
`fb-load-balancing-sticky-session`

### Acceptance Criteria
* You do a setup to demonstrate the notion of sticky session.
* You prove that your load balancer can distribute HTTP requests in a round-robin fashion to the dynamic server nodes (because there is no state).
* You prove that your load balancer can handle sticky sessions when forwarding HTTP requests to the static server nodes.
* You have documented your configuration and your validation procedure in your report.

### Realisation

[apache2 proxy balancer](https://httpd.apache.org/docs/2.4/mod/mod_proxy_balancer.html#example)

On va ajouter un compteur sur les valeurs affichées par l'un ou l'autre des serveur. on va ainsi rendre visuel la répartition de charge.

création du script pour faire le build et run de toute la structure.

activer le module header :
configurer la sticky session basé sur le cookies
>    Header add Set-Cookie "ROUTEID=.%{BALANCER_WORKER_ROUTE}e; path=/" env=BALANCER_ROUTE_CHANGED
>    <Proxy balancer://dynamic>
>        BalancerMember 'http://<?php print "$dynamic_app1"?>' route=1
>        BalancerMember 'http://<?php print "$dynamic_app2"?>' route=2
>        ProxySet stickysession=ROUTEID
>    </Proxy>

en utilisant le template load-balancing -> round robin
en utilisant le template load-balancing-sticky -> c'est tjr le même serveur express qui est utilisé pour le même client.


## Step 7, Dynamic cluster management
`fb-dynamic-cluster-management`

### Acceptance critera
* You develop a solution, where the server nodes (static and dynamic) can appear or disappear at any time.
* You show that the load balancer is dynamically updated to reflect the state of the cluster.
* You describe your approach (are you implementing a discovery protocol based on UDP multicast? are you using a tool such as serf?)
* You have documented your configuration and your validation procedure in your report.

### Realisation

## Step 8, UI management
`fb-ui-management`

### Acceptance critera
* You develop a web app (e.g. with express.js) that administrators can use to monitor and update your web infrastructure.
* You find a way to control your Docker environment (list containers, start/stop containers, etc.) from the web app. For instance, you use the Dockerode npm module (or another Docker client library, in any of the supported languages).
* You have documented your configuration and your validation procedure in your report.

### Realisation

### installation :
`docker volume create portainer_data`
`docker run -d -p 9000:9000 --name portainer --restart always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer`

créer un compte admin et choisir de gérer l'environnement local
admin | 12341234



