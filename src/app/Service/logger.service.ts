import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  constructor() { }

  handleError(error: HttpErrorResponse) {
      let errorMessage = 'Unknown error';
      if (error.error instanceof ErrorEvent) {
        errorMessage = `Error: ${error.error.message}`;
      } else {
        errorMessage = `Error code: ${error.status}, message: ${error.message}`;
        if (error.error && error.error.message) {
          errorMessage += `, server message: ${error.error.message}`;
        } else if (error.error && typeof error.error === 'string') {
          errorMessage += `, server message: ${error.error}`;
        } else if (error.error && typeof error.error === 'object') {
          errorMessage += `, server details: ${JSON.stringify(error.error)}`;
        }
      }
      console.error(errorMessage);
      return throwError(() => new Error(errorMessage));
  }
}
