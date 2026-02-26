import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SubmitFormUtil {

  static handleSubmit(event: Event) {
    event.preventDefault();
  }
}
