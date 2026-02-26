import { HttpClient, HttpErrorResponse, HttpParams } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { Observable, catchError } from "rxjs";
import { Injectable } from "@angular/core";
import { LoggerService } from "../Service/logger.service";
import { ProductMaterialModel } from "../Model/productMaterial.model";

@Injectable({
  providedIn: 'root'
})
export class ProductMaterialController {

  private baseUrl: string = `${environment.baseUrl}/productMaterial`;

  constructor(
    private http: HttpClient,
    private logger: LoggerService
  ) {}

  post(productId: number, rawMaterialId: number, quantityRequired: number): Observable<ProductMaterialModel> {
    const payload: Partial<ProductMaterialModel> = {
      productId,
      rawMaterialId,
      quantityRequired
    };

    return this.http.post<ProductMaterialModel>(`${this.baseUrl}/post`, payload).pipe(
      catchError((error: HttpErrorResponse) => this.logger.handleError(error))
    );
  }

  listAll(): Observable<ProductMaterialModel[]> {
    return this.http.get<ProductMaterialModel[]>(`${this.baseUrl}/listAll`).pipe(
      catchError((error: HttpErrorResponse) => this.logger.handleError(error))
    );
  }

  listById(id: number): Observable<ProductMaterialModel> {
    const params = new HttpParams().set('id', id.toString());

    return this.http.get<ProductMaterialModel>(`${this.baseUrl}/byId`, { params }).pipe(
      catchError((error: HttpErrorResponse) => this.logger.handleError(error))
    );
  }

  listByProduct(productId: number): Observable<ProductMaterialModel[]> {
    const params = new HttpParams().set('productId', productId.toString());

    return this.http.get<ProductMaterialModel[]>(`${this.baseUrl}/byProduct`, { params }).pipe(
      catchError((error: HttpErrorResponse) => this.logger.handleError(error))
    );
  }

  listByRawMaterial(rawMaterialId: number): Observable<ProductMaterialModel[]> {
    const params = new HttpParams().set('rawMaterialId', rawMaterialId.toString());

    return this.http.get<ProductMaterialModel[]>(`${this.baseUrl}/byRawMaterial`, { params }).pipe(
      catchError((error: HttpErrorResponse) => this.logger.handleError(error))
    );
  }

  listByProductAndRawMaterial(productId: number, rawMaterialId: number): Observable<ProductMaterialModel[]> {
    const params = new HttpParams()
      .set('productId', productId.toString())
      .set('rawMaterialId', rawMaterialId.toString());

    return this.http.get<ProductMaterialModel[]>(`${this.baseUrl}/byProductAndRawMaterial`, { params }).pipe(
      catchError((error: HttpErrorResponse) => this.logger.handleError(error))
    );
  }

  update(id: number, quantityRequired: number): Observable<ProductMaterialModel> {
    const payload: Partial<ProductMaterialModel> = {
      quantityRequired
    };

    return this.http.patch<ProductMaterialModel>(`${this.baseUrl}/update/${id}`, payload).pipe(
      catchError((error: HttpErrorResponse) => this.logger.handleError(error))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`).pipe(
      catchError((error: HttpErrorResponse) => this.logger.handleError(error))
    );
  }

}