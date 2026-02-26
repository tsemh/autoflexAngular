import { Injectable, TemplateRef } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  public productModal?: BsModalRef;
  public addressModal?: BsModalRef;
  public loginModal?: BsModalRef;

  constructor(private modalService: BsModalService) {  }

  openProductModal(template: TemplateRef<any>) {
    this.productModal = this.modalService.show(template);
  }
  openAddressModal(template: TemplateRef<any>) {
    this.addressModal = this.modalService.show(template);
  }
  openLoginModal(template: TemplateRef<any>) {
    this.loginModal = this.modalService.show(template);
  }
  closeProductModal() {
    this.productModal?.hide();
  }
  closeAddressModal() {
    this.addressModal?.hide();
  }
  closeLoginModal() {
    this.loginModal?.hide();
  }
}
