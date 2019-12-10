import { BrowserModule } from '@angular/platform-browser';
import { NgModule, Component, Injectable } from '@angular/core';
import { RouterModule, Routes, ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireAuthModule } from '@angular/fire/auth';

import { AppComponent } from './app.component';
import { LoginFormComponent } from './login-form/login-form.component';
import { TimelineComponent } from './timeline/timeline.component';
import { environment } from 'src/environments/environment';
import { catchError, map } from 'rxjs/operators';
import { SessionService } from './services/session.service';
import { Observable, of } from 'rxjs';


@Component({
  template: 'Oups'
})
export class PageNotFoundComponent {
  // nop
}


@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router, private sessionService: SessionService) {}

  canActivate(): Observable<boolean> {
    return this.sessionService.get().pipe(
      map(u => {
        if(u != null) return true;
        this.router.navigate(['/login']);
        return false;
      }),
      catchError((err) => {
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}


const appRoutes: Routes = [
  { path: 'login', component: LoginFormComponent },
  { path: 'timeline', component: TimelineComponent, canActivate: [AuthGuard] },
  { path: '**',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  //{ path: '**', component: PageNotFoundComponent }
];


@NgModule({
  declarations: [
    AppComponent,
    PageNotFoundComponent,
    LoginFormComponent,
    TimelineComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    RouterModule.forRoot(appRoutes),

    AngularFireModule.initializeApp(environment.config_firebase),
    AngularFireAuthModule,
    AngularFirestoreModule
  ],
  providers: [
    // nop -> provided in root ^^
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
