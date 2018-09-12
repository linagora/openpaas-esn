Synchronisation des courriels
----------------

Pour consulter vos courriels, vous pouvez soit utiliser l'interface web d'OpenPaaS soit un client de messagerie. Ici, la seconde option sera illustrée, à savoir comment associer votre compte courriel à un client de messagerie sur mobile, ceci en passant par le protocol IMAP. Cette synchronisation vous permettra notamment de consulter les courriels déjà reçus en mode hors-ligne.


### Ajouter un compte courriel

1. Sur l'écran d'accueil, naviguez dans **Réglages** en sélectionnant l'icône en forme d'engrenage.
![go to Settings](/sync/images/fr/ios_home_screen.png)

2. Défilez ver le bas jusqu'à atteindre la catégorie `Mail`, que vous allez ouvrir.
![go to Mail](/sync/images/fr/ios_add_imap_account_1.png)

3. Ensuite, sélectionnez`Comptes`, soit la premier élément de la catégorie.
![open Accounts](/sync/images/fr/ios_add_imap_account_2.png)

4. Puis `Ajouter un compte`.
![Add Account](/sync/images/fr/ios_add_imap_account_3.png)

5. Lors du choix du compte, sélectionnez `Autre` à la fin de la liste.
![Add Account](/sync/images/fr/ios_add_imap_account_4.png)

6. Selectionnez ensuite `Ajouter un compte Mail`.
![Add Account](/sync/images/fr/ios_add_imap_account_5.png)

7. Sur la nouvelle page, remplissez les catégories demandées avec vos informations OpenPaaS.
    * - __Nom__: `<%= user.preferredEmail %>`
    * - __Address__: `<%= user.preferredEmail %>`
    * - __Mot de passe__: Mot de passe *OpenPaaS*
    * - __Description__: Mon compte OpenPaaS!
![Add Account](/sync/images/fr/ios_add_imap_account_6.png)

8. Sur l'écran suivant, utilisez les paramètres suivants:
    * **Serveur de réception**:
        * - __Nom d'hôte__: `<%= config.accounts[0].imap.hostName %>`
        * - __Nom d'utilisateur__: `<%= user.preferredEmail %>`
        * - __Mot de passe__: Mot de passe *OpenPaaS*
    * Ainsi que les paramètres suivants pour le **Serveur d'envoi** :
        * - __Nom d'hôte__: `<%= config.accounts[0].imap.hostName %>`
        * - __Nom d'utilisateur__: *Optionnel*
        * - __Mot de passe__: *Optionnel*
Quand vous avez terminé, appuyez sur `Suivant`.
![Add Account](/sync/images/fr/ios_add_imap_account_7.png)

9. Si la fenêtre `Connexion impossible avec SSL` apparaît, sélectionnez `Oui`
![Add Account](/sync/images/fr/ios_add_imap_account_8.png)

10. Enfin, sur l'écran `IMAP`, clicuez juste sur le bouton `Enregistrer`. **Félicitations, votre compte est maintenant configuré !** Vous pouvez dorénavant accéder à vos courriels en utilisant votre application mail favorite.

Synchronisation des calendriers
----------------

Pour consulter votre agenda, vous pouvez soit utiliser l'interface Web OpenPaaS, soit l'application `Calendrier` native de votre appareil iOS. Ici, vous apprendrez comment utiliser la seconde option, à savoir synchroniser votre appareil iOS avec OpenPaaS. Cela vous permettra notamment de lire et de modifier les événements déjà reçus, même lorsque vous êtes hors ligne.

### Ajouter un nouveau compte calendrier

1. A partir de l'écran d'accueil, dirigez-vous sur **Règlages** en appuyant sur l'icône en forme d'engrenage.
![go to Settings](/sync/images/en/ios_home_screen.png)

2. Faites défilez le menu jusqu'à la catégorie `Calendrier`, que vous allez ouvrir.
![go to Calendar](/sync/images/en/ios_caldav_account_1.png)

3. Ensuite, appuyez sur `Comptes`, soit le premier élément de la catégorie.
![open Accounts](/sync/images/en/ios_caldav_account_2.png)

4. Sélectionnez `Ajouter un compte`, soit le dernier élément de la liste.
![Add Account](/sync/images/en/ios_caldav_add_account_1.png)

5. Sélectionnez `Autre` tout en bas de la liste.
![Other Account](/sync/images/en/ios_caldav_add_account_2.png)

6. Choisissez `Ajouter un compte CalDAV`.
![CalDAV Account](/sync/images/en/ios_caldav_add_account_3.png)

7. Sur la page `CalDAV`, remplissez les catégories vides avec les informations de votre compte OpenPaaS, en utilisant les éléments ci-dessous. Une fois terminé, vous pourrez sélectionner le bouton `Enregistrer`.
    * Veuillez utiliser les paramètres **CalDAV** ci-dessous:
        * - __Serveur__: `<%= config.accounts[0].imap.hostName %>`
        * - __Nom d'utilisateur__: `<%= user.preferredEmail %>`
        * - __Mot de passe__: Votre mot de passe *OpenPaaS*
        * - __Description__: *Optionnel*
![CalDAV config](/sync/images/en/ios_caldav_add_account_4.png)

8. Finalement, sélectionnez `Enregistrer`. C'est tout! **La synchronization est maintenant en place!**.
![CalDAV config](/sync/images/en/ios_caldav_add_account_5.png)
