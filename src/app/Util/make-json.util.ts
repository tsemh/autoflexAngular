import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MakeJsonUtil {

  makeJson(productInfo: any) {
    return {
      id: 0,
      code: productInfo.code,
      name: productInfo.name,
      value: Number(productInfo.value)
    };
  }
}
