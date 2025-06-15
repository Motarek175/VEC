import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../../Core/services/order.service';
import { Order } from '../../../Core/interfaces/order';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { jwtDecode } from '../../../../../node_modules/jwt-decode/build/cjs/index';
import { UserAuthService } from '../../../Core/services/user-auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  styles: [
    `
      .animate-fade-in {
        animation: fadeIn 0.5s ease-in;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  orders: Order[] = [];
  selectedOrder: Order | null = null;
  originalStatus: string = '';
  updatedOrders: { id: string; status: string }[] = [];
  view: 'home' | 'list' | 'details' = 'home';
  currentPage: number = 1;
  ordersPerPage: number = 4;
  paginatedOrders: Order[] = [];
  totalPages: number = 1;
  visiblePages: number[] = [];
  errorMessage: string = '';
  deliveryPersonName: string = '';
  decodedToken: any;

  constructor(
    private orderService: OrderService,
    public _UserAuthService: UserAuthService
  ) {}

  ngOnInit() {
    const token = localStorage.getItem('token') || '';
    this.decodedToken = jwtDecode(token);
    this.deliveryPersonName = this.decodedToken.Name; // Adjust based on token structure

    this.orderService.getAssignedOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.errorMessage = '';
        this.updatePagination();
      },
      error: (error) => {
        this.orders = []; // Ensure orders is empty
        this.errorMessage =
          error.message || 'Failed to load orders. Please try again later.';
        this.updatePagination(); // Update pagination to hide it
        console.error(error);
        // Suppress toast for "No orders" case
        if (error.message !== 'No orders found for this delivery person.') {
          const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.onmouseenter = Swal.stopTimer;
              toast.onmouseleave = Swal.resumeTimer;
            },
          });
          Toast.fire({
            icon: 'error',
            title: this.errorMessage,
          });
        }
      },
    });
  }

  selectOrder(order: Order) {
    this.orderService.getOrderById(order.id).subscribe({
      next: (detailedOrder) => {
        if (detailedOrder) {
          this.selectedOrder = { ...detailedOrder };
          this.originalStatus = detailedOrder.status;
          this.view = 'details';
          this.errorMessage = '';
        } else {
          this.errorMessage = 'Order details not found.';
        }
      },
      error: (error) => {
        this.errorMessage =
          'Failed to load order details. Please try again later.';
        console.error(error);
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
          },
        });
        Toast.fire({
          icon: 'error',
          title: this.errorMessage,
        });
      },
    });
  }

  setView(view: 'home' | 'list' | 'details') {
    this.view = view;
    if (view === 'home' || view === 'list') {
      this.selectedOrder = null;
      this.originalStatus = '';
      if (view === 'list') {
        this.updatePagination();
      }
    }
  }

  isStatusChanged(): boolean {
    if (!this.selectedOrder) return false;
    const validTransitions =
      (this.originalStatus === 'preparing' &&
        this.selectedOrder.status === 'in-progress') ||
      (this.originalStatus === 'in-progress' &&
        this.selectedOrder.status === 'recieved');
    return (
      this.selectedOrder.status !== this.originalStatus && validTransitions
    );
  }

  saveOrderStatus() {
    if (this.selectedOrder && this.isStatusChanged()) {
      this.orderService
        .updateOrderStatus(this.selectedOrder.id, this.selectedOrder.status)
        .subscribe({
          next: () => {
            // Update orders array
            const index = this.orders.findIndex(
              (o) => o.id === this.selectedOrder!.id
            );
            if (index !== -1) {
              this.orders[index] = {
                ...this.orders[index],
                status: this.selectedOrder!.status,
              };
            }

            // Save to updatedOrders
            this.updatedOrders = [
              ...this.updatedOrders.filter(
                (o) => o.id !== this.selectedOrder!.id
              ),
              {
                id: this.selectedOrder!.id,
                status: this.selectedOrder!.status,
              },
            ];
            console.log('Updated orders:', this.updatedOrders);

            // Update originalStatus
            this.originalStatus = this.selectedOrder?.status || '';

            // Update pagination to reflect status changes
            this.updatePagination();

            this.errorMessage = '';
          },
          error: (error) => {
            this.errorMessage =
              'Failed to update order status. Please try again.';
            console.error(error);
          },
        });
    }
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.orders.length / this.ordersPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    const startIndex = (this.currentPage - 1) * this.ordersPerPage;
    this.paginatedOrders = this.orders.slice(
      startIndex,
      startIndex + this.ordersPerPage
    );

    // Calculate visible pages (4 at a time, starting at currentPage)
    const maxVisiblePages = 4;
    let startPage = this.currentPage;
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    // Adjust if fewer than 4 pages remain
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    this.visiblePages = [];
    if (this.orders.length > 0) {
      for (let i = startPage; i <= endPage; i++) {
        this.visiblePages.push(i);
      }
    }
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }
}
