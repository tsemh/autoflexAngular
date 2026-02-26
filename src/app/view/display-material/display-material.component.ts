import { RawMaterialModel } from 'src/app/Model/rawMaterial.model';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { ModalService } from 'src/app/Service/modal.service';
import { RawMaterialService } from 'src/app/Service/raw-material.service';
import { NotificationService } from 'src/app/Service/notification.service';
import { FormGroup } from '@angular/forms';
import { FormService } from 'src/app/Service/form.service';

@Component({
  selector: 'app-display-material',
  templateUrl: './display-material.component.html',
  styleUrls: ['./display-material.component.css']
})
export class DisplayMaterialComponent implements OnInit {
  public materialEnabled: boolean = false;
  public formEnabled: boolean = false;
  public inputsHaveBorder!: boolean;
  public rawMaterials: RawMaterialModel[] = [];
  public rawMaterialSelected: RawMaterialModel | null = null;
  public selectedMaterialId: number = 0;
  public materialForm: FormGroup = this.formService.createMaterialForm();
  public page: number = 1;
  public limit: number = 5;
  public updateOn = false;

  constructor(
    private modalService: ModalService,
    private rawMaterialService: RawMaterialService,
    private formService: FormService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.getAllRawMaterials();
    this.subscribeToRawMaterials();
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
    this.getAllRawMaterials();
  }

  newRawMaterial(template: TemplateRef<any>) {
    this.rawMaterialSelected = null;
    this.selectedMaterialId = 0;
    this.rawMaterialService.idSelect = 0;
    this.materialForm.reset();
    this.disableMaterial();
    this.enableInput();
    this.updateOff();
    this.modalService.openProductModal(template);
  }

  enableForm() {
    this.enableInput();
    this.enableInputBorder();
  }

  btnDelete(id: number) {
    if (confirm('Are you sure you want to delete this material?')) {
      this.rawMaterialService.delete(id).subscribe({
        next: () => {
          this.notificationService.showSuccess('Material deleted successfully');
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

  enableMaterialInfo(rawMaterial: RawMaterialModel) {
    this.enableMaterial();
    this.updateOn = true;
    this.rawMaterialSelect(rawMaterial);
  }

  enableMaterial() {
    this.materialEnabled = true;
  }

  disableMaterial() {
    this.materialEnabled = false;
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

  rawMaterialSelect(rawMaterial: RawMaterialModel) {
    this.disableForm();
    this.rawMaterialSelected = rawMaterial;
    this.selectedMaterialId = rawMaterial.id;
    this.rawMaterialService.idSelect = rawMaterial.id;
    if (this.materialForm) {
      this.materialForm.reset();
      this.materialForm.patchValue(rawMaterial);
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

  searchRawMaterials(query: string | number) {
    this.disableMaterial();
    this.rawMaterialService.search(query, this.page, this.limit);
  }

  getAllRawMaterials() {
    this.disableMaterial();
    this.rawMaterialService.getAll(this.page, this.limit);
  }

  subscribeToRawMaterials() {
    this.rawMaterialService.rawMaterial$.subscribe(rawMaterials => {
      this.rawMaterials = rawMaterials;
    });
  }

  updateOff() {
    this.updateOn = false;
  }
}
