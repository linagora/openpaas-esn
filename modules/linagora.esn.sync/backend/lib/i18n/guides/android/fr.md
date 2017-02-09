Synchronisation des courriels
----------------

 Afin de partager les messages entre vos appareils, nous allons configurer les paramètres du protocole IMAP 

### Ajouter un compte IMAP

Ces étapes peuvent varier d'un constructeur à l'autre.

1. Ouvrez l'application **Paramètres** de votre appareil (icône *engrenage* de la barre de notifications).

![icône Paramètres](/sync/images/fr/android_settings_icon.png)

2. Selon les surcouches, appuyez sur `Comptes` ou `Comptes et synchronisation`.

![menu Paramètres|Comptes](/sync/images/fr/android_settings_accounts.png)

3. Appuyez sur `Ajouter un compte`.

![ajouter un compte](/sync/images/fr/android_add_account.png)

4. Vous êtes redirigé(e) vers une page affichant les types de comptes, 
choisissez `Personnel (IMAP)`.

![Personnel IMAP](/sync/images/fr/android_add_imap_account.png)

5. Saisissez votre **adresse email** : `<%= user.preferredEmail %>`

![configurer login imap](/sync/images/fr/android_add_imap_account_1.png)
6. Appuyez sur `Config. Manuelle`.
    - Appuyez sur `Personnel (IMAP)`

    ![choisir imap](/sync/images/fr/android_add_imap_account_2.png)
    - Saisissez votre mot de passe

    ![saisie du mot de passe imap](/sync/images/fr/android_add_imap_account_3_password.png)
    - Saisissez (ou vérifiez) les **paramètres de réception** :    
        - __Nom d'utilisateur__: `<%= user.preferredEmail %>`)
        - __Mot de passe__: votre mot de passe *OpenPaaS*
        - __Serveur__: `<%= config.accounts[0].imap.hostName %>`
        - __Port__: `<%= config.accounts[0].imap.port %>`
        - __Type de sécurité__: STARTTLS

    ![serveur de réception](/sync/images/fr/android_add_imap_account_4_incoming.png)
    - Appuyez sur `Suivant`
    - Saisissez (ou vérifiez) les **paramètres d'envoi** :
        - __Exiger une connexion__: *Activé*
        - __Nom d'utilisateur__: `<%= user.preferredEmail %>`
        - __Serveur SMTP__: `<%= config.accounts[0].smtp.hostName %>`
        - __Port__: `<%= config.accounts[0].smtp.port %>`
        - __Type de sécurité__: STARTTLS

    ![serveur d'envoi](/sync/images/fr/android_add_imap_account_5_outgoing.png)
    - Appuyez sur `Suivant`
    - Choisissez vos préférences de synchronisation ou **gardez les paramètres par défaut**.
    ![préf de synchro](/sync/images/fr/android_add_imap_account_6.png)
    - Renseignez votre nom complet (qui sera utilisé pour les messages envoyés)
    ![saisir nom](/sync/images/fr/android_add_imap_account_7.png)

7. Votre configuration est terminée, vous pouvez accéder à vos messages grâce à votre application préférée.

Synchronisation de vos carnets d'adresse et de votre calendrier
----------------

### Prérequis

Les appareils sous Android ne gèrent pas les protocoles CalDAV et CardDAV par défaut,
vous allez devoir installer une application (`DAVdroid`) pour la synchronisation.   

> Attention: cette application requiert une version d'`Android` au minimum 4.0.3

- Ajoutez l'application `DAVdroid` en suivant les instructions ci-dessous:
1. Assurez-vous d'abord que le téléphone peut ajouter une application depuis des `Sources inconnues`,
en l'autorisant dans le menu `Paramètres | Sécurité`.
![menu Paramètres|Sécurité](/sync/images/fr/android_davdroid_settings_security.png)
![autoriser sources_inconnues](/sync/images/fr/android_davdroid_unknown_src.png)
2. Téléchargez le fichier [DAVdroid apk].
3. Ouvrez l'application `Téléchargements`
4. Appuyez sur le fichier téléchargé pour l'ouvrir et l'installer.
5. Faites défiler le texte jusqu'en bas (si nécessaire).
6. Appuyez sur `Install`
![install DAVdroid](/sync/images/fr/android_davdroid_installed.png)
7. Appuyez sur `Ouvrir`
8. Accédez à l'écran d'accueil après avoir passé les avertissements de licence.
![avertissement DAVdroid 1](/sync/images/fr/android_davdroid_1strun_1.png)
![avertissement DAVdroid 2](/sync/images/fr/android_davdroid_1strun_2.png)

### Régler la synchronisation des calendriers et des carnets d'adresses

1. Appuyez sur le bouton `+`
![DAVdroid vide](/sync/images/fr/android_davdroid_empty.png)
2. Saisissez votre adresse email `<%= user.preferredEmail %>` ainsi que votre mot de passe
![DAV domain credentials](/sync/images/fr/android_davdroid_add_account.png)
3. Appuyez sur `Se connecter`
4. Appuyez sur `Créer un compte` et appuyez sur la carte ajoutée.
![DAV yellow button](/sync/images/fr/android_davdroid_accounts_list.png)
5. Cochez (sur la gauche) les deux cartes CardDAV et CalDAV cards pour activer la synchronisation automatique.
![DAV enable automated sync](/sync/images/fr/android_davdroid_enable_autosync.png)
6. Il est possible d'ajuster les paramètres de synchronisation en allant dans le menu propriété (icône engrenage)

[DAVdroid apk]: https://f-droid.org/repo/at.bitfire.davdroid_136.apk
