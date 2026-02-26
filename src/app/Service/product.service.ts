import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, of, switchMap, throwError, tap } from 'rxjs';
import { ProductModel } from '../Model/product.model';
import { NotificationService } from './notification.service';
import { ProductController } from '../Controller/product.controller';
import { LoggerService } from './logger.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ProductMaterialService } from './product-material.service';
import { RawMaterialController } from '../Controller/raw-material.controller';
import { RawMaterialModel } from '../Model/rawMaterial.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  
  private idSelected!: number;
  private productSubject: BehaviorSubject<ProductModel[]> = new BehaviorSubject<ProductModel[]>([]);
  public product$: Observable<ProductModel[]> = this.productSubject.asObservable();

  constructor(
    private notificationService: NotificationService,

    private productController: ProductController,
    private logger: LoggerService,
    private productMaterialService: ProductMaterialService,
    private rawMaterialController: RawMaterialController) { }

  get idSelect():number {
    return this.idSelected;
  }
  set idSelect(newId: number) {
    if (newId !== this.idSelected) {
      this.notificationService.idSelectedChanged.next(newId);
    }
    this.idSelected = newId;
  }

  post(newProduct: ProductModel) {
    const productInfo = newProduct as any;
    
    if (productInfo.createNewMaterial && productInfo.newMaterialCode && productInfo.newMaterialName) {
      this.postProductWithNewMaterial(productInfo);
    } else {
      this.postProductOnly(newProduct);
    }
  }

  private postProductWithNewMaterial(productInfo: any) {
    console.log('[POST] Mode: Create PRODUCT + MATERIAL (2 posts)');
    const newMaterial: Partial<RawMaterialModel> = {
      code: productInfo.newMaterialCode,
      name: productInfo.newMaterialName,
      quantity: productInfo.newMaterialQuantity || 0
    };
    
    this.rawMaterialController.post(newMaterial as RawMaterialModel).pipe(
      switchMap((createdMaterial: RawMaterialModel) => {
        console.log('[MATERIAL CREATED]', createdMaterial);
        this.notificationService.showSuccess('Material created successfully');
        return this.productController.post(this.buildCleanProduct(productInfo)).pipe(
          switchMap((createdProduct: any) => this.linkProductToMaterial(
            createdProduct.id,
            createdMaterial.id,
            productInfo.newMaterialQuantity
          ).pipe(
            switchMap(() => of(createdProduct))
          ))
        );
      }),
      catchError((error: HttpErrorResponse) => {
        this.logger.handleError(error);
        this.notificationService.showError('Error creating material or product');
        return of(null);
      })
    ).subscribe({
      next: (response: any) => {
        if (response) {
          console.log('[POST SUCCESS] Product and Material created:', response);
          this.notificationService.showSuccess('Product and Material created successfully');
          this.getAll(1, 100);
        }
      },
      error: (error: any) => {
        console.error('Error creating new product:', error);
      }
    });
  }

  private postProductOnly(newProduct: ProductModel) {
    console.log('[POST] Mode: Create only PRODUCT (1 post)');
    const rawMaterialId = (newProduct as any).rawMaterialId;
    
    this.productController.post(this.buildCleanProduct(newProduct)).pipe(
      switchMap((createdProduct: any) => {
        console.log('[PRODUCT CREATED]', createdProduct);
        this.notificationService.showSuccess('Product created successfully');
        
        if (rawMaterialId && rawMaterialId !== 0) {
          return this.linkProductToMaterial(createdProduct.id, rawMaterialId, (newProduct as any).materialQuantity);
        }
        return of(createdProduct);
      }),
      catchError((error: HttpErrorResponse) => {
        this.logger.handleError(error);
        this.notificationService.showError('Error creating new product');
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
        console.error('Error creating new product:', error);
      }
    });
  }

  update(productInfo: any) {
    const productId = this.idSelect;
    
    if (productInfo.createNewMaterial && productInfo.newMaterialCode && productInfo.newMaterialName) {
      this.updateProductWithNewMaterial(productId, productInfo);
    } else {
      this.updateProductOnly(productId, productInfo);
    }
  }

  private updateProductWithNewMaterial(productId: number, productInfo: any) {
    console.log('[UPDATE] Mode: Create new MATERIAL + update PRODUCT (2 posts)');
    const newMaterial: Partial<RawMaterialModel> = {
      code: productInfo.newMaterialCode,
      name: productInfo.newMaterialName,
      quantity: productInfo.newMaterialQuantity || 0
    };

    this.rawMaterialController.post(newMaterial as RawMaterialModel).pipe(
      switchMap((createdMaterial: RawMaterialModel) => {
        console.log('[MATERIAL CREATED]', createdMaterial);
        this.notificationService.showSuccess('Material created successfully');
        return this.productController.update(productId, this.buildCleanProduct(productInfo)).pipe(
          switchMap((response: any) => this.linkProductToMaterial(response.id, createdMaterial.id, productInfo.newMaterialQuantity))
        );
      }),
      catchError((error: HttpErrorResponse) => {
        this.logger.handleError(error);
        this.notificationService.showError('Error creating material or updating product');
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
        console.error('Error updating product:', error);
      }
    });
  }

  private updateProductOnly(productId: number, productInfo: any) {
    console.log('[UPDATE] Mode: Only UPDATE PRODUCT (without new material)');
    const rawMaterialId = productInfo.rawMaterialId;

    this.productController.update(productId, this.buildCleanProduct(productInfo)).pipe(
      switchMap((response: any) => {
        console.log('[PRODUCT UPDATED]', response);
        if (response && rawMaterialId && rawMaterialId !== 0) {
          return this.linkProductToMaterial(response.id, rawMaterialId, productInfo.materialQuantity);
        }
        return of(response);
      }),
      catchError((error: HttpErrorResponse) => {
        this.logger.handleError(error);
        this.notificationService.showError('Error updating product');
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
        console.error('Error updating product:', error);
      }
    });
  }

  private buildCleanProduct(productInfo: any): any {
    return {
      code: productInfo.code,
      name: productInfo.name,
      value: productInfo.value
    };
  }

  private linkProductToMaterial(productId: number, materialId: number, quantity?: number): Observable<any> {
    const materialQuantity = quantity || 1;
    return this.productMaterialService.post(productId, materialId, materialQuantity).pipe(
      tap(() => this.productMaterialService.notifyMaterialsChanged(productId))
    );
  }

  getAll(page: number, limit: number) {
    this.productController.getAll(page, limit)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.logger.handleError(error);
          this.notificationService.showError('Error fetching products');
          return of(null);
        })
      )
      .subscribe({
        next: (product: ProductModel[] | null) => {
          if (product !== null) {
            this.productSubject.next(product);
          }
        },
        error: (error: any) => {
          console.error('Error fetching products:', error);
        }
      });
  }

  getById(id: number): Observable<ProductModel | null> {
    return this.productController.getById(id)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.logger.handleError(error);
          console.error('Error fetching product by ID:', error);
          return of(null);
        })
      );
  }

  search(query: string | number, page: number, limit: number) {
    this.productController.search(query, page, limit)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.logger.handleError(error);
          this.notificationService.showError('Error searching products');
          return of(null);
        })
      )
      .subscribe({
        next: (product: ProductModel[] | null) => {
          if (product !== null) {
            this.productSubject.next(product);
          }
        },
        error: (error: any) => {
          console.error('Error searching products:', error);
        }
      });
  }

  delete(id: number): Observable<any> {
    return this.productController.delete(id)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.notificationService.showError('Error deleting product');
          return throwError(() => error);
        })
      );
  }
}
