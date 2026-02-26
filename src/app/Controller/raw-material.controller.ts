import { HttpClient, HttpErrorResponse, HttpParams } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { Observable, catchError } from "rxjs";
import { Injectable } from "@angular/core";
import { RawMaterialModel } from "../Model/rawMaterial.model";
import { LoggerService } from "../Service/logger.service";

@Injectable({
  providedIn: 'root'
})
export class RawMaterialController {
  
  private baseUrl: string = `${environment.baseUrl}/rawMaterial`;
  constructor(
    private http: HttpClient,
    private logger: LoggerService
  ) {}

  getAll(page?: number, limit?: number): Observable<RawMaterialModel[]> {
    let params = new HttpParams();
    if (page !== undefined) {
      params = params.set('page', page.toString());
    }
    if (limit !== undefined) {
      params = params.set('limit', limit.toString());
    }
    return this.http.get<RawMaterialModel[]>(`${this.baseUrl}/listAll`, { params }).pipe(
      catchError((error: HttpErrorResponse) => this.logger.handleError(error))
    );
  }

  search(query: string | number, page?: number, limit?: number): Observable<RawMaterialModel[]> {
    let params = new HttpParams().set('query', query.toString());
    if (page !== undefined) {
      params = params.set('page', page.toString());
    }
    if (limit !== undefined) {
      params = params.set('limit', limit.toString());
    }
    return this.http.get<RawMaterialModel[]>(`${this.baseUrl}/search`, { params }).pipe(
      catchError((error: HttpErrorResponse) => this.logger.handleError(error))
    );
  }

  getById(id: number): Observable<RawMaterialModel> {
    const params = new HttpParams().set('id', id.toString());

    return this.http.get<RawMaterialModel>(`${this.baseUrl}/byId`, { params }).pipe(
      catchError((error: HttpErrorResponse) => this.logger.handleError(error))
    );
  }

  post(rawMaterial: RawMaterialModel): Observable<RawMaterialModel> {
    return this.http.post<RawMaterialModel>(`${this.baseUrl}/post`, rawMaterial).pipe(
      catchError((error: HttpErrorResponse) => this.logger.handleError(error))
    );
  }

  update(id: number, updatedRawMaterial: RawMaterialModel): Observable<RawMaterialModel> {
    return this.http.patch<RawMaterialModel>(`${this.baseUrl}/update/${id}`, updatedRawMaterial).pipe(
      catchError((error: HttpErrorResponse) => this.logger.handleError(error))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`).pipe(
      catchError((error: HttpErrorResponse) => this.logger.handleError(error))
    );
  }

}
