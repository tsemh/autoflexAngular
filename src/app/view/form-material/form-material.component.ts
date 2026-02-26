import { RawMaterialModel } from './../../Model/rawMaterial.model';
import { Component, Input, OnInit, OnChanges, ChangeDetectorRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ModalService } from 'src/app/Service/modal.service';
import { SubmitFormUtil } from 'src/app/Util/submit-form.util';
import { RawMaterialService } from 'src/app/Service/raw-material.service';
import { ProductService } from 'src/app/Service/product.service';
import { NotificationService } from 'src/app/Service/notification.service';
import { FormService } from 'src/app/Service/form.service';
import { ProductMaterialService } from 'src/app/Service/product-material.service';
import { ProductMaterialModel } from 'src/app/Model/productMaterial.model';
import { ProductModel } from 'src/app/Model/product.model';

@Component({
  selector: 'app-form-material',
  templateUrl: './form-material.component.html',
  styleUrls: ['./form-material.component.css']
})
export class FormMaterialComponent implements OnInit, OnChanges {

  @Input() formEnabled: boolean = false;
  @Input() materialForm!: FormGroup;
  @Input() updateOn: boolean = false;
  @Input() selectedMaterialId: number = 0;
  public inputsHaveBorder: boolean = false;
  public material?: RawMaterialModel;
  public products: any[] = [];
  public productMaterials: ProductMaterialModel[] = [];

  getProductValue(productId: number): number | string {
    const product = this.products.find((p: any) => p.id === productId);
    return product ? product.value : 'N/A';
  }
  public showCreateNewProduct: boolean = false;
  public editingRelationId: number | null = null;
  public editingQuantity: number = 0;
  public productNamesCache: Map<number, string> = new Map();
  private lastMaterialId: number = 0;
  private productRefreshRequested: boolean = false;

  constructor(
    private modalService: ModalService,
    public notificationService: NotificationService,
    private formService: FormService,
    private rawMaterialService: RawMaterialService,
    private productService: ProductService,
    private productMaterialService: ProductMaterialService,
    private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.formService.validators(this.materialForm);
    
    this.productService.getAll(1, 10000);
    this.productService.product$.subscribe(list => {
      this.products = list || [];
      this.ensureProductNames();
    });
  }

  ngOnChanges(): void {
    if (this.updateOn && this.selectedMaterialId && this.selectedMaterialId !== 0) {
      if (this.selectedMaterialId !== this.lastMaterialId) {
        this.lastMaterialId = this.selectedMaterialId;
        this.resetFormState();
        this.loadMaterialProducts();
      }
    }
  }

  resetFormState(): void {
    this.productNamesCache.clear();
    this.productMaterials = [];
    this.editingRelationId = null;
    this.editingQuantity = 0;
    this.showCreateNewProduct = false;
    this.productRefreshRequested = false;
    this.formEnabled = false; 
    if (this.materialForm) {
      this.materialForm.patchValue({
        productId: 0,
        productQuantity: 0,
        createNewProduct: false,
        newProductCode: '',
        newProductName: '',
        newProductValue: 0
      });
    }
  }

  loadMaterialProducts() {
    const materialId = this.selectedMaterialId;
    if (materialId && materialId !== 0) {
      this.productMaterialService.listByRawMaterial(materialId).subscribe({
        next: (relations: any[]) => {
          this.productMaterials = relations.map((r: any) => {
            const materialId: number = r.rawMaterialId ?? 0;
            const productId: number = r.productId ?? 0;
            
            return {
              id: r.id,
              productId: productId,
              rawMaterialId: materialId,
              quantityRequired: r.quantityRequired
            } as ProductMaterialModel;
          });
          
          this.ensureProductNames();
          this.requestProductRefreshIfMissing();
        },
        error: (error: any) => {
          console.error('Error loading relations:', error);
        }
      });
      this.notificationService.showSuccess('Material carregado com sucesso!');
    }
  }

  private ensureProductNames() {
    if (!this.productMaterials.length || !this.products.length) {
      return;
    }

    let updated = false;
    this.productMaterials.forEach(relation => {
      const productId = relation.productId;
      if (!productId || this.productNamesCache.has(productId)) {
        return;
      }

      const prod = this.products.find(p => p.id === productId);
      if (prod) {
        this.productNamesCache.set(productId, `${prod.name} (${prod.code})`);
        updated = true;
      }
    });

    if (updated) {
      this.cdr.detectChanges();
    }
  }

  private requestProductRefreshIfMissing() {
    if (this.productRefreshRequested || !this.productMaterials.length) {
      return;
    }

    const hasMissing = this.productMaterials.some(relation => {
      const productId = relation.productId;
      if (!productId) {
        return false;
      }
      if (this.productNamesCache.has(productId)) {
        return false;
      }
      return !this.products.find(p => p.id === productId);
    });

    if (hasMissing) {
      this.productRefreshRequested = true;
      this.productService.getAll(1, 10000);
    }
  }

  toggleCreateNewProduct(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.showCreateNewProduct = checked;
    this.materialForm.patchValue({ createNewProduct: checked });
    
    if (!checked) {
      this.materialForm.patchValue({
        newProductCode: '',
        newProductName: '',
        newProductValue: 0
      });
    }
  }

  getProductName(productId: number): string {
    if (!productId || productId === 0) {
      return 'Selecione o produto';
    }
    
    if (this.productNamesCache.has(productId)) {
      return this.productNamesCache.get(productId) || 'Carregando...';
    }
    
    const product = this.products.find(p => p.id === productId);
    if (product) {
      const name = `${product.name} (${product.code})`;
      this.productNamesCache.set(productId, name);
      return name;
    }
    
    return 'Carregando...';
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
            this.editingRelationId = null;
            setTimeout(() => this.loadMaterialProducts(), 300);
          }
        },
        error: (error) => {
          console.error('Erro ao salvar relação:', error);
        }
      });
    }
  }

  cancelEditRelation() {
    this.editingRelationId = null;
  }

  deleteRelation(relationId: number) {
    if (confirm('Tem certeza que deseja excluir esta relação?')) {
      this.productMaterialService.delete(relationId).subscribe({
        next: () => {
          setTimeout(() => this.loadMaterialProducts(), 300);
        },
        error: (error) => {
          console.error('Erro ao excluir relação:', error);
        }
      });
    }
  }

  enableForm() {
    this.enableInputBorder();
    this.enableInput();
    if (this.selectedMaterialId && this.selectedMaterialId !== 0) {
      this.loadMaterialProducts();
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

  submitMaterialForm() {
    const materialInfo = this.formService.grabInformationMaterialForm(this.materialForm);
    
    if (!this.isMaterialInfoValid(materialInfo)) {
      alert("As informações do material não foram preenchidas corretamente");
      return;
    }

    if (!materialInfo.createNewProduct) {
      materialInfo.newProductCode = '';
      materialInfo.newProductName = '';
      materialInfo.newProductValue = 0;
    }

    if (this.rawMaterialService.idSelect && this.rawMaterialService.idSelect !== 0) {
      this.rawMaterialService.update(materialInfo);
    } else {
      this.rawMaterialService.post(materialInfo);
    }
  
    this.modalService.closeProductModal();
    setTimeout(() => {
      this.rawMaterialService.getAll(1, 10000);
      this.productService.getAll(1, 10000);
      if (this.selectedMaterialId && this.selectedMaterialId !== 0) {
        this.loadMaterialProducts();
      }
    }, 300);
  }

  isMaterialInfoValid(materialInfo: any): boolean {
    return materialInfo.code && materialInfo.name && materialInfo.quantity;
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
