import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class FormService {

  public restrictedNumbers: string[] = ['name'];
  public restrictedText: string[] = ['value'];

  constructor(private fb: FormBuilder) { }

  createForm(): FormGroup {
    return this.fb.group({
      id: [0],
      code: ['',[Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      name: ['',[Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      value: [0,[Validators.required, Validators.min(0)]],
      rawMaterialId: [0],
      materialQuantity: [0],
      createNewMaterial: [false],
      newMaterialCode: [''],
      newMaterialName: [''],
      newMaterialQuantity: [0]
    });
  }

  createMaterialForm(): FormGroup {
    return this.fb.group({
      id: [0],
      code: ['',[Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      name: ['',[Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      quantity: [0,[Validators.required, Validators.min(0)]],
      productId: [0],
      productQuantity: [0],
      createNewProduct: [false],
      newProductCode: [''],
      newProductName: [''],
      newProductValue: [0]
    });
  }

  grabInformationProductForm(productForm: FormGroup) {
    return {
      id: productForm.get('id')?.value,
      code: productForm.get('code')?.value,
      name: productForm.get('name')?.value,
      value: productForm.get('value')?.value,
      rawMaterialId: productForm.get('rawMaterialId')?.value,
      materialQuantity: productForm.get('materialQuantity')?.value,
      createNewMaterial: productForm.get('createNewMaterial')?.value,
      newMaterialCode: productForm.get('newMaterialCode')?.value,
      newMaterialName: productForm.get('newMaterialName')?.value,
      newMaterialQuantity: productForm.get('newMaterialQuantity')?.value
    };
  }

  grabInformationMaterialForm(materialForm: FormGroup) {
    return {
      id: materialForm.get('id')?.value,
      code: materialForm.get('code')?.value,
      name: materialForm.get('name')?.value,
      quantity: materialForm.get('quantity')?.value,
      productId: materialForm.get('productId')?.value,
      productQuantity: materialForm.get('productQuantity')?.value,
      createNewProduct: materialForm.get('createNewProduct')?.value,
      newProductCode: materialForm.get('newProductCode')?.value,
      newProductName: materialForm.get('newProductName')?.value,
      newProductValue: materialForm.get('newProductValue')?.value
    };
  }

  validators(form: FormGroup) {
    const controls = ['name', 'code', 'value'];
    controls.forEach(controlName => {
      const control = form.get(controlName);
      if (control) {
        const errors = control.errors;
        if (errors) {
        }
      }
    });
  }

  disablePressNumber(event: any, fieldName: string) {
    if (this.restrictedNumbers.includes(fieldName)) {
      const inputValue = event.key;
      if (!/^[a-zA-Z\s]*$/.test(inputValue)) {
        event.preventDefault();
      }
    }
  }

  disablePressText(event: any, fieldName: string) {
    if (this.restrictedText.includes(fieldName)) {
      const inputValue = event.key;
      if (!/^\d*$/.test(inputValue)) {
        event.preventDefault();
      }
    }
  }
}
