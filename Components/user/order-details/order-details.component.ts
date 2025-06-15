import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from '../../../Core/services/customer.service';
import { UserAuthService } from '../../../Core/services/user-auth.service';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode';
import { Subscription } from 'rxjs';
import { OrderDetail } from '../../../Core/interfaces/customer-interfaces';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.css',
})
export class OrderDetailsComponent implements OnInit, OnDestroy {
  errorMessage = signal<string>('');
  loading = signal<boolean>(true);
  customerId: string = '';
  customerPersonName: string = '';
  decodedToken: any;
  private loginSubscription: Subscription | null = null;
  orderDetail = signal<OrderDetail | null>(null);
  orderId: number;

  constructor(
    private route: ActivatedRoute,
    private customerService: CustomerService,
    private userAuthService: UserAuthService,
    public router: Router
  ) {
    this.orderId = +this.route.snapshot.paramMap.get('orderId')!;
  }

  ngOnInit(): void {
    if (!this.userAuthService.isUserLogin.value) {
      Swal.fire({
        icon: 'info',
        title: 'Not Logged In',
        text: 'You need to log in to view order details. Would you like to log in now?',
        confirmButtonText: 'Log In',
        showCancelButton: true,
        cancelButtonText: 'Go to Home',
      }).then((result) => {
        if (result.isConfirmed) {
          const currentUrl = this.router.url;
          localStorage.setItem('returnUrl', currentUrl);
          this.router.navigate(['/login']);
        } else {
          this.router.navigate(['/home']);
        }
      });
      this.loading.set(false);
      return;
    }
    const token = localStorage.getItem('token') || '';
    if (token) {
      this.decodedToken = jwtDecode(token);
      this.customerPersonName = this.decodedToken.Name;
      this.customerId = this.decodedToken.ID;
      this.loadOrderDetails();
    } else {
      this.customerId = '';
      this.customerPersonName = '';
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    if (this.loginSubscription) {
      this.loginSubscription.unsubscribe();
    }
  }

  private loadOrderDetails(): void {
    this.loading.set(true);
    this.customerService.getCustomerOrderDetails(this.orderId).subscribe({
      next: (detail) => {
        this.orderDetail.set(detail);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to load order details: ' + err.message);
        this.loading.set(false);
      },
    });
  }
}
