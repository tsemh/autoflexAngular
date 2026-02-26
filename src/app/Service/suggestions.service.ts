import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SuggestionsController } from '../Controller/suggestions.controller';

@Injectable({ providedIn: 'root' })
export class SuggestionsService {
  constructor(private suggestionsController: SuggestionsController) {}

  getSuggestions(): Observable<any[]> {
    return this.suggestionsController.getSuggestions();
  }
}
