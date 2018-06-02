# Labo 5 HTTP

## Step 1 apache static
`fb-apache-static`
image docker de base, php : [](https://hub.docker.com/_/php/)

lancer le container docker du serveur apache directement : `docker run -d -p 9090:80 php:7.0-apache`

créer une image du container : `docker build -t res/apache_php .`
lancer l'image du container :
    `docker run -d -p 9090:80 res/apache_php`
    `docker run -d -p 9091:80 res/apache_php`

accèder au container en mode intéractif : `docker exec -it <container name> /bin/bash`

Il faut rebuild l'image pour que les nouveaux fichiers soient copiés.

Pour que tous les fichiers soient chargés correctement, il est nécessaire que les droits adéquats soient donnés sur les répertoires dans `/var/www/html`. Pour résoudre ce problème nous avons donnés tous les droits sur tous les fichiers.

## Step 2 express
`fb-express-dynamic`
### a
image docker de base, node : [](https://hub.docker.com/_/node/)

Dans le rep src qui va contenir les fichiers sources de l'application : `npm init`
Va générer le fichier package.json

Installer le module change :  `npm install --save chance`

create docker image : `docker build -t res/express_students .`
`docker run res/express_students`
Les containers ne restent pas en exécution car dès que le script est termié le container d'arrête.

### b
Détail d'une requête http : [](https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/)

Framework web : Express.js
Installer express : `npm install --save express`

Ecrire le serveur de génération d'étudients sous forme d'un serveur http.
Créer une image docker avec ce client: `docker build -t res/express_students .`
Créer un container depuis cette image : `docker run res/express_students`
Ou avec un port mapping : `docker run -p 9090:3000 res/express_students`
Accèder à la machine sur son adresse ip / ou localhost : `telnet 172.17.0.3 3000` / `telnet localhost 9090`

#### postman
permet de générer et sauver des requêtes http

## Step 3
`fb-apache-reverse-proxy`
Mise en place d'un reverse proxy avec apache afin de rediriger les requêtes dynamiques vers un container et les requêtes de contenu dynamiques vers un autre container.
### a
explication du setup

### b
Démarrer un container "apache_static" (port 80) : `docker run -d --name apache_static res/apache_php`
Démarrer un container "expresse_dynmaic" (port 3000): `docker run -d --name express_dynamic res/express_students`

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

Modifier le fichier de fichier de configuration `001-reverse-proxy.conf` pour que les requêtes soit dirigées enfonction du paramètre host indiqué dans le requête.
><VirtualHost *:80>
>	ServerName demo.res.ch
>
>	ErrorLog ${APACHE_LOG_DIR}/error.log
>	CustomLog ${APACHE_LOG_DIR}/access.log combined
>
>	ProxyPass "/api/students/" "http://172.17.0.3:3000/"
>	ProxyPassReverse "/api/students/" "http://172.17.0.3:3000/"
>
>	ProxyPass "/" "http://172.17.0.2:80/"
>	ProxyPassReverse "/" "http://172.17.0.2:80/"
></VirtualHost>

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

>GET /api/students/ HTTP/1.0
>Host: demo.res.ch
-> list d'étudiants

Le reverse proxy fonctionne donc correctement

### c
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
><VirtualHost *:80>
></VirtualHost>

`001-reverse-proxy.conf`
><VirtualHost *:80>
>   ServerName demo.res.ch
>
>   #ErrorLog ${APACHE_LOG_DIR}/error.log
>   #CustomLog ${APACHE_LOG_DIR}/access.log combined
>
>   ProxyPass "/api/students/" "http://172.17.0.3:3000/"
>   ProxyPassReverse "/api/students/" "http://172.17.0.3:3000/"
>   ProxyPass "/" "http://172.17.0.2:80/"
>   ProxyPassReverse "/" "http://172.17.0.2:80/">
></VirtualHost>

Constuire l'image docker : `docker build -t res/apache_reverse_proxy .`
Démarrer le container : `docker run -d -p 8080:80 res/apache_reverse_proxy`

Si on accède à "localhost:8080" -> on obtien le message "Forbiden", car le navigateur n'envoie pas le nom de domaine "Host: demo.res.ch".
Il faut configurer le fichier host pour que cela fonctionne.
`/etc/hosts`

Problème avec la configuaration du reverse proxy. : "The proxy server received an invalid response from an upstream server."
elated_engelbart
express_dynamic
apache_static


## Step 4 AJAX requests with JQuery
`fb-ajax-jquery`
Arrêter les containers : `docker kill <container name>`
Supprimer tous les containers : `docker rm \`docker ps -qa\``

Ajouter l'installation de vim dans le Dockerfile de l'image `apache-php-image`
>FROM php:7.0-apache
>
>RUN apt-get update && \
>    apt-get install -y vim
>
>COPY content/ /var/www/html/

Rebuild l'image : `docker build -t res/apache_php .`
Idem pour reverser_proxy : `docker build -t res/apache_reverse_proxy .`
Idem pour express_students : `docker build -t res/express_students .`

relancer les containers dans le bon ordre pour que les adresse ip soient juste selon la config du proxy.
apache-statis: `docker run -d --name apache-static res/apache_php`
expresse-dynamic: `docker run -d --name express-dynamic res/express_students`
reverse-proxy: `docker run -d -p 8080:80 --name apache-reverse-proxy res/apache_reverse_proxy`

On se connect sur le container "apache-static" pour faire la configuration ajax
`docker exec -it apache-static /bin/bash`

garder une copie de `index.html` -> `index.html.orig`

Inclure un scipt js en bas de la page index.html pour chager les students
><!-- Custom script to load students -->
><script src="js/students.js"></script>

On crée le script `students.js` dans js
- la variable "$" est un nom de variable utilisé par JQuery. -> quand JQuery à fini d'être chargé, alors exécuter cette fonction.
- Le script va faire une requête sur le serveur "express-students" pour récupérer le tableau json.
>$(function(){
>	console.log("loading students");
>
>	function loadStudents() {
>		$.getJSON( "/api/students/", function( students ) {
>			console.log(students);
>			var message = "Nobody is here";
>			if ( studnets.length > 0 ) {
>				message = students[0].firstname + " " + students[0].lastName;
>			}
>			$(".skills").text(message);
>		});
>	};
>});

- `$.getJSON( "/api/students/", function( students ) {` : emet une requête de contun JSON vers "/api/students/" et transmet la réponse à la fonction de call back
- `$(".skills").text(message);` : récupère un élément du "DOM" page html pour le remplacer avec le message


