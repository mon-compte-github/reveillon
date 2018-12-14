import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from '../services/session.service';

@Component({
  selector: 'login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss']
})
export class LoginFormComponent implements OnInit {

  private valid_usernames = [ 'mélanie', 'pierre', 'nicolas', 'justine', 'sylvie', 'jérôme' ];

  username: string = null;

  constructor(private router: Router, private sessionService: SessionService) { }

  ngOnInit() {
    if(this.sessionService.get() != null) {
      this.router.navigate(['timeline']);
    }
  }

  onSubmit(): boolean {
    this.username = this.username.toLocaleLowerCase();
    if(this.valid_usernames.indexOf(this.username) != -1) {
      this.sessionService.set(this.username);
      this.router.navigate(['timeline']);
    }
    return false;
  }

}
