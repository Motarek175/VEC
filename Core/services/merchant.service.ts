import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import {
  addColorSizeImage,
  addProduct,
  MerchantProduct,
  OrderItem,
  ProductDetail,
  updateOrderStatus,
  updateProduct,
} from '../interfaces/merchant-interfaces';

@Injectable({
  providedIn: 'root',
})
export class MerchantService {
  private apiUrl = 'https://aston.runasp.net/api/Merchant/';
  constructor(private _HttpClient: HttpClient) {}
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  getOrderItems(merchantId: string): Observable<OrderItem[]> {
    return this._HttpClient.get<OrderItem[]>(
      `${this.apiUrl}GetOrderItems?MerchantId=${merchantId}`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  getProducts(merchantId: string): Observable<MerchantProduct[]> {
    return this._HttpClient.get<MerchantProduct[]>(
      `${this.apiUrl}GetProduct?MerchantId=${merchantId}`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  getProductDetails(productId: number): Observable<ProductDetail[]> {
    return this._HttpClient.get<ProductDetail[]>(
      `${this.apiUrl}GetProductDetails?ProductId=${productId}`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  updateProduct(data: updateProduct): Observable<any> {
    return this._HttpClient.put(`${this.apiUrl}UpdateProduct`, data, {
      headers: this.getHeaders(),
    });
  }

  updateProductQuantity(quntity: number, prodId: number): Observable<any> {
    return this._HttpClient.put(
      `${this.apiUrl}UpdateProductQuantity?ProductDetailId=${prodId}&newQuantity=${quntity}`,
      null,
      {
        headers: this.getHeaders(),
      }
    );
  }

  UpdateOrderItemStatus(data: updateOrderStatus): Observable<any> {
    return this._HttpClient.put(`${this.apiUrl}UpdateOrderItemStatus`, data, {
      headers: this.getHeaders(),
    });
  }

  addProduct(data: addProduct): Observable<any> {
    return this._HttpClient.post(`${this.apiUrl}AddProduct`, data, {
      headers: this.getHeaders(),
    });
  }

  addColorSizeImage(data: addColorSizeImage): Observable<any> {
    const formData = new FormData();
    formData.append('ProductId', data.ProductId.toString());
    formData.append('Color', data.Color || '');
    formData.append('Size', data.Size || ''); // Single Size string
    formData.append('Quantity', data.Quantities[0].toString()); // Single quantity
    data.Images.forEach((image, index) => {
      formData.append(`image${index + 1}`, image);
    });
    return this._HttpClient.post(`${this.apiUrl}AddColorsizeimage`, formData, {
      headers: this.getHeaders(),
    });
  }
}
