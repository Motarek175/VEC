import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { AdminService } from '../../../Core/services/admin.service';
import { UserAuthService } from '../../../Core/services/user-auth.service';
import { jwtDecode } from '../../../../../node_modules/jwt-decode/build/cjs/index';
import Swal from 'sweetalert2';

import {
  Customer,
  DeliveryRep,
  Merchant,
  Order,
  OrderDetails,
  Product,
} from '../../../Core/interfaces/admin-intefaces';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
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
export class AdminDashboardComponent implements OnInit {
  adminPersonName: string = '';
  adminId: string = '';
  decodedToken: any;
  orders: Order[] = [];
  paginatedOrders: Order[] = [];
  selectedOrder: Order | null = null;
  selectedOrderDetails: OrderDetails | null = null;
  errorMessage: string = '';
  errorMessageCutomers: string = '';
  errorMessageDeliveryReps: string = '';
  errorMessageMerchants: string = '';
  errorMessageProducts: string = '';
  errorMessageOrders: string = '';
  currentOrdersPage: number = 1;
  ordersPerPage: number = 3;
  totalOrdersPages: number = 1;
  currentSection: string = 'home';
  sidebarOpen: boolean = false;
  successMessage: string = '';
  editingAddress: boolean = false;
  editingPhone: boolean = false;
  editingStatus: boolean = false;
  newAddress: string = '';
  newPhone: string = '';
  newStatus: string = '';
  statusOptions: string[] = ['Pending', 'Preparing', 'OnWay', 'Recieved'];

  /* Customer Variables */
  customers: Customer[] = [];
  paginatedCustomers: Customer[] = [];
  selectedCustomer: Customer | null = null;
  currentCustomersPage: number = 1;
  customersPerPage: number = 3;
  totalCustomersPages: number = 1;
  editingCustomerStatus: boolean = false;
  newCustomerStatus: Customer['status'] = 'Active';
  customerStatusOptions: Customer['status'][] = [
    'Active',
    'Inactive',
    'Banned',
  ];

  /* Merchant Variables */
  merchants: Merchant[] = [];
  paginatedMerchants: Merchant[] = [];
  selectedMerchant: Merchant | null = null;
  currentMerchantsPage: number = 1;
  merchantsPerPage: number = 3;
  totalMerchantsPages: number = 1;

  /* Delivery Rep Variables */
  deliveryReps: DeliveryRep[] = [];
  paginatedDeliveryReps: DeliveryRep[] = [];
  selectedDeliveryRep: DeliveryRep | null = null;
  showAddForm: boolean = false;
  loading: boolean = false;
  deliveryForm: FormGroup;
  currentDeliveryRepsPage: number = 1;
  deliveryRepsPerPage: number = 3;
  totalDeliveryRepsPages: number = 1;

  /* Product Variables */
  products: Product[] = [];
  filteredProducts: Product[] = [];
  paginatedProducts: Product[] = [];
  selectedProduct: Product | null = null;
  categoryFilter: string = '';
  productIdFilter: string = '';
  sortBy: string = 'title-asc';
  currentPage: number = 1;
  itemsPerPage: number = 3;
  totalPages: number = 1;

  constructor(
    private adminService: AdminService,
    public _UserAuthService: UserAuthService
  ) {
    this.deliveryForm = new FormGroup({
      userName: new FormControl('', [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9]+$/),
      ]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
        Validators.pattern(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&#^~]{8,}$/
        ),
      ]),
      phone: new FormControl('', [
        Validators.required,
        Validators.pattern(/^01[0125][0-9]{8}$/),
      ]),
      state: new FormControl('', [Validators.required]),
      governorate: new FormControl('', [Validators.required]),
      location: new FormControl('', [Validators.required]),
      gender: new FormControl('Male', [Validators.required]),
      birthDate: new FormControl('', [Validators.required]),
      nationalId: new FormControl('', [
        Validators.required,
        Validators.pattern(/^[0-9]{14}$/),
      ]),
    });
  }

  ngOnInit() {
    const token = localStorage.getItem('token') || '';
    if (!token) {
      this.errorMessage = 'No authentication token found. Please log in.';
      console.error('No token found in localStorage');
      return;
    }
    try {
      this.decodedToken = jwtDecode(token);
      this.adminPersonName = this.decodedToken.Name;
      this.adminId = this.decodedToken.sub || this.decodedToken.id || '';
    } catch (error) {
      this.errorMessage = 'Invalid token. Please log in again.';
      console.error('Invalid token:', error);
    }
    this.loadCustomers(); // Load customers via API
    this.loadDeliveryReps();
    this.loadOrders();
    // Load merchants via API
    this.loadMerchants();
    // Load products via API
    this.adminService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.errorMessage = products.length === 0 ? 'No products found.' : '';
        this.filterProducts();
      },
      error: (error) => {
        this.errorMessage = 'Failed to load products. Please try again later.';
        this.products = [];
        this.filterProducts();
        console.error('Error fetching products:', error);
      },
    });
    this.updateMerchantsPagination();
    this.updateDeliveryRepsPagination();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  /* Customer Functions (Done) */
  loadCustomers() {
    this.loading = true;
    this.errorMessageCutomers = '';
    this.successMessage = '';
    this.customers = [];
    this.paginatedCustomers = [];
    this.adminService.getAllCustomers().subscribe({
      next: (customers) => {
        this.customers = customers;
        this.errorMessageCutomers =
          customers.length === 0 ? 'No customers found.' : '';
        this.updateCustomersPagination();
        this.updateDisplayedCustomers();
        this.loading = false;
      },
      error: (error) => {
        this.errorMessageCutomers =
          'Failed to load customers. Please try again later.';
        this.customers = [];
        this.paginatedCustomers = [];
        this.updateCustomersPagination();
        this.loading = false;
        console.error('Error fetching customers:', error);
      },
    });
  }

  selectCustomer(customer: Customer) {
    this.selectedCustomer = { ...customer };
    this.newCustomerStatus = customer.status;
    this.errorMessageCutomers = '';
    this.successMessage = '';
    this.editingCustomerStatus = false;
    this.adminService.getCustomerById(customer.customerId).subscribe({
      next: (customers) => {
        if (customers.length > 0) {
          this.selectedCustomer = { ...customers[0] };
          this.newCustomerStatus = this.selectedCustomer.status;
        }
      },
      error: (error) => {
        this.errorMessageCutomers = 'Failed to load customer details.';
        console.error('Error fetching customer details:', error);
      },
    });
  }

  startEditingCustomerStatus() {
    this.editingCustomerStatus = true;
    this.errorMessageCutomers = '';
    this.successMessage = '';
  }

  saveCustomerStatus() {
    if (
      !this.selectedCustomer ||
      !this.customerStatusOptions.includes(this.newCustomerStatus)
    ) {
      this.errorMessageCutomers = 'Invalid status selected.';
      return;
    }
    this.adminService
      .updateCustomerStatus(
        this.selectedCustomer.customerId,
        this.newCustomerStatus
      )
      .subscribe({
        next: (response) => {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: response.message,
            confirmButtonColor: '#3085d6',
          });
          this.selectedCustomer!.status = this.newCustomerStatus;
          this.updateLocalCustomer(this.selectedCustomer!);
          this.editingCustomerStatus = false;
          this.successMessage = response.message;
        },
        error: (error) => {
          this.errorMessage =
            'Failed to update customer status. Please try again.';
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to update customer status.',
            confirmButtonColor: '#d33',
          });
          console.error('Error updating customer status:', error);
        },
      });
  }

  cancelEditingCustomerStatus() {
    if (this.selectedCustomer) {
      this.newCustomerStatus = this.selectedCustomer.status;
    }
    this.editingCustomerStatus = false;
    this.errorMessageCutomers = '';
    this.successMessage = '';
  }

  cancelCustomerEdit() {
    this.selectedCustomer = null;
    this.editingCustomerStatus = false;
    this.errorMessageCutomers = '';
    this.successMessage = '';
  }

  updateLocalCustomer(updatedCustomer: Customer) {
    const index = this.customers.findIndex(
      (c) => c.customerId === updatedCustomer.customerId
    );
    if (index !== -1) {
      this.customers = [
        ...this.customers.slice(0, index),
        { ...updatedCustomer },
        ...this.customers.slice(index + 1),
      ];
      this.updateCustomersPagination();
      this.updateDisplayedCustomers();
    }
  }

  updateCustomersPagination() {
    this.totalCustomersPages = Math.ceil(
      this.customers.length / this.customersPerPage
    );
    this.currentCustomersPage = Math.min(
      this.currentCustomersPage,
      this.totalCustomersPages || 1
    );
    this.updateDisplayedCustomers();
  }

  updateDisplayedCustomers() {
    const startIndex = (this.currentCustomersPage - 1) * this.customersPerPage;
    const endIndex = startIndex + this.customersPerPage;
    this.paginatedCustomers = this.customers.slice(startIndex, endIndex);
  }

  changeCustomersPage(page: number) {
    if (page >= 1 && page <= this.totalCustomersPages) {
      this.currentCustomersPage = page;
      this.updateDisplayedCustomers();
    }
  }

  getCustomersPageNumbers(): number[] {
    const maxPagesToShow = 4;
    let startPage: number;
    if (this.totalCustomersPages <= maxPagesToShow) {
      startPage = 1;
    } else if (this.currentCustomersPage <= this.totalCustomersPages - 3) {
      startPage = this.currentCustomersPage;
    } else {
      startPage = Math.max(1, this.totalCustomersPages - 3);
    }
    const endPage = Math.min(
      this.totalCustomersPages,
      startPage + maxPagesToShow - 1
    );
    const pages: number[] = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  trackByCustomerId(index: number, customer: Customer): string {
    return customer.customerId;
  }

  /* Orders Functions (Done) */
  loadOrders() {
    this.loading = true;
    this.errorMessageOrders = '';
    this.successMessage = '';
    this.adminService.getAllOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.errorMessageOrders = orders.length === 0 ? 'No orders found' : '';
        this.updateOrdersPagination();
        this.loading = false;
      },
      error: (error) => {
        if (
          error.error?.message === 'No orders found for this delivery person.'
        ) {
          this.errorMessageOrders = 'No orders found';
        } else {
          this.errorMessageOrders =
            'Failed to load orders. Please try again later.';
        }
        this.orders = [];
        this.updateOrdersPagination();
        this.loading = false;
        console.error('Error fetching orders:', error);
      },
    });
  }

  selectOrder(order: Order) {
    this.selectedOrder = { ...order };
    this.newAddress = order.address;
    this.newPhone = order.phone;
    this.newStatus = order.status;
    this.errorMessageOrders = '';
    this.successMessage = '';
    this.editingAddress = false;
    this.editingPhone = false;
    this.editingStatus = false;
    this.adminService.getSpecificOrder(order.id).subscribe({
      next: (specificOrders) => {
        if (specificOrders.length > 0) {
          this.selectedOrder = { ...specificOrders[0] };
          this.newAddress = this.selectedOrder.address;
          this.newPhone = this.selectedOrder.phone;
          this.newStatus = this.selectedOrder.status;
        }
      },
      error: (error) => {
        this.errorMessageOrders = 'Failed to load specific order details.';
        console.error('Error fetching specific order:', error);
      },
    });
    this.adminService.getOrderDetails(order.id).subscribe({
      next: (details) => {
        this.selectedOrderDetails = details;
      },
      error: (error) => {
        this.errorMessageOrders = 'Failed to load order details.';
        console.error('Error fetching order details:', error);
      },
    });
  }

  startEditingAddress() {
    this.editingAddress = true;
    this.errorMessageOrders = '';
    this.successMessage = '';
  }

  startEditingPhone() {
    this.editingPhone = true;
    this.errorMessageOrders = '';
    this.successMessage = '';
  }

  startEditingStatus() {
    this.editingStatus = true;
    this.errorMessageOrders = '';
    this.successMessage = '';
  }

  saveAddress() {
    if (!this.selectedOrder || !this.newAddress.trim()) {
      this.errorMessageOrders = 'Address cannot be empty.';
      return;
    }
    this.adminService
      .updateOrderAddress(this.selectedOrder.id, this.newAddress)
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.selectedOrder!.address = this.newAddress;
          this.updateLocalOrder(this.selectedOrder!);
          this.editingAddress = false;
        },
        error: (error) => {
          this.errorMessageOrders =
            'Failed to update address. Please try again.';
          console.error('Error updating address:', error);
        },
      });
  }

  savePhone() {
    if (!this.selectedOrder || !this.newPhone.trim()) {
      this.errorMessageOrders = 'Phone number cannot be empty.';
      return;
    }
    if (!/^\d{10,}$/.test(this.newPhone)) {
      this.errorMessageOrders = 'Phone number must be at least 10 digits.';
      return;
    }
    this.adminService
      .updateOrderPhone(this.selectedOrder.id, this.newPhone)
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.selectedOrder!.phone = this.newPhone;
          this.updateLocalOrder(this.selectedOrder!);
          this.editingPhone = false;
        },
        error: (error) => {
          this.errorMessageOrders = 'Failed to update phone. Please try again.';
          console.error('Error updating phone:', error);
        },
      });
  }

  saveStatus() {
    if (!this.selectedOrder || !this.statusOptions.includes(this.newStatus)) {
      this.errorMessageOrders = 'Invalid status selected.';
      return;
    }
    this.adminService
      .updateOrderStatus(this.selectedOrder.id, this.newStatus)
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.selectedOrder!.status = this.newStatus as Order['status'];
          this.updateLocalOrder(this.selectedOrder!);
          this.editingStatus = false;
        },
        error: (error) => {
          this.errorMessageOrders =
            'Failed to update status. Please try again.';
          console.error('Error updating status:', error);
        },
      });
  }

  cancelEditingAddress() {
    if (this.selectedOrder) {
      this.newAddress = this.selectedOrder.address;
    }
    this.editingAddress = false;
    this.errorMessageOrders = '';
    this.successMessage = '';
  }

  cancelEditingPhone() {
    if (this.selectedOrder) {
      this.newPhone = this.selectedOrder.phone;
    }
    this.editingPhone = false;
    this.errorMessageOrders = '';
    this.successMessage = '';
  }

  cancelEditingStatus() {
    if (this.selectedOrder) {
      this.newStatus = this.selectedOrder.status;
    }
    this.editingStatus = false;
    this.errorMessageOrders = '';
    this.successMessage = '';
  }

  cancelOrderEdit() {
    this.selectedOrder = null;
    this.selectedOrderDetails = null;
    this.editingAddress = false;
    this.editingPhone = false;
    this.editingStatus = false;
    this.errorMessageOrders = '';
    this.successMessage = '';
  }

  updateLocalOrder(updatedOrder: Order) {
    const index = this.orders.findIndex((o) => o.id === updatedOrder.id);
    if (index !== -1) {
      this.orders[index] = { ...updatedOrder };
      this.updateOrdersPagination();
    }
  }

  updateOrdersPagination() {
    this.totalOrdersPages = Math.ceil(this.orders.length / this.ordersPerPage);
    this.currentOrdersPage = Math.min(
      this.currentOrdersPage,
      this.totalOrdersPages || 1
    );
    this.updateDisplayedOrders();
  }

  updateDisplayedOrders() {
    const startIndex = (this.currentOrdersPage - 1) * this.ordersPerPage;
    const endIndex = startIndex + this.ordersPerPage;
    this.paginatedOrders = this.orders.slice(startIndex, endIndex);
  }

  changeOrdersPage(page: number) {
    if (page >= 1 && page <= this.totalOrdersPages) {
      this.currentOrdersPage = page;
      this.updateDisplayedOrders();
    }
  }

  getOrdersPageNumbers(): number[] {
    const maxPagesToShow = 4;
    let startPage: number;
    if (this.totalOrdersPages <= 4) {
      startPage = 1;
    } else if (this.currentOrdersPage <= this.totalOrdersPages - 3) {
      startPage = this.currentOrdersPage;
    } else {
      startPage = Math.max(1, this.totalOrdersPages - 3);
    }
    const endPage = Math.min(
      this.totalOrdersPages,
      startPage + maxPagesToShow - 1
    );
    const pages: number[] = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  /* Delivery Rep Functions (Done) */
  loadDeliveryReps() {
    this.loading = true;
    this.errorMessageDeliveryReps = '';
    this.adminService.getDeliveryReps().subscribe({
      next: (reps) => {
        this.deliveryReps = reps;
        this.errorMessageDeliveryReps =
          reps.length === 0 ? 'No delivery reps found' : '';
        this.updateDeliveryRepsPagination();
        this.loading = false;
      },
      error: (error) => {
        this.errorMessageDeliveryReps =
          'Failed to load delivery reps. Please try again later.';
        this.deliveryReps = [];
        this.updateDeliveryRepsPagination();
        this.loading = false;
        console.error('Error fetching delivery reps:', error);
      },
    });
  }

  selectDeliveryRep(rep: DeliveryRep) {
    this.selectedDeliveryRep = { ...rep };
    this.adminService.getDeliveryRepById(rep.id).subscribe({
      next: (reps) => {
        if (reps.length > 0) {
          this.selectedDeliveryRep = { ...reps[0] };
        }
      },
      error: (error) => {
        this.errorMessageDeliveryReps = 'Failed to load delivery rep details.';
        console.error('Error fetching delivery rep:', error);
      },
    });
  }

  addDeliveryRep() {
    if (this.deliveryForm.valid) {
      const formValue = this.deliveryForm.value;
      const newRep = {
        userName: formValue.userName,
        email: formValue.email,
        password: formValue.password,
        phone: formValue.phone,
        state: formValue.state,
        governorate: formValue.governorate,
        location: formValue.location,
        gender: formValue.governorate,
        birthDate: new Date(formValue.birthDate).toISOString(),
        nationalId: formValue.nationalId,
        adminId: this.adminId,
      };
      this.adminService.addDeliveryRep(newRep).subscribe({
        next: (response) => {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: response.message,
            confirmButtonColor: '#3085d6',
          });
          this.deliveryForm.reset({ gender: 'Male' });
          this.showAddForm = false;
          this.loadDeliveryReps();
        },
        error: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.error?.message,
            confirmButtonColor: '#d33',
          });
          console.error('Error adding delivery rep:', error);
        },
      });
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Form',
        text: 'Please fill in all required fields correctly.',
        confirmButtonColor: '#3085d6',
      });
      this.deliveryForm.markAllAsTouched();
    }
  }

  updateDeliveryRepStatus(rep: DeliveryRep) {
    this.adminService.updateDeliveryRepStatus(rep.id, rep.status).subscribe({
      next: () => {
        this.successMessage = 'Delivery rep status updated successfully.';
        this.loadDeliveryReps();
      },
      error: (error) => {
        this.errorMessageDeliveryReps = 'Failed to update delivery rep status.';
        console.error('Error updating delivery rep status:', error);
      },
    });
  }

  updateDeliveryRepsPagination() {
    this.totalDeliveryRepsPages = Math.ceil(
      this.deliveryReps.length / this.deliveryRepsPerPage
    );
    this.currentDeliveryRepsPage = Math.min(
      this.currentDeliveryRepsPage,
      this.totalDeliveryRepsPages || 1
    );
    this.updateDisplayedDeliveryReps();
  }

  updateDisplayedDeliveryReps() {
    const startIndex =
      (this.currentDeliveryRepsPage - 1) * this.deliveryRepsPerPage;
    const endIndex = startIndex + this.deliveryRepsPerPage;
    this.paginatedDeliveryReps = this.deliveryReps.slice(startIndex, endIndex);
  }

  changeDeliveryRepsPage(page: number) {
    if (page >= 1 && page <= this.totalDeliveryRepsPages) {
      this.currentDeliveryRepsPage = page;
      this.updateDisplayedDeliveryReps();
    }
  }

  getDeliveryRepsPageNumbers(): number[] {
    const maxPagesToShow = 4;
    let startPage: number;

    if (this.currentDeliveryRepsPage <= this.totalDeliveryRepsPages - 3) {
      startPage = this.currentDeliveryRepsPage;
    } else {
      startPage = Math.max(1, this.totalDeliveryRepsPages - 3);
    }

    const endPage = Math.min(
      this.totalDeliveryRepsPages,
      startPage + maxPagesToShow - 1
    );
    const pages: number[] = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  /* Merchant Functions */
  loadMerchants() {
    this.loading = true;
    this.errorMessageMerchants = '';
    this.successMessage = '';
    this.merchants = [];
    this.paginatedMerchants = [];
    this.adminService.getAllMerchants().subscribe({
      next: (merchants) => {
        this.merchants = merchants;
        this.errorMessageMerchants =
          merchants.length === 0 ? 'No merchants found.' : '';
        this.updateMerchantsPagination();
        this.loading = false;
      },
      error: (error) => {
        this.errorMessageMerchants =
          'Failed to load merchants. Please try again later.';
        this.merchants = [];
        this.updateMerchantsPagination();
        this.loading = false;
        console.error('Error fetching merchants:', error);
      },
    });
  }

  selectMerchant(merchant: Merchant) {
    this.selectedMerchant = { ...merchant };
    this.errorMessageMerchants = '';
    this.successMessage = '';
    this.adminService.getMerchantById(merchant.merchantId).subscribe({
      next: (merchants) => {
        if (merchants.length > 0) {
          this.selectedMerchant = { ...merchants[0] };
        }
      },
      error: (error) => {
        this.errorMessageMerchants = 'Failed to load merchant details.';
        console.error('Error fetching merchant details:', error);
      },
    });
  }

  updateMerchantStatus(merchant: Merchant) {
    if (!this.selectedMerchant) {
      this.errorMessageMerchants = 'No merchant selected.';
      return;
    }
    this.adminService
      .updateMerchantStatus(this.selectedMerchant.merchantId, merchant.status)
      .subscribe({
        next: (response) => {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: response.message,
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK',
          });
          const index = this.merchants.findIndex(
            (m) => m.merchantId === this.selectedMerchant!.merchantId
          );
          if (index !== -1) {
            this.merchants[index] = { ...this.selectedMerchant! };
          }
          this.updateMerchantsPagination();
        },
        error: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text:
              error.error?.message ||
              'Failed to update merchant status. Please try again.',
            confirmButtonColor: '#d33',
            confirmButtonText: 'OK',
          });
          console.error('Error updating merchant status:', error);
        },
      });
  }

  updateMerchantsPagination() {
    this.totalMerchantsPages = Math.ceil(
      this.merchants.length / this.merchantsPerPage
    );
    this.currentMerchantsPage = Math.min(
      this.currentMerchantsPage,
      this.totalMerchantsPages || 1
    );
    this.updateDisplayedMerchants();
  }

  updateDisplayedMerchants() {
    const startIndex = (this.currentMerchantsPage - 1) * this.merchantsPerPage;
    const endIndex = startIndex + this.merchantsPerPage;
    this.paginatedMerchants = this.merchants.slice(startIndex, endIndex);
  }

  changeMerchantsPage(page: number) {
    if (page >= 1 && page <= this.totalMerchantsPages) {
      this.currentMerchantsPage = page;
      this.updateDisplayedMerchants();
    }
  }

  getMerchantsPageNumbers(): number[] {
    const maxPagesToShow = 4;
    let startPage: number;

    if (this.currentMerchantsPage <= this.totalMerchantsPages - 3) {
      startPage = this.currentMerchantsPage;
    } else {
      startPage = Math.max(1, this.totalMerchantsPages - 3);
    }

    const endPage = Math.min(
      this.totalMerchantsPages,
      startPage + maxPagesToShow - 1
    );
    const pages: number[] = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  calculateMerchantEarnings(merchantId: string): number {
    let totalEarnings = 0;
    const deliveredOrders = this.orders.filter(
      (order) => order.status === 'Recieved'
    );
    return totalEarnings;
  }

  /* Product Functions (Done) */
  selectProduct(product: Product) {
    this.selectedProduct = {
      id: product.id,
      title: product.title,
      feedback: product.feedback,
      status: product.status,
      quantity: product.quantity,
      merchantName: product.merchantName,
      merchantId: product.merchantId,
      image: product.image,
    };
  }

  closeProductModal() {
    this.selectedProduct = null;
  }

  getValidStatusOptions(
    currentStatus: Product['status'] | null
  ): Product['status'][] {
    if (!currentStatus) {
      return [];
    }
    const validOptions: Product['status'][] = ['Banned'];
    if (currentStatus === 'Pending') {
      validOptions.push('Active');
    }
    if (currentStatus === 'Banned') {
      validOptions.push('Active');
    }

    return validOptions;
  }

  saveProductStatus() {
    if (this.selectedProduct) {
      const product = this.selectedProduct;
      this.adminService
        .updateProductStatus(product.id, product.status)
        .subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: response.message || 'Product status updated successfully.',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'OK',
            });
            const index = this.products.findIndex((p) => p.id === product.id);
            if (index !== -1) {
              this.products[index] = {
                id: product.id,
                title: product.title,
                feedback: product.feedback,
                status: product.status,
                quantity: product.quantity,
                merchantName: product.merchantName,
                merchantId: product.merchantId,
                image: product.image,
              };
            }
            this.filterProducts();
            this.closeProductModal();
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text:
                error.error?.message ||
                'Failed to update product status. Please try again.',
              confirmButtonColor: '#d33',
              confirmButtonText: 'OK',
            });
            console.error('Error updating product status:', error);
          },
        });
    }
  }

  filterProducts() {
    this.loading = true;
    this.currentPage = 1;
    let filtered = [...this.products];

    if (this.productIdFilter) {
      const searchId = this.productIdFilter.replace('#', '');
      filtered = filtered.filter((product) =>
        product.id.toString().includes(searchId)
      );
    }

    filtered.sort((a, b) => {
      if (this.sortBy === 'title-asc') {
        return a.title.localeCompare(b.title);
      } else if (this.sortBy === 'title-desc') {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });

    this.filteredProducts = filtered;
    this.updatePagination();
    setTimeout(() => {
      this.loading = false;
    }, 500);
  }

  updatePagination() {
    this.totalPages = Math.ceil(
      this.filteredProducts.length / this.itemsPerPage
    );
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    this.updateDisplayedProducts();
  }

  updateDisplayedProducts() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedProducts = this.filteredProducts.slice(startIndex, endIndex);
  }

  change_tab(tab: string) {
    this.currentSection = tab;
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedProducts();
    }
  }

  get pageNumbers(): number[] {
    const maxPagesToShow = 4;
    let startPage: number;
    if (this.totalPages <= maxPagesToShow) {
      startPage = 1;
    } else if (this.currentPage <= this.totalPages - 3) {
      startPage = this.currentPage;
    } else {
      startPage = Math.max(1, this.totalPages - 3);
    }
    const endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
    const pages: number[] = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }
}
