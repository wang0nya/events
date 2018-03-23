import { Injectable } from '@angular/core';
import firebase from 'firebase';
import { Reference, ThenableReference } from '@firebase/database-types';

@Injectable()
export class EventProvider {
  public eventListRef: Reference;
  constructor() {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this.eventListRef = firebase
          .database()
          .ref(`/userProfile/${user.uid}/eventList`);
      }
    });
  }

  createEvent(
    eventName: string,
    eventDate: string,
    eventPrice: number,
    eventCost: number
  ): ThenableReference {
    return this.eventListRef.push({
      name: eventName,
      date: eventDate,
      price: eventPrice * 1,
      cost: eventCost * 1,
      revenue: eventCost * -1,
    });
  }

  getEventList(): Reference {
    return this.eventListRef;
  }

  getEventDetail(eventId: string): Reference {
    return this.eventListRef.child(eventId);
  }

  addGuest(
    guestName: string,
    eventId: string,
    eventPrice: number,
    guestPicture: string = null
  ): PromiseLike<any> {
    return this.eventListRef
      .child(`${eventId}/guestList`)
      .push({ guestName })
      .then(newGuest => {
        this.eventListRef.child(eventId).transaction(event => {
          event.revenue += eventPrice;
          return event;
        });
        if (guestPicture != null) {
          firebase
            .storage()
            .ref(`/guestProfile/${newGuest.key}/profilePicture.png`)
            .putString(guestPicture, 'base64', {
              contentType: 'image/png',
            })
            .then(savedPicture => {
              this.eventListRef
                .child(`${eventId}/guestList/${newGuest.key}/profilePicture`)
                .set(savedPicture.downloadURL);
            });
        }
      });
  }
}
