import { Component, OnInit } from '@angular/core';
import { UserAuthService } from '../../../Core/services/user-auth.service';
import { MerchantService } from '../../../Core/services/merchant.service';
import { jwtDecode } from '../../../../../node_modules/jwt-decode/build/cjs/index';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MerchantProduct,
  OrderItem,
  ProductDetail,
  updateOrderStatus,
  updateProduct,
  addProduct,
  addColorSizeImage,
} from '../../../Core/interfaces/merchant-interfaces';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-merchant-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './merchant-dashboard.component.html',
  styleUrl: './merchant-dashboard.component.css',
})
export class MerchantDashboardComponent implements OnInit {
  merchantPersonName: string = '';
  merchantId: string = '';
  decodedToken: any;
  errorMessage: string = '';
  view:
    | 'home'
    | 'products'
    | 'details'
    | 'orders'
    | 'order-details'
    | 'add-product' = 'home';
  sidebarOpen: boolean = false;
  products: MerchantProduct[] = [];
  paginatedProducts: MerchantProduct[] = [];
  selectedProduct: MerchantProduct | null = null;
  productVariants: ProductDetail[] = [];
  selectedVariant: ProductDetail | null = null;
  originalProduct: MerchantProduct | null = null;
  originalVariantQuantity: number | null = null;
  orders: OrderItem[] = [];
  paginatedOrders: OrderItem[] = [];
  selectedOrder: OrderItem | null = null;
  originalOrderStatus: string | null = null;
  loading: boolean = false;
  currentPage: number = 1;
  productsPerPage: number = 6;
  totalPages: number = 1;
  pageNumbers: number[] = [];
  isEditingTitle: boolean = false;
  isEditingDescription: boolean = false;
  isEditingSellPrice: boolean = false;
  isEditingDiscount: boolean = false;
  isEditingVariantQuantity: boolean = false;
  isEditingOrderStatus: boolean = false;
  currentStep: number = 1;
  productCreated: boolean = false;
  productId: number | null = null;
  newProduct: addProduct = {
    title: '',
    description: '',
    categoryName: '',
    type: 'tops',
    unitPrice: 0,
    discount: 0,
    merchantId: '',
  };
  variants: {
    color: string[];
    images: (File | null)[];
    sizes: string[];
    quantities: number[];
    totalQuantity: number;
  }[] = [
    {
      color: [],
      images: [null, null, null],
      sizes: [''],
      quantities: [0],
      totalQuantity: 0,
    },
  ];
  colors: string[] = [
    '#FF0000', // red
    '#0000FF', // blue
    '#008000', // green
    '#FFFF00', // yellow
    '#800080', // purple
    '#FFA500', // orange
    '#FFC0CB', // pink
    '#000000', // black
    '#FFFFFF', // white
    '#808080', // gray
    '#A52A2A', // brown
    '#00FFFF', // cyan
    '#FF00FF', // magenta
    '#00FF00', // lime
    '#008080', // teal
    '#4B0082', // indigo
    '#EE82EE', // violet
    '#FFD700', // gold
    '#C0C0C0', // silver
    '#FF7F50', // coral
    '#000080', // navy
    '#808000', // olive
    '#800000', // maroon
    '#40E0D0', // turquoise
    '#F5F5DC', // beige
    '#E6E6FA', // lavender
    '#DC143C', // crimson
    '#50C878', // emerald
    '#0F52BA', // sapphire
    '#FFFFF0', // ivory
    '#36454F', // charcoal
    '#FF007F', // rose
    '#FFDB58', // mustard
    '#DDA0DD', // plum
    '#CD7F32', // bronze
    '#B87333', // copper
    '#E0115F', // ruby
    '#FFBF00', // amber
  ];

  constructor(
    public _UserAuthService: UserAuthService,
    private _MerchantService: MerchantService
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token') || '';
    if (!token) {
      this.errorMessage = 'No authentication token found. Please log in.';
      console.error('No token found in localStorage');
      return;
    }
    try {
      this.decodedToken = jwtDecode(token);
      this.merchantPersonName = this.decodedToken.Name;
      this.merchantId = this.decodedToken.ID;
      this.newProduct.merchantId = this.merchantId;
      if (this.view === 'products') {
        this.loadProducts();
      } else if (this.view === 'orders') {
        this.loadOrders();
      }
    } catch (error) {
      this.errorMessage = 'Invalid token. Please log in again.';
      console.error('Invalid token:', error);
    }
  }

  toggleEditTitle(): void {
    this.isEditingTitle = !this.isEditingTitle;
  }

  toggleEditDescription(): void {
    this.isEditingDescription = !this.isEditingDescription;
  }

  toggleEditSellPrice(): void {
    this.isEditingSellPrice = !this.isEditingSellPrice;
  }

  toggleEditDiscount(): void {
    this.isEditingDiscount = !this.isEditingDiscount;
  }

  toggleEditVariantQuantity(): void {
    this.isEditingVariantQuantity = !this.isEditingVariantQuantity;
  }

  toggleEditOrderStatus(): void {
    this.isEditingOrderStatus = !this.isEditingOrderStatus;
  }

  setView(
    view:
      | 'home'
      | 'products'
      | 'details'
      | 'orders'
      | 'order-details'
      | 'add-product'
  ): void {
    this.view = view;
    this.errorMessage = '';
    if (view === 'products') {
      this.loadProducts();
      this.selectedProduct = null;
      this.productVariants = [];
      this.selectedVariant = null;
      this.originalProduct = null;
      this.originalVariantQuantity = null;
      this.resetEditModes();
    } else if (view === 'orders') {
      this.loadOrders();
      this.selectedOrder = null;
      this.originalOrderStatus = null;
    } else if (view === 'home') {
      this.selectedProduct = null;
      this.selectedOrder = null;
      this.originalProduct = null;
      this.originalVariantQuantity = null;
      this.originalOrderStatus = null;
    } else if (view === 'add-product') {
      this.resetNewProduct();
      this.currentStep = 1;
      this.productCreated = false;
      this.productId = null;
      this.selectedProduct = null;
      this.selectedOrder = null;
      this.originalProduct = null;
      this.originalVariantQuantity = null;
      this.originalOrderStatus = null;
      this.resetEditModes();
    }
  }

  resetEditModes(): void {
    this.isEditingTitle = false;
    this.isEditingDescription = false;
    this.isEditingSellPrice = false;
    this.isEditingDiscount = false;
    this.isEditingVariantQuantity = false;
    this.isEditingOrderStatus = false;
  }

  resetNewProduct(): void {
    this.newProduct = {
      title: '',
      description: '',
      categoryName: '',
      type: 'tops',
      unitPrice: 0,
      discount: 0,
      merchantId: this.merchantId,
    };
    this.variants = [
      {
        color: [],
        images: [null, null, null],
        sizes: [''],
        quantities: [0],
        totalQuantity: 0,
      },
    ];
    this.currentStep = 1;
    this.productCreated = false;
    this.productId = null;
  }

  addVariant(): void {
    this.variants.push({
      color: [],
      images: [null, null, null],
      sizes: [''],
      quantities: [0],
      totalQuantity: 0,
    });
  }

  removeVariant(index: number): void {
    this.variants.splice(index, 1);
  }

  addSize(variantIndex: number): void {
    if (this.variants[variantIndex].sizes.includes('')) {
      this.errorMessage = 'Complete existing sizes first';
      Swal.fire({ title: 'Error', text: this.errorMessage, icon: 'error' });
      return;
    }
    if (this.variants[variantIndex].sizes.length >= 5) {
      this.errorMessage = 'Maximum 5 sizes per variant';
      Swal.fire({ title: 'Error', text: this.errorMessage, icon: 'error' });
      return;
    }
    this.variants[variantIndex].sizes.push('');
    this.variants[variantIndex].quantities.push(0);
    this.updateTotalQuantity(variantIndex);
  }

  removeSize(variantIndex: number, sizeIndex: number): void {
    this.variants[variantIndex].sizes.splice(sizeIndex, 1);
    this.variants[variantIndex].quantities.splice(sizeIndex, 1);
    this.updateTotalQuantity(variantIndex);
  }

  onImageUpload(event: Event, index: number, imageIndex: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'Image size must be less than 5MB';
        Swal.fire({ title: 'Error', text: this.errorMessage, icon: 'error' });
        return;
      }
      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Only image files are allowed';
        Swal.fire({ title: 'Error', text: this.errorMessage, icon: 'error' });
        return;
      }
      this.variants[index].images[imageIndex] = file;
      this.updateVariantImages(index);
    }
  }

  removeImage(variantIndex: number, imageIndex: number): void {
    this.variants[variantIndex].images[imageIndex] = null;
    this.updateVariantImages(variantIndex);
  }

  updateVariantImages(variantIndex: number): void {
    while (this.variants[variantIndex].images.length < 3) {
      this.variants[variantIndex].images.push(null);
    }
    this.variants[variantIndex].images = this.variants[
      variantIndex
    ].images.slice(0, 3);
  }

  onColorChange(event: Event, variantIndex: number, color: string): void {
    const checkbox = event.target as HTMLInputElement;
    let currentColors = [...this.variants[variantIndex].color];
    if (checkbox.checked) {
      if (!currentColors.includes(color)) {
        currentColors.push(color);
      }
    } else {
      currentColors = currentColors.filter((c) => c !== color);
    }
    this.variants[variantIndex].color = currentColors;
    this.updateTotalQuantity(variantIndex);
  }

  getImagePreview(image: File): string {
    return image ? URL.createObjectURL(image) : '';
  }

  addNewProduct(): void {
    if (!this.newProduct.title.trim()) {
      this.errorMessage = 'Product title is required';
      Swal.fire({ title: 'Error', text: this.errorMessage, icon: 'error' });
      return;
    }
    if (!this.newProduct.categoryName.trim()) {
      this.errorMessage = 'Category name is required';
      Swal.fire({ title: 'Error', text: this.errorMessage, icon: 'error' });
      return;
    }
    if (!this.newProduct.type) {
      this.errorMessage = 'Product type is required';
      Swal.fire({ title: 'Error', text: this.errorMessage, icon: 'error' });
      return;
    }
    if (this.newProduct.unitPrice <= 0) {
      this.errorMessage = 'Unit price must be greater than 0';
      Swal.fire({ title: 'Error', text: this.errorMessage, icon: 'error' });
      return;
    }
    if (this.newProduct.discount < 0 || this.newProduct.discount > 100) {
      this.errorMessage = 'Discount must be between 0 and 100';
      Swal.fire({ title: 'Error', text: this.errorMessage, icon: 'error' });
      return;
    }
    if (!this.newProduct.merchantId) {
      this.errorMessage = 'Merchant ID is missing';
      Swal.fire({ title: 'Error', text: this.errorMessage, icon: 'error' });
      return;
    }

    const apiProduct: addProduct = {
      ...this.newProduct,
    };

    this.loading = true;
    this._MerchantService.addProduct(apiProduct).subscribe({
      next: (res: any) => {
        this.productId = res.productId;
        this.productCreated = true;
        this.currentStep = 2;
        this.loading = false;
        Swal.fire({
          title: 'Product Created',
          text: 'Basic product information saved. Now add variants.',
          icon: 'success',
        });
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to add product';
        Swal.fire({ title: 'Error', text: this.errorMessage, icon: 'error' });
        console.error('Error adding product:', err);
      },
    });
  }

  submitVariants(): void {
    if (!this.productId) {
      this.errorMessage = 'Product ID is missing';
      Swal.fire({ title: 'Error', text: this.errorMessage, icon: 'error' });
      return;
    }

    for (const [index, variant] of this.variants.entries()) {
      if (variant.color.length === 0) {
        this.errorMessage = `At least one color is required for variant ${
          index + 1
        }`;
        Swal.fire({ title: 'Error', text: this.errorMessage, icon: 'error' });
        return;
      }
      const validImages = variant.images.filter((img) => img) as File[];
      if (validImages.length === 0) {
        this.errorMessage = `At least one image is required for variant ${
          index + 1
        }`;
        Swal.fire({ title: 'Error', text: this.errorMessage, icon: 'error' });
        return;
      }
      if (validImages.length > 3) {
        this.errorMessage = `Maximum 3 images allowed for variant ${index + 1}`;
        Swal.fire({ title: 'Error', text: this.errorMessage, icon: 'error' });
        return;
      }
      if (variant.sizes.length === 0 || variant.sizes.some((size) => !size)) {
        this.errorMessage = `At least one valid size is required for variant ${
          index + 1
        }`;
        Swal.fire({ title: 'Error', text: this.errorMessage, icon: 'error' });
        return;
      }
      if (variant.quantities.some((q) => q <= 0)) {
        this.errorMessage = `Quantities must be greater than 0 for variant ${
          index + 1
        }`;
        Swal.fire({ title: 'Error', text: this.errorMessage, icon: 'error' });
        return;
      }
      if (variant.totalQuantity <= 0) {
        this.errorMessage = `Total quantity must be greater than 0 for variant ${
          index + 1
        }`;
        Swal.fire({ title: 'Error', text: this.errorMessage, icon: 'error' });
        return;
      }
    }

    this.loading = true;
    let completedRequests = 0;
    const totalRequests = this.variants.reduce(
      (sum, variant) => sum + variant.sizes.length,
      0
    );

    this.variants.forEach((variant, variantIndex) => {
      const validImages = variant.images.filter((img) => img) as File[];
      variant.sizes.forEach((size, sizeIndex) => {
        if (size) {
          const variantData: addColorSizeImage = {
            ProductId: this.productId!,
            Color: variant.color.join(' & '), // Combine multiple colors with " & "
            Size: size,
            Quantities: [variant.quantities[sizeIndex]],
            Images: sizeIndex === 0 ? validImages : [], // Send images only with the first size request
          };

          this._MerchantService.addColorSizeImage(variantData).subscribe({
            next: () => {
              completedRequests++;
              if (completedRequests === totalRequests) {
                this.loading = false;
                Swal.fire({
                  title: 'Variants Added',
                  text: 'All variants have been successfully added!',
                  icon: 'success',
                });
                this.resetNewProduct();
                this.setView('products');
              }
            },
            error: (err) => {
              this.loading = false;
              this.errorMessage =
                err.error?.message ||
                `Failed to add variant for size ${
                  variant.sizes[sizeIndex]
                } in variant ${variantIndex + 1}`;
              Swal.fire({
                title: 'Error',
                text: this.errorMessage,
                icon: 'error',
              });
              console.error(
                `Error adding variant for size ${
                  variant.sizes[sizeIndex]
                } in variant ${variantIndex + 1}:`,
                err
              );
            },
          });
        }
      });
    });
  }

  goToStep(step: number): void {
    if (step === 1 && this.productCreated) {
      this.errorMessage = 'Cannot return to basic info after product creation';
      Swal.fire({ title: 'Error', text: this.errorMessage, icon: 'error' });
      return;
    }
    if (step === 2) {
      if (!this.newProduct.title.trim()) {
        this.errorMessage = 'Product title is required';
        Swal.fire({ title: 'Error', text: this.errorMessage, icon: 'error' });
        return;
      }
      if (!this.newProduct.categoryName.trim()) {
        this.errorMessage = 'Category name is required';
        Swal.fire({ title: 'Error', text: this.errorMessage, icon: 'error' });
        return;
      }
      if (!this.newProduct.type) {
        this.errorMessage = 'Product type is required';
        Swal.fire({ title: 'Error', text: this.errorMessage, icon: 'error' });
        return;
      }
      if (this.newProduct.unitPrice <= 0) {
        this.errorMessage = 'Unit price must be greater than 0';
        Swal.fire({ title: 'Error', text: this.errorMessage, icon: 'error' });
        return;
      }
      if (this.newProduct.discount < 0 || this.newProduct.discount > 100) {
        this.errorMessage = 'Discount must be between 0 and 100';
        Swal.fire({ title: 'Error', text: this.errorMessage, icon: 'error' });
        return;
      }
      if (!this.newProduct.merchantId) {
        this.errorMessage = 'Merchant ID is missing';
        Swal.fire({ title: 'Error', text: this.errorMessage, icon: 'error' });
        return;
      }
    }
    this.currentStep = step;
  }

  loadProducts(): void {
    if (!this.merchantId) {
      this.errorMessage = 'Merchant ID not found';
      return;
    }
    this.loading = true;
    this._MerchantService.getProducts(this.merchantId).subscribe({
      next: (res: MerchantProduct[]) => {
        this.products = res;
        this.updateProductPagination();
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to load products';
        this.loading = false;
        this.products = [];
        this.paginatedProducts = [];
        console.error('Error fetching products:', err);
      },
    });
  }

  loadOrders(): void {
    if (!this.merchantId) {
      this.errorMessage = 'Merchant ID not found';
      return;
    }
    this.loading = true;
    this._MerchantService.getOrderItems(this.merchantId).subscribe({
      next: (res: OrderItem[]) => {
        this.orders = res;
        this.updateOrderPagination();
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to load orders';
        this.loading = false;
        this.orders = [];
        this.paginatedOrders = [];
        console.error('Error fetching orders:', err);
      },
    });
  }

  loadProductDetails(productId: number): void {
    this.loading = true;
    const mainProduct = this.products.find((p) => p.id === productId);
    if (!mainProduct) {
      this.errorMessage = 'Product not found';
      this.loading = false;
      return;
    }
    this.selectedProduct = {
      id: mainProduct.id,
      title: mainProduct.title,
      description: mainProduct.description,
      status: mainProduct.status,
      discount: mainProduct.discount,
      unite: mainProduct.unite,
      sellPrice: mainProduct.sellPrice,
      categoryName: mainProduct.categoryName,
      image: mainProduct.image,
      quantity: mainProduct.quantity,
    };
    this.originalProduct = { ...this.selectedProduct };
    this._MerchantService.getProductDetails(productId).subscribe({
      next: (details: ProductDetail[]) => {
        if (details && details.length > 0) {
          this.productVariants = details;
          this.selectedVariant = details[0];
          this.originalVariantQuantity = details[0]?.quantity ?? null;
          this.errorMessage = '';
        } else {
          this.productVariants = [];
          this.selectedVariant = null;
          this.originalVariantQuantity = null;
          this.errorMessage = 'No product details found for this Product.';
        }
        this.setView('details');
        this.loading = false;
      },
      error: (err) => {
        this.productVariants = [];
        this.selectedVariant = null;
        this.originalVariantQuantity = null;
        this.errorMessage =
          err.error?.message || 'Failed to load product details';
        console.error('Error fetching product details:', err);
        this.setView('details');
        this.loading = false;
      },
    });
  }

  selectOrder(order: OrderItem): void {
    this.selectedOrder = order;
    this.originalOrderStatus = order.status ?? null;
    this.setView('order-details');
  }

  selectVariant(variant: ProductDetail): void {
    this.selectedVariant = variant;
    this.originalVariantQuantity = variant.quantity ?? null;
  }

  get filteredVariants(): ProductDetail[] {
    if (!this.selectedProduct || !this.productVariants) {
      return this.productVariants;
    }
    return this.productVariants.filter(
      (variant) =>
        variant.image &&
        this.selectedProduct?.image &&
        variant.image.trim() !== this.selectedProduct.image.trim()
    );
  }

  getValidStatusOptions(currentStatus: string): string[] {
    switch (currentStatus) {
      case 'Active':
        return ['Active', 'OutOfStock', 'Banned'];
      case 'OutOfStock':
        return ['OutOfStock', 'Active'];
      case 'Banned':
        return ['Banned'];
      case 'Pending':
        return ['Pending', 'Active'];
      default:
        return ['Active', 'OutOfStock'];
    }
  }

  getValidOrderStatusOptions(currentStatus: string): string[] {
    if (currentStatus === 'Pending') {
      return ['Preparing'];
    }
    return [];
  }

  getOrderStatusOptionsWithCurrent(): string[] {
    if (!this.selectedOrder || !this.selectedOrder.status) {
      return [];
    }
    const currentStatus = this.selectedOrder.status;
    const validOptions = this.getValidOrderStatusOptions(currentStatus);
    return [currentStatus, ...validOptions].filter(
      (status, index, self) => self.indexOf(status) === index
    );
  }

  saveProductDetails(): void {
    if (!this.selectedProduct || !this.originalProduct) {
      this.errorMessage = 'No product selected';
      return;
    }

    const index = this.products.findIndex(
      (p) => p.id === this.selectedProduct!.id
    );
    if (index === -1) {
      this.errorMessage = 'Product not found in list';
      return;
    }

    const updateData: updateProduct = {
      id: this.selectedProduct.id,
      title: this.selectedProduct.title,
      description: this.selectedProduct.description,
      discount: this.selectedProduct.discount,
      unitPrice: this.selectedProduct.sellPrice,
    };

    this.loading = true;
    this._MerchantService.updateProduct(updateData).subscribe({
      next: () => {
        const updatedProduct: MerchantProduct = {
          id: this.selectedProduct?.id ?? this.products[index].id,
          title: this.selectedProduct?.title ?? this.products[index].title,
          description:
            this.selectedProduct?.description ??
            this.products[index].description,
          status: this.selectedProduct?.status ?? this.products[index].status,
          discount:
            this.selectedProduct?.discount ?? this.products[index].discount,
          unite: this.products[index].unite,
          sellPrice:
            this.selectedProduct?.sellPrice ?? this.products[index].sellPrice,
          categoryName: this.products[index].categoryName,
          image: this.products[index].image,
          quantity: this.products[index].quantity,
        };
        this.products[index] = updatedProduct;
        this.updateProductPagination();
        if (this.selectedProduct?.id !== undefined) {
          this.originalProduct = { ...this.selectedProduct };
          this.resetEditModes();
        }
        Swal.fire({
          title: 'Update Successful',
          icon: 'success',
        });
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to update product';
        console.error('Error updating product:', err);
        this.loading = false;
      },
    });
  }

  saveVariantQuantity(): void {
    if (
      !this.selectedOrder ||
      !this.selectedOrder.id ||
      !this.selectedOrder.status
    ) {
      this.errorMessage = 'No order selected or status not set';
      return;
    }

    if (
      this.selectedOrder.status !== 'Preparing' ||
      this.originalOrderStatus !== 'Pending'
    ) {
      this.errorMessage =
        'Order status can only be changed from Pending to Preparing';
      return;
    }

    const orderIndex = this.orders.findIndex(
      (o) => o.id === this.selectedOrder!.id
    );
    if (orderIndex === -1) {
      this.errorMessage = 'Order not found in list';
      return;
    }

    const updateData: updateOrderStatus = {
      id: this.selectedOrder.id,
      newStatus: this.selectedOrder.status,
    };

    this.loading = true;
    this._MerchantService.UpdateOrderItemStatus(updateData).subscribe({
      next: () => {
        this.orders[orderIndex] = {
          ...this.orders[orderIndex],
          status: this.selectedOrder!.status,
        };
        this.selectedOrder = {
          ...this.selectedOrder!,
          status: this.selectedOrder!.status,
        };
        this.originalOrderStatus = this.selectedOrder!.status;
        this.updateOrderPagination();
        this.resetEditModes();
        Swal.fire({
          title: 'Update Successful',
          icon: 'success',
        });
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage =
          err.error?.message || 'Failed to update order status';
        console.error('Error updating order status:', err);
        this.loading = false;
      },
    });
  }

  saveOrderStatus(): void {
    if (
      !this.selectedOrder ||
      !this.selectedOrder.id ||
      !this.selectedOrder.status
    ) {
      this.errorMessage = 'No order selected or status not set';
      return;
    }

    if (
      this.selectedOrder.status !== 'Preparing' ||
      this.originalOrderStatus !== 'Pending'
    ) {
      this.errorMessage =
        'Order status can only be changed from Pending to Preparing';
      return;
    }

    const orderIndex = this.orders.findIndex(
      (o) => o.id === this.selectedOrder!.id
    );
    if (orderIndex === -1) {
      this.errorMessage = 'Order not found in list';
      return;
    }

    const updateData: updateOrderStatus = {
      id: this.selectedOrder.id,
      newStatus: this.selectedOrder.status,
    };

    this.loading = true;
    this._MerchantService.UpdateOrderItemStatus(updateData).subscribe({
      next: () => {
        this.orders[orderIndex] = {
          ...this.orders[orderIndex],
          status: this.selectedOrder!.status,
        };
        this.selectedOrder = {
          ...this.selectedOrder!,
          status: this.selectedOrder!.status,
        };
        this.originalOrderStatus = this.selectedOrder!.status;
        this.updateOrderPagination();
        this.resetEditModes();
        Swal.fire({
          title: 'Update Successful',
          icon: 'success',
        });
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage =
          err.error?.message || 'Failed to update order status';
        console.error('Error updating order status:', err);
        this.loading = false;
      },
    });
  }

  isChanged(): boolean {
    const productChanged =
      this.selectedProduct &&
      this.originalProduct &&
      (this.selectedProduct.title !== this.originalProduct.title ||
        this.selectedProduct.description !== this.originalProduct.description ||
        this.selectedProduct.discount !== this.originalProduct.discount ||
        this.selectedProduct.sellPrice !== this.originalProduct.sellPrice ||
        this.selectedProduct.status !== this.originalProduct.status);
    const variantQuantityChanged =
      this.selectedVariant?.quantity != null &&
      this.originalVariantQuantity != null &&
      this.selectedVariant.quantity !== this.originalVariantQuantity;
    const orderStatusChanged =
      this.selectedOrder?.status != null &&
      this.originalOrderStatus != null &&
      this.selectedOrder.status !== this.originalOrderStatus;
    return !!productChanged || variantQuantityChanged || orderStatusChanged;
  }

  updateProductPagination(): void {
    this.totalPages = Math.ceil(this.products.length / this.productsPerPage);
    this.currentPage = Math.min(this.currentPage, Math.max(1, this.totalPages));
    const startIndex = (this.currentPage - 1) * this.productsPerPage;
    this.paginatedProducts = this.products.slice(
      startIndex,
      startIndex + this.productsPerPage
    );
    this.updatePageNumbers();
  }

  updateOrderPagination(): void {
    this.totalPages = Math.ceil(this.orders.length / this.productsPerPage);
    this.currentPage = Math.min(this.currentPage, Math.max(1, this.totalPages));
    const startIndex = (this.currentPage - 1) * this.productsPerPage;
    this.paginatedOrders = this.orders.slice(
      startIndex,
      startIndex + this.productsPerPage
    );
    this.updatePageNumbers();
  }

  updatePageNumbers(): void {
    const maxPagesToShow = 5;
    let startPage = Math.max(
      1,
      this.currentPage - Math.floor(maxPagesToShow / 2)
    );
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    this.pageNumbers = Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      if (this.view === 'products') {
        this.updateProductPagination();
      } else if (this.view === 'orders') {
        this.updateOrderPagination();
      }
    }
  }

  trackByProductId(index: number, product: MerchantProduct): number {
    return product.id;
  }

  trackByOrderId(index: number, order: OrderItem): number {
    return order.id;
  }

  ngOnDestroy(): void {
    this.variants.forEach((variant) => {
      variant.images.forEach((image) => {
        if (image) {
          URL.revokeObjectURL(this.getImagePreview(image));
        }
      });
    });
  }

  updateTotalQuantity(variantIndex: number): void {
    const variant = this.variants[variantIndex];
    variant.totalQuantity = variant.quantities.reduce(
      (sum, q) => sum + (q || 0),
      0
    );
  }
}
