import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/firestore';
import * as firebase from 'firebase';

import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

/**
 * Un élément fraîchement créé.
 */
export class NewElement {
	public qui: string;
	public quand: string;
	public quoi: string;
	public combien: number;
}

/**
 * Un élément "complet" récupéré du serveur.
 */
export class Element extends NewElement {

	public id: string;
	public done: boolean = false;
	public likes: { [ key: string ] : boolean } = {};
	// ajout version 2
	public lastUpdated: number;
	
	constructor(_qui: string, _quand: string, _quoi: string, _combien: number = 0) {
		super();
		this.qui = _qui;
		this.quand = _quand;
		this.quoi = _quoi;
		this.combien = _combien;
	}

}

/**
 * Une tranche horaire. Contient des éléments.
 */
export class TrancheHoraire {
	
	public elements: Element[] = [];

	constructor(public hour: string, public title: string) {
		// nop
	}

}

export class Session {
	public id: string;
	public qui: string;
	public timestamp: number;
}

@Injectable({
	providedIn: 'root'
})
export class DatabaseService {

	//
	// Lifecycle
	//

	constructor(private afs: AngularFirestore) {}

	//
	// API
	//

	saveSession(session: Session): Promise<void> {
		const collection = this.afs.collection<any>('sessions');
		return new Promise(function(resolve, reject) {
			// comment fonctionne firebase.database.ServerValue.TIMESTAMP ?!?
			// on reçoit « timestmap { .sv: "timestamp" } » ?!?
			let raw = {'qui': session.qui, timestamp: (new Date).getTime()};
			if(session.id) {
				collection.doc(session.id).update(raw)
					.then(() => {
						resolve();
					})
					.catch((error) => reject(error));

			} else {
				collection.add(raw)
					.then((ref: DocumentReference) => {
						resolve();
					})
					.catch((error) => reject(error));
			}
		});
	}

	lastConnected(qui: string): Observable<Session> {
		return this.afs.collection<Session>('sessions' , ref => ref.where("qui", "==", qui))
			.get().pipe(
				map(querySnapshot => {

					let sessions: Session[] = [];
					querySnapshot.forEach(function(doc) {
						let session = new Session();
						session.timestamp = doc.data().timestamp;
						session.qui = doc.data().qui;
						session.id = doc.id;
						sessions.push(session);
					});
					
					if(sessions && sessions.length > 0) {
						return sessions[0];
					}

					let res: Session = new Session();
					res.qui = qui;
					return res;
				})
			);
	}

	/**
	 * Renvoie la liste des tranches horaire.
	 */
	getTranches(): Observable<TrancheHoraire[]> {
		return this.afs.collection<TrancheHoraire>('tranches').snapshotChanges().pipe(
			map(actions => {
				// TODO sort by hour
				return actions.map(a => {
					// récupération des données et remarshalling
					// pas besoin d'id ici, on fait la jointure sur le title
					const item = a.payload.doc.data();
					// reconstruction d'un véritable objet
					Object.setPrototypeOf(item, TrancheHoraire.prototype);
					const result = (item as TrancheHoraire);
					result.elements = [];
					return result;
				}).sort((a, b) => {
					// tri par heure de début croissante
					return (a.hour < b.hour ? -1 : (a.hour > b.hour ? +1 : 0));
				});
			})	
		);
	}

	/**
	 * Renvoie la liste de TOUS les éléments.
	 */
	getElements(): Observable<Element[]> {
		return this.afs.collection<Element>('éléments').snapshotChanges().pipe(
			map(actions => {
				console.log(actions);
				return actions.map(a => {
					// récupération des données et remarshalling
					const result = new Element(null, null, null, null);
					Object.assign(result, a.payload.doc.data());
					result.id = a.payload.doc.id;
					console.log('getElements', result);
					return result;
				});
			})	
		);
	}

	// function CollectionReference.add() requires its first
	// argument to be of type object, but it was: a custom Element object
	createElement(elem: NewElement): Promise<Element> {
		const collection = this.afs.collection<any>('éléments');
		return new Promise(function(resolve, reject) {
			let raw = JSON.parse(JSON.stringify(elem));
			raw.lastUpdated = (new Date).getTime();
			delete raw.id; // pas besoin :-p
			collection.add(raw)
				.then((ref: DocumentReference) => {
					let result = new Element(elem.quand, elem.qui, elem.quoi, elem.combien);
					result.id = ref.id;
					resolve(result);
				})
				.catch((error) => reject(error));
		});
	}

	updateElement(elem: Element, patch: any): Promise<void> {
		const collection = this.afs.collection<any>('éléments');
		// mise à jour de la date de dernière modification
		patch.lastUpdated = (new Date).getTime();
		return collection.doc(elem.id).update(patch);
	}

	deleteElement(elem: Element): Promise<void> {
		const collection = this.afs.collection<any>('éléments');
		return collection.doc(elem.id).delete();
	}

}

// EOF