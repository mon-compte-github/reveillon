import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';

import { DatabaseService, TrancheHoraire, Element, NewElement } from '../services/database.service';
import { SessionService } from '../services/session.service';
import { Router } from '@angular/router';

@Component({
  selector: 'timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent implements OnInit {

	// alias - récupéré de la session
	qui: string;

	// la liste des tranches horaires
	tranches: TrancheHoraire[] = [];

	// (temporaire) tranche sélectionné par l'utilisateur
	tranche: TrancheHoraire;

	// (temporaire) nouveau ou saisi par l'utilisateur
	nouveau: NewElement = ({} as NewElement);

	// timestamp de dernière connexion
	lastConnected: number = 0;

	//
	// Lifecycle
	//

	constructor(private router: Router, private afs: AngularFirestore, private sessionService: SessionService,
		private databaseService: DatabaseService) {}

	ngOnInit(): void {
		
		this.databaseService.whenReady().then(() => {

			// qui est connecté ? sera affiché sur la page
			this.sessionService.get().subscribe((qui) => {
				// sauvegarde de l'heure de dernière connexion
				this.databaseService.lastConnected(qui).subscribe((session) => {
					this.lastConnected = session.timestamp;
					this.databaseService.saveSession(session);
				});
				this.qui = qui;
			});

			// récupération des tranches horaires
			this.databaseService.getTranches().subscribe((result) => {

				// arrivage d'un nouveau snapshot
				this.tranches = result;
				
				// actualisation des éléments
				this.databaseService.getElements().subscribe((result) => {

					this.tranches.forEach(item => item.elements = []);

					// réaccrochage des éléments
					// à la tranche horaire qui correspond
					result.forEach(item => {
						// recherche de la tranche horaire qui correspond
						let filtered = this.tranches.filter(t => t.title == item.quand);
						if(filtered.length == 1) {
							// trouvé ? on ajoute l'élément à la tranche horaire
							filtered[0].elements.push(item);
						} else {
							console.error('la tranche ' + item.quand + ' n\'existe pas ?!?');
						}
					});

				}, (error) => {
					window.alert('Erreur de récupération des éléments' + "\n" + error);
				});

			}, (error) => {
				window.alert('Erreur de récupération des tranches' + "\n" + error);
			});

		});

	}

	//
	// Internal api 
	//

	isModifying(): boolean {
		return (this.nouveau instanceof Element);
	}

	disconnect(): void {
		this.sessionService.set(null);
		this.qui = null;
		// on s'en va :'(
		this.router.navigate(['login']);
	}

	toggleDone(event: any, elem: Element): void {
		this.databaseService.updateElement(elem, { "done": event.target.checked })
			.then(() => { elem.done =  event.target.checked; })
			.catch((err) => window.alert('Erreur de mise-à-jour :\'(' + "\n" + err));
	}

	like(elem: Element, like: boolean): void {
		let value = Object.assign({}, elem.likes);
		value[this.qui] = like;
		this.databaseService.updateElement(elem, { "likes": value })
			.then(() => { 
				if(!elem.likes) {
					elem.likes = {};
				}
				elem.likes[this.qui] = like;
			})
			.catch((err) => window.alert('Erreur de mise-à-jour :\'(' + "\n" + err));
	}

	numLikes(elem: Element, like: boolean): number {
		let total = 0;
		Object.keys(elem.likes || {}).forEach(key => {
			if(elem.likes[key] == like) {
				total ++;
			}
		});
		return total;
	}

	trancheHasNew(tra: TrancheHoraire): boolean {
		let result: boolean = false;
		//  TODO utiliser reduce ...
		tra.elements.forEach(elem => {
			if(elem.lastUpdated && elem.lastUpdated > this.lastConnected) {
				result = true;
			}
		});
		return result;
	}

	elementHasNew(elem: Element): boolean {
		return (elem.lastUpdated && elem.lastUpdated > this.lastConnected);
	}

	montant(tra: TrancheHoraire): number {
		return tra.elements.map(elem => elem.combien).reduce((acc, val) => acc+val, 0);
	}

	total(): number {
		return this.tranches.reduce((acc, val) => acc + this.montant(val), 0);
	}

	totalParPersonne(): number {
		return Math.round(this.total() / 6 * 100) / 100;
	}

	isInvalid(): boolean {
		return (!this.nouveau.quoi || this.nouveau.quoi == ''); 
	}

	//
	// Events
	//

	onSelect(elem: Element): void {
		this.nouveau = elem;
	}

	// prépare la création d'un nouvel élément
	onCreate(tra: TrancheHoraire): void {
		this.nouveau = new NewElement();
		this.nouveau.quand = tra.title;
		this.nouveau.qui = this.qui;
	}

	// demande de suppression d'un élément
	onDelete(elem: Element): void {
		this.databaseService.deleteElement(elem)
			.then((elem) => {
				// reset des valeurs temporaires
				this.nouveau = null;
			})
			.catch((err) => window.alert('Erreur de suppression :\'(' + "\n" + err));
	}

	onSubmit(): void {
		if(this.isInvalid()) {
			return;
		}
		let combien = parseInt('' + this.nouveau.combien);
		this.nouveau.combien = isNaN(combien) ? 0 : combien;
		if(this.nouveau instanceof Element) {
			let patch = {'quoi': this.nouveau.quoi, 'combien': this.nouveau.combien};
			this.databaseService.updateElement(this.nouveau as Element, patch)
				.then((elem) => {
					// reset des valeurs temporaires
					this.tranche = null, this.nouveau = ({} as NewElement);
				})
				.catch((err) => window.alert('Erreur de sauvegarde :\'(' + "\n" + err));
		} else {
			// normalisation
			this.databaseService.createElement(this.nouveau)
				.then((elem) => { 
					// pas d'update ici, sera provoqué par 
					// la notification d'ajout envoyée par firebase

					// reset des valeurs temporaires
					this.tranche = null, this.nouveau = ({} as NewElement);
				})
				.catch((err) => window.alert('Erreur de sauvegarde :\'(' + "\n" + err));
		}
	}

}
