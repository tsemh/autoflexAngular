import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, of, switchMap, throwError, tap } from 'rxjs';
import { RawMaterialModel } from '../Model/rawMaterial.model';
import { NotificationService } from './notification.service';
import { RawMaterialController } from '../Controller/raw-material.controller';
import { LoggerService } from './logger.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ProductMaterialService } from './product-material.service';
import { ProductController } from '../Controller/product.controller';
import { ProductModel } from '../Model/product.model';

@Injectable({
  providedIn: 'root',
})
export class RawMaterialService {
  
  private idSelected!: number;
  private rawMaterialSubject: BehaviorSubject<RawMaterialModel[]> = new BehaviorSubject<RawMaterialModel[]>([]);
  public rawMaterial$: Observable<RawMaterialModel[]> = this.rawMaterialSubject.asObservable();

  constructor(
    private notificationService: NotificationService,
    private rawMaterialController: RawMaterialController,
    private logger: LoggerService,
    private productMaterialService: ProductMaterialService,
    private productController: ProductController) { }

  get idSelect():number {
    return this.idSelected;
  }
  set idSelect(newId: number) {
    if (newId !== this.idSelected) {
      this.notificationService.idSelectedChanged.next(newId);
    }
    this.idSelected = newId;
  }

  post(newRawMaterial: RawMaterialModel) {
    const materialInfo = newRawMaterial as any;
    
    if (materialInfo.createNewProduct && materialInfo.newProductCode && materialInfo.newProductName) {
      this.postMaterialWithNewProduct(materialInfo);
    } else {
      this.postMaterialOnly(newRawMaterial);
    }
  }

  private postMaterialWithNewProduct(materialInfo: any) {
    console.log('[POST] Mode: Create MATERIAL + PRODUCT (2 posts)');
    const newProduct = this.buildProductFromInfo(materialInfo);
    
    this.productController.post(newProduct).pipe(
      switchMap((createdProduct: ProductModel) => {
        console.log('[PRODUCT CREATED]', createdProduct);
        this.notificationService.showSuccess('Product created successfully');
        return this.rawMaterialController.post(this.buildCleanMaterial(materialInfo)).pipe(
          switchMap((createdMaterial: any) => this.linkProductToMaterial(
            createdProduct.id,
            createdMaterial.id,
            materialInfo.newProductValue
          ).pipe(
            switchMap(() => of(createdMaterial))
          ))
        );
      }),
      catchError((error: HttpErrorResponse) => {
        this.logger.handleError(error);
        this.notificationService.showError('Error creating product or raw material');
        return of(null);
      })
    ).subscribe({
      next: (response: any) => {
        if (response) {
          console.log('[POST SUCCESS]', response);
          this.notificationService.showSuccess('Raw material and Product created successfully');
          this.getAll(1, 100);
        }
      },
      error: (error: any) => {
        console.error('Error creating new raw material:', error);
      }
    });
  }

  private postMaterialOnly(newRawMaterial: RawMaterialModel) {
    console.log('[POST] Mode: Create only MATERIAL (1 post)');
    const productId = (newRawMaterial as any).productId;
    
    this.rawMaterialController.post(this.buildCleanMaterial(newRawMaterial)).pipe(
      switchMap((createdMaterial: any) => {
        console.log('[MATERIAL CREATED]', createdMaterial);
        this.notificationService.showSuccess('Raw material created successfully');
        
        if (productId && productId !== 0) {
          return this.linkProductToMaterial(productId, createdMaterial.id, (newRawMaterial as any).productQuantity);
        }
        return of(createdMaterial);
      }),
      catchError((error: HttpErrorResponse) => {
        this.logger.handleError(error);
        this.notificationService.showError('Error creating new raw material');
        return of(null);
      })
    ).subscribe({
      next: (response: any) => {
        if (response) {
          console.log('[POST SUCCESS]', response);
          this.getAll(1, 100);
        }
      },
      error: (error: any) => {
        console.error('Error creating new raw material:', error);
      }
    });
  }

  update(rawMaterialInfo: any) {
    const rawMaterialId = this.idSelect;
    
    if (rawMaterialInfo.createNewProduct && rawMaterialInfo.newProductCode && rawMaterialInfo.newProductName) {
      this.updateMaterialWithNewProduct(rawMaterialId, rawMaterialInfo);
    } else {
      this.updateMaterialOnly(rawMaterialId, rawMaterialInfo);
    }
  }

  private updateMaterialWithNewProduct(rawMaterialId: number, rawMaterialInfo: any) {
    console.log('[UPDATE] Mode: Update MATERIAL + create PRODUCT + create relation');
    const newProduct = this.buildProductFromInfo(rawMaterialInfo);
    
    this.rawMaterialController.update(rawMaterialId, this.buildCleanMaterial(rawMaterialInfo)).pipe(
      switchMap((updatedMaterial: any) => {
        if (!updatedMaterial) return of(null);
        console.log('[MATERIAL UPDATED]', updatedMaterial);
        this.notificationService.showSuccess('Raw material updated successfully');
        
        return this.productController.post(newProduct).pipe(
          switchMap((createdProduct: ProductModel) => {
            console.log('[PRODUCT CREATED]', createdProduct);
            return this.linkProductToMaterial(createdProduct.id, updatedMaterial.id, rawMaterialInfo.newProductValue).pipe(
              switchMap(() => of(updatedMaterial))
            );
          })
        );
      }),
      catchError((error: HttpErrorResponse) => {
        this.logger.handleError(error);
        this.notificationService.showError('Error creating product or updating raw material');
        return of(null);
      })
    ).subscribe({
      next: (response: any) => {
        if (response) {
          console.log('[UPDATE SUCCESS]', response);
          this.getAll(1, 100);
        }
      },
      error: (error: any) => {
        console.error('Error updating raw material:', error);
      }
    });
  }

  private updateMaterialOnly(rawMaterialId: number, rawMaterialInfo: any) {
    console.log('[UPDATE] Mode: Only UPDATE MATERIAL (without new product)');
    const productId = rawMaterialInfo.productId;
    
    this.rawMaterialController.update(rawMaterialId, this.buildCleanMaterial(rawMaterialInfo)).pipe(
      switchMap((response: any) => {
        console.log('[MATERIAL UPDATED]', response);
        if (response && productId && productId !== 0) {
          return this.linkProductToMaterial(productId, response.id, rawMaterialInfo.productQuantity);
        }
        return of(response);
      }),
      catchError((error: HttpErrorResponse) => {
        this.logger.handleError(error);
        this.notificationService.showError('Error updating raw material');
        return of(null);
      })
    ).subscribe({
      next: (response: any) => {
        if (response) {
          console.log('[UPDATE SUCCESS]', response);
          this.getAll(1, 100);
        }
      },
      error: (error: any) => {
        console.error('Error updating raw material:', error);
      }
    });
  }

  private buildProductFromInfo(materialInfo: any): ProductModel {
    return {
      id: 0,
      code: materialInfo.newProductCode,
      name: materialInfo.newProductName,
      value: materialInfo.newProductValue || 0
    };
  }

  private buildCleanMaterial(materialInfo: any): any {
    return {
      code: materialInfo.code,
      name: materialInfo.name,
      quantity: materialInfo.quantity
    };
  }

  private linkProductToMaterial(productId: number, materialId: number, quantity?: number): Observable<any> {
    const materialQuantity = quantity || 1;
    return this.productMaterialService.post(productId, materialId, materialQuantity).pipe(
      tap(() => console.log('Relation created successfully - Product:', productId, 'Material:', materialId))
    );
  }

  getAll(page: number, limit: number) {
    this.rawMaterialController.getAll(page, limit)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.logger.handleError(error);
          this.notificationService.showError('Error fetching raw materials');
          return of(null);
        })
      )
      .subscribe({
        next: (rawMaterial: RawMaterialModel[] | null) => {
          if (rawMaterial !== null) {
            this.rawMaterialSubject.next(rawMaterial);
          }
        },
        error: (error: any) => {
          console.error('Error fetching raw materials:', error);
        }
      });
  }

  getById(id: number): Observable<RawMaterialModel | null> {
    return this.rawMaterialController.getById(id)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.logger.handleError(error);
          console.error('Error fetching raw material by ID:', error);
          return of(null);
        })
      );
  }

  search(query: string | number, page: number, limit: number) {
    this.rawMaterialController.search(query, page, limit)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.logger.handleError(error);
          this.notificationService.showError('Error searching raw materials');
          return of(null);
        })
      )
      .subscribe({
        next: (rawMaterial: RawMaterialModel[] | null) => {
          if (rawMaterial !== null) {
            this.rawMaterialSubject.next(rawMaterial);
          }
        },
        error: (error: any) => {
          console.error('Error searching raw materials:', error);
        }
      });
  }

  delete(id: number): Observable<any> {
    return this.rawMaterialController.delete(id)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.notificationService.showError('Error deleting material');
          return throwError(() => error);
        })
      );
  }
}
