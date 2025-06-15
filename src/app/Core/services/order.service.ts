import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Order } from '../interfaces/order';
import { jwtDecode } from './../../../../node_modules/jwt-decode/build/cjs/index';

// Interface for the API response item
interface OrderResponse {
  id: number;
  userName: string;
  address: string;
  status: number;
  customerId: string;
  phone: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private assignedOrdersUrl =
    'https://aston.runasp.net/api/DeliveryPerson/GetAssignedOrders';
  private orderDetailsUrl =
    'https://aston.runasp.net/api/DeliveryPerson/GetOrderDetails';
  private updateStatusUrl =
    'https://aston.runasp.net/api/DeliveryPerson/UpdateOrderStatus';

  constructor(private http: HttpClient) {}

  getAssignedOrders(): Observable<Order[]> {
    const token = localStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('No token found'));
    }

    let deliveryPersonId: string;
    try {
      const decodedToken: any = jwtDecode(token);
      deliveryPersonId = decodedToken.ID; // Adjust based on token structure
    } catch (error) {
      return throwError(() => new Error('Invalid token'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http
      .get<any>(
        `${this.assignedOrdersUrl}?deliveryPersonId=${deliveryPersonId}`,
        { headers }
      )
      .pipe(
        map((response) => {
          // Check if response is an object with a message (no orders)
          if (
            response &&
            typeof response === 'object' &&
            'message' in response
          ) {
            throw new Error(response.message);
          }
          // Otherwise, assume response is an array of orders
          return (response as OrderResponse[]).map((item: OrderResponse) => ({
            id: item.id.toString(),
            customerName: item.userName,
            deliveryAddress: item.address,
            status: this.mapNumericStatus(item.status),
            customerId: item.customerId,
            phone: item.phone,
            items: [], // API doesn't provide items
            orderDate: undefined,
          }));
        }),
        catchError((error) => {
          console.error('Error fetching orders:', error);
          return throwError(
            () => new Error(error.message || 'Failed to fetch orders')
          );
        })
      );
  }

  getOrderById(id: string): Observable<Order | undefined> {
    return this.getOrderDetails(id).pipe(
      map((order) => order || undefined),
      catchError((error) => {
        console.error('Error fetching order details:', error);
        return throwError(() => new Error('Failed to fetch order details'));
      })
    );
  }

  private getOrderDetails(orderId: string): Observable<Order> {
    const token = localStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('No token found'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http
      .get<any>(`${this.orderDetailsUrl}?orderId=${orderId}`, { headers })
      .pipe(
        map((item) => ({
          id: item.id.toString(),
          customerName: item.userName,
          deliveryAddress: item.address,
          status: this.mapStringStatus(item.status),
          customerId: item.customerId,
          phone: item.phone,
          totalPrice: item.totalPrice,
          items: item.productsName.map((name: string, index: number) => ({
            name,
            quantity: item.quantity[index],
            color: item.color[index],
            size: item.size[index],
            image: item.image[index],
          })),
          orderDate: undefined, // API doesn't provide orderDate
        })),
        catchError((error) => {
          console.error('Error fetching order details:', error);
          return throwError(() => new Error('Failed to fetch order details'));
        })
      );
  }

  updateOrderStatus(orderId: string, status: string): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('No token found'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    const body = {
      orderId: parseInt(orderId), // Convert to number for API
      newStatus: this.mapStatusToApi(status),
    };

    return this.http
      .put(this.updateStatusUrl, body, { headers, responseType: 'text' })
      .pipe(
        catchError((error) => {
          console.error('Error updating order status:', error);
          return throwError(() => new Error('Failed to update order status'));
        })
      );
  }

  private mapNumericStatus(status: number): string {
    switch (status) {
      case 0:
        return 'pending';
      case 1:
        return 'preparing';
      case 2:
        return 'in-progress';
      case 3:
        return 'recieved';
      default:
        return 'pending';
    }
  }

  private mapStringStatus(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'pending';
      case 'preparing':
        return 'preparing';
      case 'onway':
        return 'in-progress';
      case 'recieved':
        return 'recieved';
      default:
        return 'pending';
    }
  }

  private mapStatusToApi(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'preparing':
        return 'Preparing';
      case 'in-progress':
        return 'OnWay';
      case 'recieved':
        return 'Recieved';
      default:
        return 'Pending';
    }
  }
}
