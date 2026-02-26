import { HttpClient, HttpErrorResponse, HttpParams } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { Observable, catchError } from "rxjs";
import { Injectable } from "@angular/core";
import { ProductModel } from "../Model/product.model";
import { LoggerService } from "../Service/logger.service";

@Injectable({
  providedIn: 'root'
})
export class ProductController {
  
  private baseUrl: string = `${environment.baseUrl}/product`;
  constructor(
    private http: HttpClient,
    private logger: LoggerService
  ) {}

  getAll(page?: number, limit?: number): Observable<ProductModel[]> {
    let params = new HttpParams();
    if (page !== undefined) {
      params = params.set('page', page.toString());
    }
    if (limit !== undefined) {
      params = params.set('limit', limit.toString());
    }
    return this.http.get<ProductModel[]>(`${this.baseUrl}/listAll`, { params }).pipe(
      catchError((error: HttpErrorResponse) => this.logger.handleError(error))
    );
  }

  search(query: string | number, page?: number, limit?: number): Observable<ProductModel[]> {
    let params = new HttpParams().set('query', query.toString());
    if (page !== undefined) {
      params = params.set('page', page.toString());
    }
    if (limit !== undefined) {
      params = params.set('limit', limit.toString());
    }
    return this.http.get<ProductModel[]>(`${this.baseUrl}/search`, { params }).pipe(
      catchError((error: HttpErrorResponse) => this.logger.handleError(error))
    );
  }

  getById(id: number): Observable<ProductModel> {
    const params = new HttpParams().set('id', id.toString());

    return this.http.get<ProductModel>(`${this.baseUrl}/byId`, { params }).pipe(
      catchError((error: HttpErrorResponse) => this.logger.handleError(error))
    );
  }

  post(product: ProductModel): Observable<ProductModel> {
    return this.http.post<ProductModel>(`${this.baseUrl}/post`, product).pipe(
      catchError((error: HttpErrorResponse) => this.logger.handleError(error))
    );
  }

  update(id: number, updatedProduct: ProductModel): Observable<ProductModel> {
    return this.http.patch<ProductModel>(`${this.baseUrl}/update/${id}`, updatedProduct).pipe(
      catchError((error: HttpErrorResponse) => this.logger.handleError(error))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`).pipe(
      catchError((error: HttpErrorResponse) => this.logger.handleError(error))
    );
  }

}
