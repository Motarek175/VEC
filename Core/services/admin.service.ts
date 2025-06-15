import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Customer,
  DeliveryRep,
  Merchant,
  Order,
  OrderDetails,
  Product,
} from '../interfaces/admin-intefaces';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiUrl = 'https://aston.runasp.net/api/Admin/';
  private apiCustomer = 'https://aston.runasp.net/api/Customer/';
  private apiMerchant = 'https://aston.runasp.net/api/Merchant/';
  constructor(private _HttpClient: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  // ---------------------*------------------------
  // Orders (Done)
  // ---------------------*------------------------
  getAllOrders(): Observable<Order[]> {
    return this._HttpClient.get<Order[]>(`${this.apiUrl}ShowAllOrders`, {
      headers: this.getHeaders(),
    });
  }
  getSpecificOrder(orderId: number): Observable<Order[]> {
    return this._HttpClient.get<Order[]>(
      `${this.apiUrl}ShowSpecificOrders?orderId=${orderId}`,
      {
        headers: this.getHeaders(),
      }
    );
  }
  getOrderDetails(orderId: number): Observable<OrderDetails> {
    return this._HttpClient.get<OrderDetails>(
      `${this.apiUrl}GetOrderDetails?orderId=${orderId}`,
      {
        headers: this.getHeaders(),
      }
    );
  }
  updateOrderStatus(
    orderId: number,
    status: string
  ): Observable<{ message: string }> {
    return this._HttpClient.put<{ message: string }>(
      `${
        this.apiUrl
      }UpdateStatusOrder?orderId=${orderId}&Status=${encodeURIComponent(
        status
      )}`,
      {},
      { headers: this.getHeaders() }
    );
  }
  updateOrderPhone(
    orderId: number,
    newPhone: string
  ): Observable<{ message: string }> {
    return this._HttpClient.put<{ message: string }>(
      `${
        this.apiUrl
      }UpdatePhone?orderId=${orderId}&newPhone=${encodeURIComponent(newPhone)}`,
      {},
      { headers: this.getHeaders() }
    );
  }
  updateOrderAddress(
    orderId: number,
    newAddress: string
  ): Observable<{ message: string }> {
    return this._HttpClient.put<{ message: string }>(
      `${
        this.apiUrl
      }UpdateAdress?orderId=${orderId}&newaddress=${encodeURIComponent(
        newAddress
      )}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // ---------------------*------------------------
  // Delivery (Done)
  // ---------------------*------------------------
  getDeliveryReps(): Observable<DeliveryRep[]> {
    return this._HttpClient.get<DeliveryRep[]>(
      `${this.apiUrl}GetAllDeliveryReps`,
      {
        headers: this.getHeaders(),
      }
    );
  }
  getDeliveryRepById(id: string): Observable<DeliveryRep[]> {
    return this._HttpClient.get<DeliveryRep[]>(
      `${this.apiUrl}GetDeliveryRepwithID?Id=${id}`,
      {
        headers: this.getHeaders(),
      }
    );
  }
  addDeliveryRep(newRep: any): Observable<any> {
    return this._HttpClient.post<any>(
      `${this.apiUrl}create-delivery-rep`,
      newRep,
      { headers: this.getHeaders() }
    );
  }
  updateDeliveryRepStatus(
    deliveryRepId: string,
    newStatus: string
  ): Observable<any> {
    return this._HttpClient.put<any>(
      `${this.apiUrl}UpdateDeliveryRepStatus`,
      { deliveryRepId, newStatus },
      { headers: this.getHeaders() }
    );
  }

  // ---------------------*------------------------
  // Customer (Done)
  // ---------------------*------------------------
  getAllCustomers(): Observable<Customer[]> {
    return this._HttpClient.get<Customer[]>(
      `${this.apiCustomer}ShowAllCustomers`,
      {
        headers: this.getHeaders(),
      }
    );
  }
  getCustomerById(customerId: string): Observable<Customer[]> {
    return this._HttpClient.get<Customer[]>(
      `${this.apiCustomer}ShowCustomerwithId?Id=${customerId}`,
      { headers: this.getHeaders() }
    );
  }
  updateCustomerStatus(
    customerId: string,
    newStatus: Customer['status']
  ): Observable<{ message: string }> {
    return this._HttpClient.put<{ message: string }>(
      `${
        this.apiCustomer
      }UpdateCustomerStatus?customerId=${customerId}&status=${encodeURIComponent(
        newStatus
      )}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // ---------------------*------------------------
  // Product (Done)
  // ---------------------*------------------------
  getProducts(): Observable<Product[]> {
    return this._HttpClient.get<Product[]>(`${this.apiUrl}ShowAllProducts`, {
      headers: this.getHeaders(),
    });
  }

  getProductById(id: number): Observable<Product[]> {
    return this._HttpClient.get<Product[]>(
      `${this.apiUrl}ShowProductWithId?id=${id}`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  updateProductStatus(
    productId: number,
    newStatus: string
  ): Observable<{ message: string }> {
    return this._HttpClient.put<{ message: string }>(
      `${
        this.apiUrl
      }update-product-status?productId=${productId}&NewStatus=${encodeURIComponent(
        newStatus
      )}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // ---------------------*------------------------
  // Merchant (Done)
  // ---------------------*------------------------
  getAllMerchants(): Observable<Merchant[]> {
    return this._HttpClient.get<Merchant[]>(
      `${this.apiMerchant}ShowAllMerchants`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  getMerchantById(merchantId: string): Observable<Merchant[]> {
    return this._HttpClient.get<Merchant[]>(
      `${this.apiMerchant}ShowMerchantwithId?Id=${merchantId}`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  updateMerchantStatus(
    merchantId: string,
    status: string
  ): Observable<{ message: string }> {
    return this._HttpClient.put<{ message: string }>(
      `${this.apiMerchant}UpdateMerchantStatus?merchantId=${encodeURIComponent(
        merchantId
      )}&status=${encodeURIComponent(status)}`,
      {},
      { headers: this.getHeaders() }
    );
  }
}
