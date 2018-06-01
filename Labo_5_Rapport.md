# Labo 5 HTTP

## Step 1 apache static

image docker de base, php : [](https://hub.docker.com/_/php/)

lancer le container docker du serveur apache directement : `docker run -d -p 9090:80 php:7.0-apache`

créer une image du container : `docker build -t res/apache_php .`
lancer l'image du container :
    `docker run -d -p 9090:80 res/apache_php`
    `docker run -d -p 9091:80 res/apache_php`

accèder au container en mode intéractif : `docker exec -it <container name> /bin/bash`

Il faut rebuild l'image pour que les nouveaux fichiers soient copiés.

Pour que tous les fichiers soient chargés correctement, il est nécessaire que les droits adéquats soient donnés sur les répertoires dans `/var/www/html`. Pour résoudre ce problème nous avons donnés tous les droits sur tous les fichiers.

### Step 2 express
#### a
image docker de base, node : [](https://hub.docker.com/_/node/)

Dans le rep src qui va contenir les fichiers sources de l'application : `npm init`
Va générer le fichier package.json

Installer le module change :  `npm install --save chance`

create docker image : `docker build -t res/express_students .`
`docker run res/express_students`
Les containers ne restent pas en exécution car dès que le script est termié le container d'arrête.

#### b
Détail d'une requête http : [](https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/)

Framework web : Express.js
Installer express : `npm install --save express`

Ecrire le serveur de génération d'étudients sous forme d'un serveur http.
Créer une image docker avec ce client: `docker build -t res/express_students .`
Créer un container depuis cette image : `docker run res/express_students`
Accèder à la machine : `telnet 172.17.0.3 3000`



### Step 3

### Step 4
