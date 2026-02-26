import { FormService } from 'src/app/Service/form.service';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { ProductModel } from 'src/app/Model/product.model';
import { ModalService } from 'src/app/Service/modal.service';
import { ProductService } from 'src/app/Service/product.service';
import { NotificationService } from 'src/app/Service/notification.service';
import { FormGroup } from '@angular/forms';


@Component({
  selector: 'app-display',
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.css']
})
export class DisplayComponent implements OnInit {
  public productEnabled: boolean = false;
  public formEnabled: boolean = false
  public inputsHaveBorder!: boolean;
  public products: ProductModel[] = [];
  public productSelected: ProductModel | null = null;
  public selectedProductId: number = 0;
  public productForm: FormGroup = this.formService.createForm();
  public page: number = 1;
  public limit: number = 5;
  public updateOn = false;

  constructor(
    private modalService: ModalService,
    private productService: ProductService,
    private formService: FormService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.getAllProducts();
    this.subscribeToProducts();
  }
  onPageChange(pageNumber: number) {
    this.page = pageNumber;
  }
  updateLimit(event: any) {
    const newLimit = parseInt(event?.target?.value);
    if (!isNaN(newLimit)) {
      this.limit = newLimit;
    } else {
      this.limit = 10;
    }
    this.getAllProducts();
  }

  newProduct(template: TemplateRef<any>) {
    this.productSelected = null;
    this.selectedProductId = 0;
    this.productService.idSelect = 0;
    this.productForm.reset();
    this.disableProduct();
    this.enableInput();
    this.updateOff();
    this.modalService.openProductModal(template);
  }

  enableForm() {
    this.enableInput();
    this.enableInputBorder();
  }
  btnDelete(id: number) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.delete(id).subscribe({
        next: () => {
          this.notificationService.showSuccess('Product deleted successfully');
          this.reloadPage();
        },
        error: () => {
          this.reloadPage();
        }
      });
    }
  }

  closeModal() {
    this.modalService.productModal?.hide();
  }

  enableProductInfo(product: ProductModel) {
    this.enableProduct();
    this.updateOn = true;
    this.productSelect(product);
  }
  enableProduct() {
    this.productEnabled = true;
  }
  disableProduct() {
    this.productEnabled = false
  }

  enableInputBorder() {
    this.inputsHaveBorder = true;
  }

  enableInput() {
    this.formEnabled = true;
  }
  disableForm() {
    this.formEnabled = false;
  }
  reloadPage() {
    window.location.reload();
  }
  productSelect(product: ProductModel) {
    this.disableForm();
    this.productSelected = product;
    this.selectedProductId = product.id;
    this.productService.idSelect = product.id;
    if (this.productForm) {
      this.productForm.reset();
      this.productForm.patchValue(product);
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

  searchProducts(query: string | number) {
    this.disableProduct();
    this.productService.search(query, this.page, this.limit);
  }
  getAllProducts() {
    this.disableProduct();
    this.productService.getAll(this.page, this.limit);
  }
  subscribeToProducts() {
    this.productService.product$.subscribe(products => {
      this.products = products;
    });
  }
  updateOff() {
    this.updateOn = false;
  }
}
