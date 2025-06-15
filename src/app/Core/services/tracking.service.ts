import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserAuthService } from './user-auth.service';
import { TrackingEvent } from '../interfaces/tracking';

@Injectable({
  providedIn: 'root',
})
export class TrackingService {
  private apiUrl = 'https://aston.runasp.net/api/Customer/SaveCustomerLogs';

  constructor(
    private http: HttpClient,
    private userAuthService: UserAuthService
  ) {}

  trackEvent(
    userId: string,
    productId: number,
    eventType: TrackingEvent['event_type']
  ): void {
    const event: TrackingEvent = {
      user_id: userId,
      product_id: productId,
      event_type: eventType,
    };
    this.http.post(this.apiUrl, event).subscribe({
      next: (res) => {},
      error: (err) => {},
    });
  }
}
