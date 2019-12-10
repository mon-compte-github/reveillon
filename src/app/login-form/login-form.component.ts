import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from '../services/session.service';

import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase/app';

@Component({
  selector: 'login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss']
})
export class LoginFormComponent implements OnInit {

  private valid_usernames = [ 'mélanie', 'pierre', 'nicolas', 'justine', 'sylvie', 'jérôme', 'bertrand', 'emmanuelle' ];

  connected: boolean = false;

  username: string = null;

  // auth est requis pour que firebase fonctionne, sinon ...
  // FirebaseError: Firebase: No Firebase App '[DEFAULT]' has been created - call Firebase App.initializeApp() (app/no-app).
  constructor(private router: Router, private sessionService: SessionService,
      private auth: AngularFireAuth, private zone: NgZone) {}

  ngOnInit() {
    console.log("Authentification en cours ...");

    // authentification anonyme sur le datastore 
    firebase.auth().signInAnonymously().then(() => {

      console.log("Authentification firebase réussie");

      this.zone.run(() => {
        this.connected = true;
  
        // auto-login
        if(this.sessionService.get() != null) {
          this.router.navigate(['timeline']);
        }
      });

    }).catch((error) => {
      window.alert(error.code + ' - ' + error.message);
    });
  }

  onSubmit(): boolean {
    console.log('Hello ' + this.username)
    this.username = this.username.toLocaleLowerCase();
    if(this.valid_usernames.indexOf(this.username) != -1) {
      this.sessionService.set(this.username);
      this.router.navigate(['timeline']);
    }
    return false;
  }

}
