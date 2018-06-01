# Labo 5 HTTP

## Step 1 apache static

lancer le contenair docker du serveur apache directement : `docker run -d -p 9090:80 php:7.0-apache`

créer une image du conenair : `docker build -t res/apache_php .`
lancer l'image du contenair : 
    `docker run -d -p 9090:80 res/apache_php`
    `docker run -d -p 9091:80 res/apache_php` 

Il faut rebuild l'image pour que les nouveaux fichiers soient copiés.

Pour que tous les fichiers soient chargés correctement, il est nécessaire que les droits adéquats soient donnés sur les répertoires dans `/var/www/html`. Pour résoudre ce problème nous avons donnés tous les droits sur tous les fichiers.

### Step 2

### Step 3

### Step 4
