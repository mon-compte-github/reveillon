import { Injectable } from '@angular/core';

import { Observable, Subject, ReplaySubject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
	providedIn: 'root'
})
export class SessionService {

	private subject = new ReplaySubject<string>(1);

	//
	// Lifecycle
	//

	constructor() {
		this.subject.next(localStorage.getItem('username'));
	}

	//
	// API
	//

	get(): Observable<string> {
        return this.subject;
    }

    set(u: string): void {
		if(u == null) {
			localStorage.removeItem('username');
			this.subject.next(null);
		} else {
			localStorage.setItem('username', u);
			this.subject.next(u);
		}
    }

}

// EOF