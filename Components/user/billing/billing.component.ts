import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, catchError, of, Subscription } from 'rxjs';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { CustomerService } from '../../../Core/services/customer.service';
import { addOrder } from '../../../Core/interfaces/customer-interfaces';
import { Observable, forkJoin } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { UserAuthService } from '../../../Core/services/user-auth.service';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.css',
})
export class BillingComponent implements OnInit {
  cash: BehaviorSubject<boolean> = new BehaviorSubject(true);
  bank: BehaviorSubject<boolean> = new BehaviorSubject(false);
  showBankTooltip: boolean = false;
  checkoutData: any = {};
  billingForm!: FormGroup;
  customerId: string = '';
  cartIds: number[] = [];
  private loginSubscription: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private customerService: CustomerService,
    private userAuthService: UserAuthService
  ) {}

  ngOnInit(): void {
    const storedData = localStorage.getItem('checkoutData');
    if (storedData) {
      this.checkoutData = JSON.parse(storedData);
      if (this.checkoutData.items) {
        this.cartIds = this.checkoutData.items.map((item: any) => item.id);
        this.checkoutData.items.forEach((item: any) => {
          if (item.image && !item.image.startsWith('https:')) {
            item.image = 'https:' + item.image;
          }
        });
      }
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Empty Cart',
        text: 'You need to add products to your cart first!',
        confirmButtonText: 'Go to Shop',
        showCancelButton: true,
        cancelButtonText: 'Go to Home',
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/shop']);
        } else {
          this.router.navigate(['/home']);
        }
      });
    }

    this.billingForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{11}$')]],
      address1: ['', Validators.required],
      address2: [''],
    });

    // Get customerId from token
    const token = localStorage.getItem('token') || '';
    if (token) {
      const decodedToken: any = jwtDecode(token);
      this.customerId = decodedToken.ID;
    }
  }

  selectPayment(method: string) {
    if (method === 'cash') {
      this.cash.next(true);
      this.bank.next(false);
    } else {
      this.cash.next(true);
      this.bank.next(false);
    }
  }

  onSubmit() {
    if (this.billingForm.valid) {
      Swal.fire({
        icon: 'question',
        title: 'Confirm Purchase',
        text: 'Are you sure you want to place this order?',
        confirmButtonText: 'Yes, Place Order',
        showCancelButton: true,
        cancelButtonText: 'Cancel',
      }).then((result) => {
        if (result.isConfirmed) {
          const orderData: addOrder = {
            customerId: this.customerId,
            address: this.billingForm.value.address1,
            phone: this.billingForm.value.phone,
          };

          this.customerService.addOrder(orderData).subscribe({
            next: (response) => {
              console.log('Add Order Response:', response);
              localStorage.removeItem('checkoutData');
              this.checkoutData = {};
              Swal.fire({
                icon: 'success',
                title: 'Order Placed Successfully',
                text: 'Your order has been placed!',
                timer: 2000,
                showConfirmButton: false,
              }).then(() => {
                this.loginSubscription =
                  this.userAuthService.isUserLogin.subscribe((isLoggedIn) => {
                    if (isLoggedIn && this.customerId) {
                      this.customerService.loadCartItems(this.customerId);
                    }
                  });
                this.router.navigate(['/home']);
              });
            },
            error: (err) => {
              console.log(err);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to place order. Please try again.',
              });
            },
          });
        }
      });
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Form',
        text: 'Please fill all required fields before proceeding.',
      });
    }
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'https://fakeimg.pl/300/'; // Default image on error
  }
}
