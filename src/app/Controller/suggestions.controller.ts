import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LoggerService } from '../Service/logger.service';

@Injectable({ providedIn: 'root' })
export class SuggestionsController {
  private baseUrl = `${environment.baseUrl}/product`;

  constructor(private http: HttpClient, private logger: LoggerService) {}

  getSuggestions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/suggested-production`).pipe(
      catchError((error) => this.logger.handleError(error))
    );
  }
}
