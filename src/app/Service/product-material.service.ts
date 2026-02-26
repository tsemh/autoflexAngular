import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, catchError, of, throwError } from 'rxjs';
import { ProductMaterialModel } from '../Model/productMaterial.model';
import { NotificationService } from './notification.service';
import { ProductMaterialController } from '../Controller/product-material.controller';
import { LoggerService } from './logger.service';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ProductMaterialService {

  private productMaterialSubject: BehaviorSubject<ProductMaterialModel[]> = new BehaviorSubject<ProductMaterialModel[]>([]);
  public productMaterial$: Observable<ProductMaterialModel[]> = this.productMaterialSubject.asObservable();
  
  private materialsChanged = new Subject<number>();
  public materialsChanged$: Observable<number> = this.materialsChanged.asObservable();

  constructor(
    private notificationService: NotificationService,
    private productMaterialController: ProductMaterialController,
    private logger: LoggerService
  ) { }

  getAll() {
    this.productMaterialController.listAll()
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.logger.handleError(error);
          this.notificationService.showError('Error fetching product-material relations');
          return of(null);
        })
      )
      .subscribe({
        next: (list: ProductMaterialModel[] | null) => {
          if (list !== null) {
            this.productMaterialSubject.next(list);
          }
        },
        error: (error: any) => {
          console.error('Error fetching product-material relations:', error);
        }
      });
  }

  listByProduct(productId: number) {
    return this.productMaterialController.listByProduct(productId).pipe(
      catchError((error: HttpErrorResponse) => this.logger.handleError(error))
    );
  }

  listByRawMaterial(rawMaterialId: number) {
    return this.productMaterialController.listByRawMaterial(rawMaterialId).pipe(
      catchError((error: HttpErrorResponse) => this.logger.handleError(error))
    );
  }

  post(productId: number, rawMaterialId: number, quantityRequired: number): Observable<ProductMaterialModel> {
    return this.productMaterialController.post(productId, rawMaterialId, quantityRequired)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.logger.handleError(error);
          this.notificationService.showError('Error creating product-material relation');
          console.error('Error creating relation:', error);
          return throwError(() => error);
        })
      );
  }

  notifyMaterialsChanged(productId: number) {
    this.materialsChanged.next(productId);
  }

  update(id: number, quantityRequired: number): Observable<ProductMaterialModel> {
    return this.productMaterialController.update(id, quantityRequired)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.logger.handleError(error);
          this.notificationService.showError('Error updating product-material relation');
          console.error('Error updating relation:', error);
          return throwError(() => error);
        })
      );
  }

  delete(id: number): Observable<any> {
    return this.productMaterialController.delete(id)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.logger.handleError(error);
          this.notificationService.showError('Error deleting relation');
          console.error('Error deleting relation:', error);
          return of(null);
        })
      );
  }

}
