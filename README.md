

Site vite fait pour organiser le repas du nouvel an entre potes, écrit en angular 8 + bootstrap 4.
Les pages et les données sont hébergées sur firebase (cloud firestore + hosting).

Nécessite une base de données firecloud à configurer dans `environment.ts` (celui de dév ET celui de prod).

```
config_firebase: {
    apiKey: "AIzaS...Wwyc",
    authDomain: "...m",
    databaseURL: "https://...",
    projectId: "...",
    storageBucket: "xxx.appspot.com",
    messagingSenderId: "...",
    appId: "..."
}
```

L'application intialise toute seule les données de fonctionnement (tranches horaires).
L'accès à l'application est retreint, l'utilisateur doit saisir son prénom qui doit
être présent dans le liste des prénoms autorisés (sécurité bidon mais suffisante ^^).

Pour déployer :

```
$ ng build --prod
$ firebase login
$ firebase init
-> public directory : dist/reveillon
-> overwrite index.html : No !
$ firebase deploy
```
