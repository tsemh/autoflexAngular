import { ProductModel } from './../../Model/product.model';
import { Component, Input, OnInit, OnChanges, ChangeDetectorRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ModalService } from 'src/app/Service/modal.service';
import { SubmitFormUtil } from 'src/app/Util/submit-form.util';
import { ProductService } from 'src/app/Service/product.service';
import { RawMaterialService } from 'src/app/Service/raw-material.service';
import { NotificationService } from 'src/app/Service/notification.service';
import { FormService } from 'src/app/Service/form.service';
import { ProductMaterialService } from 'src/app/Service/product-material.service';
import { ProductMaterialModel } from 'src/app/Model/productMaterial.model';
import { RawMaterialModel } from 'src/app/Model/rawMaterial.model';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit, OnChanges {

  @Input() formEnabled: boolean = false;
  @Input() productForm!: FormGroup;
  @Input() updateOn: boolean = false;
  @Input() selectedProductId: number = 0;
  public inputsHaveBorder: boolean = false;
  public product?: ProductModel;
  public rawMaterials: any[] = [];
  public productMaterials: ProductMaterialModel[] = [];

  getStockQuantity(rawMaterialId: number): number | string {
    const material = this.rawMaterials.find((m: any) => m.id === rawMaterialId);
    return material ? material.quantity : 'N/A';
  }
  public showMaterialSection: boolean = false;
  public showCreateNewMaterial: boolean = false;
  public editingRelationId: number | null = null;
  public editingQuantity: number = 0;
  public materialNamesCache: Map<number, string> = new Map();
  private lastProductId: number = 0;
  private materialRefreshRequested: boolean = false;

  constructor(
    private modalService: ModalService,
    private notificationService: NotificationService,
    private formService: FormService,
    private productService: ProductService,
    private rawMaterialService: RawMaterialService,
    private productMaterialService: ProductMaterialService,
    private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.formService.validators(this.productForm);
    
    console.log('Form component initialized, loading raw materials...');
    this.rawMaterialService.getAll(1, 10000);
    this.rawMaterialService.rawMaterial$.subscribe(list => {
      console.log(`Raw materials loaded: ${list ? list.length : 0} items`);
      this.rawMaterials = list || [];
      this.ensureMaterialNames();
      this.cdr.detectChanges();
    });

    this.productMaterialService.materialsChanged$.subscribe((productId: number) => {
      const currentProductId = this.productService.idSelect || this.selectedProductId;
      console.log('Materials changed notification for product:', productId, 'Current product ID:', currentProductId);
      if (productId && productId === currentProductId && currentProductId !== 0) {
        console.log('Reloading materials for product:', productId);
        setTimeout(() => this.loadProductMaterials(), 100);
      }
    });
  }

  ngOnChanges(): void {
    console.log('ngOnChanges called. updateOn:', this.updateOn, 'selectedProductId:', this.selectedProductId, 'idSelect:', this.productService.idSelect);
    if (this.updateOn && (this.selectedProductId && this.selectedProductId !== 0 || this.productService.idSelect && this.productService.idSelect !== 0)) {
      const productId = this.productService.idSelect || this.selectedProductId;
      console.log('Loading product materials for ID:', productId, 'lastProductId:', this.lastProductId);
      if (productId !== this.lastProductId) {
        this.lastProductId = productId;
        this.resetFormState();
        this.loadProductMaterials();
        this.formEnabled = false;
      }
    }
  } 

  resetFormState(): void {
    this.productMaterials = [];
    this.editingRelationId = null;
    this.editingQuantity = 0;
    this.showMaterialSection = false;
    this.showCreateNewMaterial = false;
    this.materialRefreshRequested = false;
    
    if (this.productForm) {
      const productId = this.productService.idSelect || this.selectedProductId;
      this.productForm.patchValue({
        rawMaterialId: 0,
        materialQuantity: 0,
        createNewMaterial: false,
        newMaterialCode: '',
        newMaterialName: '',
        newMaterialQuantity: 0
      });
    }
  }

  toggleMaterialSection(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.showMaterialSection = checked;
    if (!checked) {
      this.showCreateNewMaterial = false;
      this.productForm.patchValue({
        rawMaterialId: 0,
        materialQuantity: 0,
        createNewMaterial: false,
        newMaterialCode: '',
        newMaterialName: '',
        newMaterialQuantity: 0
      });
    }
  }

  loadProductMaterials() {
    const productId = this.productService.idSelect || this.selectedProductId;
    if (productId && productId !== 0) {
      this.productMaterialService.listByProduct(productId).subscribe({
        next: (relations: any[]) => {
          console.log('Raw response from listByProduct:', relations);
          
          this.productMaterials = relations.map((r: any) => {
            console.log('Raw relation object:', r);
            console.log('Relation properties:', Object.keys(r));
            
            const materialId: number = r.rawMaterialId ?? r.materialId ?? r.rawMaterial?.id ?? 0;
            const productId: number = r.productId ?? r.product?.id ?? 0;
            
            console.log(`Mapped - Material ID: ${materialId}, Product ID: ${productId}, Quantity: ${r.quantityRequired}`);
            
            return {
              id: r.id,
              productId: productId,
              rawMaterialId: materialId,
              quantityRequired: r.quantityRequired
            } as ProductMaterialModel;
          });
          
          console.log('Product materials after mapping:', this.productMaterials);
          this.ensureMaterialNames();
          this.requestMaterialRefreshIfMissing();
        },
        error: (error: any) => {
          console.error('Error loading relations:', error);
        }
      });
    }
  }

  private ensureMaterialNames() {
    console.log(`ensureMaterialNames called. Product materials: ${this.productMaterials.length}, Raw materials: ${this.rawMaterials.length}`);
    
    if (!this.productMaterials.length) {
      console.log('No product materials to process');
      return;
    }

    let updated = false;
    this.productMaterials.forEach(relation => {
      const materialId = relation.rawMaterialId;
      console.log(`Processing relation with material ID: ${materialId}`);
      
      if (!materialId || this.materialNamesCache.has(materialId)) {
        console.log(`Skipping - already cached or no ID`);
        return;
      }

      const mat = this.rawMaterials.find(m => m.id === materialId);
      if (mat) {
        const name = `${mat.name} (${mat.code})`;
        console.log(`Found material ${materialId}: ${name}`);
        this.materialNamesCache.set(materialId, name);
        updated = true;
      } else {
        console.log(`Material ${materialId} not found in rawMaterials array`);
      }
    });

    console.log(`Cache updated: ${updated}. Cache size: ${this.materialNamesCache.size}`);
    if (updated) {
      this.cdr.detectChanges();
    }
  }

  private requestMaterialRefreshIfMissing() {
    if (!this.productMaterials.length) {
      console.log('No product materials to check for missing names');
      return;
    }

    console.log('Checking for missing materials...');
    const hasMissing = this.productMaterials.some(relation => {
      const materialId = relation.rawMaterialId;
      if (!materialId) {
        console.log('Material ID is null/0, skipping');
        return false;
      }
      if (this.materialNamesCache.has(materialId)) {
        console.log(`Material ${materialId} is cached`);
        return false;
      }
      const found = this.rawMaterials.find(m => m.id === materialId);
      if (!found) {
        console.log(`Material ${materialId} NOT FOUND in rawMaterials array`);
      }
      return !found;
    });

    if (hasMissing) {
      console.log('Missing materials detected, refreshing raw materials list...');
      this.materialRefreshRequested = true;
      this.rawMaterialService.getAll(1, 10000);
    } else {
      console.log('All materials found in cache or array');
    }
  }

  toggleCreateNewMaterial(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.showCreateNewMaterial = checked;
    this.productForm.patchValue({ createNewMaterial: checked });
    
    if (!checked) {
      this.productForm.patchValue({
        newMaterialCode: '',
        newMaterialName: '',
        newMaterialQuantity: 0
      });
    }
  }

  getMaterialName(rawMaterialId: number): string {
    console.log(`getMaterialName called with ID: ${rawMaterialId}`);
    
    if (!rawMaterialId || rawMaterialId === 0) {
      console.log('Material ID is null or 0');
      return 'Select material';
    }
    
    if (this.materialNamesCache.has(rawMaterialId)) {
      const cachedName = this.materialNamesCache.get(rawMaterialId) || 'Loading...';
      console.log(`Found in cache: ${cachedName}`);
      return cachedName;
    }
    
    console.log(`Not in cache. Searching in rawMaterials (${this.rawMaterials.length} items)`);
    const material = this.rawMaterials.find(m => m.id === rawMaterialId);
    if (material) {
      const name = `${material.name} (${material.code})`;
      console.log(`Found material: ${name}`);
      this.materialNamesCache.set(rawMaterialId, name);
      this.cdr.detectChanges();
      return name;
    }
    
    console.log(`Material not found in array. Attempting to load it...`);
    this.loadMaterialById(rawMaterialId);
    return 'Loading...';
  }

  private loadMaterialById(materialId: number) {
    this.rawMaterialService.getById(materialId).subscribe({
      next: (material: any) => {
        if (material) {
          console.log(`Material ${materialId} loaded:`, material);
          const name = `${material.name} (${material.code})`;
          this.materialNamesCache.set(materialId, name);
          this.cdr.detectChanges();
        }
      },
      error: (error: any) => {
        console.error(`Error loading material ${materialId}:`, error);
      }
    });
  }

  startEditRelation(relation: ProductMaterialModel) {
    this.editingRelationId = relation.id;
    this.editingQuantity = relation.quantityRequired;
  }

  saveRelation(relationId: number) {
    if (this.editingQuantity > 0) {
      this.productMaterialService.update(relationId, this.editingQuantity).subscribe({
        next: (result) => {
          if (result) {
            this.notificationService.showSuccess('Relation updated successfully');
            this.editingRelationId = null;
            setTimeout(() => this.loadProductMaterials(), 300);
          }
        },
        error: (error) => {
          console.error('Error saving relation:', error);
        }
      });
    }
  }

  cancelEditRelation() {
    this.editingRelationId = null;
  }

  deleteRelation(relationId: number) {
    if (confirm('Are you sure you want to delete this relation?')) {
      this.productMaterialService.delete(relationId).subscribe({
        next: () => {
          this.notificationService.showSuccess('Relation deleted successfully');
          setTimeout(() => this.loadProductMaterials(), 300);
        },
        error: (error) => {
          console.error('Error deleting relation:', error);
        }
      });
    }
  }

  enableForm() {
    this.enableInputBorder();
    this.enableInput();
    const productId = this.productService.idSelect || this.selectedProductId;
    if (productId && productId !== 0) {
      this.loadProductMaterials();
    }
  }

  disableForm() {
    this.modalService.closeProductModal();
    this.DisableInputBorder();
    this.disableInput();
  }

  submitForm(event: Event) {
    SubmitFormUtil.handleSubmit(event);
  }

  submitProductForm() {
    const productInfo = this.formService.grabInformationProductForm(this.productForm);
    
    if (!this.isProductInfoValid(productInfo)) {
      alert("Product information was not filled in correctly");
      return;
    }

    if (!productInfo.createNewMaterial) {
      productInfo.newMaterialCode = '';
      productInfo.newMaterialName = '';
      productInfo.newMaterialQuantity = 0;
    }

    if (this.productService.idSelect && this.productService.idSelect !== 0) {
      this.productService.update(productInfo);
    } else {
      this.productService.post(productInfo);
    }
  
    this.clearMaterialSection();
    this.modalService.closeProductModal();
    setTimeout(() => {
      this.productService.getAll(1, 10000);
      this.rawMaterialService.getAll(1, 10000);
      const productId = this.productService.idSelect || this.selectedProductId;
      if (productId && productId !== 0) {
        this.loadProductMaterials();
      }
    }, 300);
  }

  clearMaterialSection(): void {
    this.showCreateNewMaterial = false;
    this.productForm.patchValue({
      rawMaterialId: 0,
      materialQuantity: 0,
      createNewMaterial: false,
      newMaterialCode: '',
      newMaterialName: '',
      newMaterialQuantity: 0
    });
  }

  isProductInfoValid(productInfo: any): boolean {
    return productInfo.code && productInfo.name && productInfo.value;
  }

  disableInput() {
    this.formEnabled = false;
  }

  enableInput() {
    this.formEnabled = true;
  }

  DisableInputBorder() {
    this.inputsHaveBorder = false;
  }

  enableInputBorder() {
    this.inputsHaveBorder = true;
  }

  disablePressNumber(event: any, fieldName: string) {
    this.formService.disablePressNumber(event, fieldName)
  }

  disablePressText(event: any, fieldName: string) {
    this.formService.disablePressText(event, fieldName)
  }
}
