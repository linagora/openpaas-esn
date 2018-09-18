Synchronisation des courriels
----------------

To check your emails, you can either use the OpenPaaS web interface or an email client. Here, you will learn how to associate your email account to **Outlook 2016**, an email client. This synchronization will allow you to read already received emails, even when you are offline.

Pour consulter vos courriels, vous pouvez soit utiliser l'interface web d'OpenPaaS soit un client de messagerie. Ici, la seconde option sera illustrée, à savoir comment associer votre compte courriel à **Outlook 2016**, un client de messagerie. Cette synchronisation vous permettra notamment de consulter les courriels déjà reçus en mode hors-ligne.

*Les instructions suivantes pourraient fonctionner avec une version plus ancienne qu'Outlook 2016, mais gardez à l'esprit que nous soutenons uniquement Outlook 2016 et suivants.*

### Set up a new email account

1. Tout d'abord, vous devez lancer Outlook 2016 en double-cliquant sur son raccourci, comme indiqué ci-dessous.
![The outlook icon](/sync/images/en/windows_home_outlook.png)

2. Ensuite, vous devrez naviguer dans l'onglet `File`, présent dans le coin supérieur gauche.
![The *File* tap](/sync/images/en/windows_setup_outlook_account_0.png)

3. Une fois ici, cliquez sur `Add an Account`, ce qui va faire apparaître une nouvelle fenête.
![Add Account](/sync/images/en/windows_setup_outlook_account_1.png)

4. A l'intérieur de cette nouvelle fenêtre, renseignez votre addresse courriel et cliquez sur `Connect`.
![Email address field](/sync/images/en/windows_setup_outlook_account_2.png)

5. Vous pouvez maintenant entrer le mot de votre compte OpenPaaS et cliquez une fois de plus sur `Connect`.
![Password field](/sync/images/en/windows_setup_outlook_account_3.png)

6. Patientez jusqu'à ce que le message `Account setup is complete` apparaîsse puis cliquez sur `Ok`. C'est tout! Vous pouvez dès à présent recevoir et envoyer des courriels depuis Outlook, félicitations!
![Processing your request](/sync/images/en/windows_setup_outlook_account_4.png)
![Your account setup is now complete!](/sync/images/en/windows_setup_outlook_account_5.png)

Calendars synchronization
----------------

Pour consulter votre calendrier, vous pouvez soit utiliser l'interface web d'OpenPaaS, soit une application native compatible avec le protocole CalDAV. Malheureusement, Outlook n'est pas compatible avec CalDAV. Afin de pouvoir utiliser Outlook pour consulter et modifier votre calendrier, le module `Outlook CalDav Synchronizer` devra être installé. Une fois ce dernier installé, vous pourrez associer votre calendrier OpenPaaS avec Outlook.

*Pour installer le module en question, des droits administrateurs sont nécessaires. Si vous ne savez pas si vous les avez ou non, demandez assistance à votre équipe de support informatique.*

### Installation d'Outlook CalDav Synchronizer

1. En premier lieu, ouvrez un navigateur web comme Firefox, Chrome, ou Internet Explorer.
![Firefox shortcut](/sync/images/en/windows_firefox_shortcut.png)

2. Dans la barre d'adresse, écrivez ou copiez et collez l'addresse suivante, puis pressez la touche *Enter*: `https://caldavsynchronizer.org/`.
![URL address](/sync/images/en/windows_install_caldavsynchronizer_2.png)

3. Naviguez dans la section `Download` localisée dans la barre du haut et une fois sur place, cliquez sur le rectangle bleu appelé `Download [...]`, ce qui déclenchera l'ouverture d'une fenêtre.
![Download section](/sync/images/en/windows_install_caldavsynchronizer_3.png)

4. Selectionnez `Ok` dans la fenêtre en question.
![File explorer](/sync/images/en/windows_install_caldavsynchronizer_4.png)

5. Une fois le téléchargement effectué, une fenêtre va s'ouvrir, révélant deux fichiers. Double-cliquez sur le fichier `CalDavSynchronizer.Setup.msi`, ce qui va déclencher l'installeur.
![File explorer](/sync/images/en/windows_install_caldavsynchronizer_5.png)

5. Dans la première fenêtre de l'installeur, cliquez sur `Next`, puis `Next`.
![Installer: first step](/sync/images/en/windows_install_caldavsynchronizer_6.png)
![Installer: second step](/sync/images/en/windows_install_caldavsynchronizer_7.png)

7. Une nouvelle fenêtre va apparaître, avec la question suivante: `Do you want to allow this to make changes to your device?` Selectionnez le bouton `Yes`.
![Changes to your device](/sync/images/en/windows_install_caldavsynchronizer_8.png)

8. Une fois l'installation effectuée, cliquez sur le bouton `Close`. Félicitations: `Cal Dav Synchronizer` est maintenant installé!
![Download section](/sync/images/en/windows_install_caldavsynchronizer_9.png)

### Set up a new calendar account with CalDav Synchronizer

Cal Dav Synchronizer est maintenant installé. Vous pouvez dès à présent associer votre calendrier OpenPaaS avec Outlook.

1. En premier lieu, double-cliquez sur le raccourci Outlook 2016, comme indiqué sur la capture d'écran ci-dessous.
![The outlook icon](/sync/images/en/windows_home_outlook.png)

2. Naviguez vers l'onglet `CalDav Synchronizer`, localisé en haut de l'écran. Un ruban apparaîtra, dévoilant d'autres options. Choississez `Sychronization Profiles`.
![Outlook CalDav](/sync/images/en/windows_setup_caldavsynchronizer_1.png)

3. Une fois ici, sélectionnez le **Plus symbol**. Sur la nouvelle fenêtre, laissez les paramêtres par défaut et cliquez sur `OK`.

4. Choisissez un nom pour votre profile, qui peut par exemple correspondre au nom du calendrier que vous souhaitez synchroniser avec Outlook. Dans notre example, le nom est `My OpenPaaS main calendar`. Sous `Outlook Settings`, à la fin du champ `Outlook folder`, cliquez sur les **trois petits points**. Depuis ici, selectionnez `New...`. Une nouvelle petite fenêtre va apparaître. Sous le champ `Folder contains`, choississez `Calendar Items`. Choississez dans quel dossier vous souhaitez que votre calendrier soit ajouté, et appuyez sur `Ok`.
*La boîte `Synchronize items immediately after change` peut être validée.*
![How to sync](/sync/images/en/windows_setup_caldavsynchronizer_2.png)

5. Sous la section `Server Settings`, remplissez `DAV URL`. Elle doit correspondre à votre nom de domaine, auquel vous ajouterez `/sdav/`.
        * - **DAV URL**: `<%= user.preferredEmail %>`/sdav/
        * - **Username**: `<%= user.preferredEmail %>`
        * - **Password**: *OpenPaaS* password
        * - **Email address**: `<%= user.preferredEmail %>`
    * Une fois que vous avez terminé, cliquez sur `OK` en bas à droit de la fenêtre.
![Done with your settings](/sync/images/en/windows_setup_caldavsynchronizer_3.png)

6. Une fenêtre va s'ouvrir, vous permettant de choisir quel calendrier sera synchronisé avec Outlook. Choississez un calendrier et cliquez sur `OK`. Sur l'autre fenêtre, cliquez encore sur `OK`.
![The calendar to sync](/sync/images/en/windows_setup_caldavsynchronizer_4.png)

7. C'est tout, Outlook est maintenant synchronisé sync avec votre calendrier OpenPaaS! N'hésitez pas à naviguer dnas la partie calendrier d'Outlook pour interagir avec ce dernier.
![Calendar in Outlook](/sync/images/en/windows_setup_caldavsynchronizer_5.png)