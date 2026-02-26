import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { TitleAndId } from '../Interface/title-and-id.interface';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor() { }

  idSelectedChanged: Subject<number> = new Subject<number>();
  titleAndIdChanged: Subject<TitleAndId[]> = new Subject<TitleAndId[]>();

  private successMessageSubject = new Subject<string>();
  private errorMessageSubject = new Subject<string>();

  successMessage$ = this.successMessageSubject.asObservable();
  errorMessage$ = this.errorMessageSubject.asObservable();

  showSuccess(message: string) {
    this.successMessageSubject.next(message);
  }

  showError(message: string) {
    this.errorMessageSubject.next(message);
  }
}
