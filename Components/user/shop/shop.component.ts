import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CustomerService } from '../../../Core/services/customer.service';
import { UserAuthService } from '../../../Core/services/user-auth.service';
import {
  showAllFav,
  showAllProducts,
} from '../../../Core/interfaces/customer-interfaces';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode';
import { TrackingService } from '../../../Core/services/tracking.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.css',
})
export class ShopComponent implements OnInit {
  customerPersonName: string = '';
  customerId: string = '';
  decodedToken: any;

  constructor(
    private customerService: CustomerService,
    public userAuthService: UserAuthService,
    private TrackingService: TrackingService,
    private router: Router
  ) {}

  // Signals for state management
  products = signal<showAllProducts[]>([]);
  filteredProducts = signal<showAllProducts[]>([]);
  paginatedProducts = signal<showAllProducts[]>([]);
  categories = signal<string[]>([]);
  selectedCategory = signal<string>('');
  minPrice = signal<number | null>(null);
  maxPrice = signal<number | null>(null);
  searchQuery = signal<string>('');
  sortOption = signal<string>('title-asc');
  currentPage = signal<number>(1);
  pageSize = signal<number>(9);
  totalPages = signal<number>(1);
  loading = signal<boolean>(false);
  errorMessage = signal<string>('');
  wishlist = signal<{ productId: number; favId: number }[]>([]);
  private loginSubscription: Subscription | null = null;

  // Filter collapse states
  isCategoryOpen = signal<boolean>(false);
  isPriceOpen = signal<boolean>(false);
  isSearchOpen = signal<boolean>(true);
  isSortOpen = signal<boolean>(false);

  // Computed signal for page numbers
  pageNumbers = computed(() => {
    const maxPagesToShow = 4;
    let startPage: number;

    if (this.currentPage() <= this.totalPages() - 3) {
      startPage = this.currentPage();
    } else {
      startPage = Math.max(1, this.totalPages() - 3);
    }

    const endPage = Math.min(this.totalPages(), startPage + maxPagesToShow - 1);
    const pages: number[] = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  });

  ngOnInit(): void {
    const token = localStorage.getItem('token') || '';
    if (token) {
      this.decodedToken = jwtDecode(token);
      this.customerPersonName = this.decodedToken.Name;
      this.customerId = this.decodedToken.ID;
    } else {
      this.customerId = '';
      this.customerPersonName = '';
    }

    this.loadProducts();
    this.loginSubscription = this.userAuthService.isUserLogin.subscribe(
      (isLoggedIn) => {
        if (isLoggedIn && this.customerId) {
          this.customerService.loadCartItems(this.customerId);
        }
      }
    );
  }

  loadProducts(): void {
    this.loading.set(true);
    this.customerService.showAllProduct().subscribe({
      next: (products: showAllProducts[]) => {
        this.products.set(
          products.map((product) => ({
            ...product,
            image: product.image.startsWith('//')
              ? `https:${product.image}`
              : product.image,
          }))
        );
        this.filteredProducts.set([...this.products()]);
        this.updateCategories();
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to load products');
        this.loading.set(false);
        this.products.set([]);
        this.filteredProducts.set([]);
        this.paginatedProducts.set([]);
        console.error('Error fetching products:', err);
      },
    });
  }

  // Toggle product in wishlist
  toggleWishlist(productId: number): void {
    if (!this.userAuthService.isUserLogin.getValue()) {
      Swal.fire({
        icon: 'warning',
        title: 'Please login first',
        text: 'You need to be logged in to add products to your wishlist.',
        confirmButtonText: 'Go to Login',
        showCancelButton: true,
        cancelButtonText: 'Cancel',
      }).then((result) => {
        if (result.isConfirmed) {
          const currentUrl = this.router.url;
          localStorage.setItem('returnUrl', currentUrl);
          this.router.navigate(['/login']);
        }
      });
      return;
    }

    if (this.isInWishlist(productId)) {
      // Remove from wishlist
      this.customerService.showAllFav(this.customerId).subscribe({
        next: (favorites: showAllFav[]) => {
          const favorite = favorites.find((fav) => fav.productId === productId);
          if (!favorite) {
            this.wishlist.update((items) =>
              items.filter((item) => item.productId !== productId)
            );
            this.customerService.removeFromWishlist(productId);
            Swal.fire({
              icon: 'success',
              title: 'Removed',
              text: 'Product removed from wishlist!',
              timer: 1500,
              showConfirmButton: false,
            });
            return;
          }

          const favId = favorite.id;
          this.customerService.DeleteFromFav(favId).subscribe({
            next: () => {
              this.wishlist.update((items) =>
                items.filter((item) => item.productId !== productId)
              );
              this.TrackingService.trackEvent(
                this.getCustomerId(),
                productId,
                'remove_from_wishlist'
              );
              this.customerService.removeFromWishlist(productId);
              Swal.fire({
                icon: 'success',
                title: 'Removed',
                text: 'Product removed from wishlist!',
                timer: 1500,
                showConfirmButton: false,
              });
            },
            error: (err) => {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to remove product from wishlist.',
              });
              console.error('Error removing from wishlist:', err);
            },
          });
        },
        error: (err) => {
          if (err.status === 404) {
            this.wishlist.update((items) =>
              items.filter((item) => item.productId !== productId)
            );
            this.TrackingService.trackEvent(
              this.customerId,
              productId,
              'remove_from_wishlist'
            );
            this.customerService.removeFromWishlist(productId);
            Swal.fire({
              icon: 'success',
              title: 'Removed',
              text: 'Product removed from wishlist!',
              timer: 1500,
              showConfirmButton: false,
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to fetch wishlist for removal.',
            });
            console.error('Error fetching wishlist for removal:', err);
          }
        },
      });
    } else {
      // Add to wishlist
      this.customerService.AddToFav(this.customerId, productId).subscribe({
        next: (response: any) => {
          const favId = response?.id || Date.now();
          this.TrackingService.trackEvent(
            this.customerId,
            productId,
            'add_to_wishlist'
          );
          this.customerService.addToWishlist({ productId, favId });
          Swal.fire({
            icon: 'success',
            title: 'Added',
            text: 'Product added to wishlist!',
            timer: 1500,
            showConfirmButton: false,
          });
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to add product to wishlist.',
          });
          console.error('Error adding to wishlist:', err);
        },
      });
    }
  }

  // Add to cart (toggles wishlist state)
  addToCart(productId: number): void {
    this.toggleWishlist(productId);
  }

  // Check if product is in wishlist
  isInWishlist(productId: number): boolean {
    return this.customerService
      .getWishlist()()
      .some(
        (item: { productId: number; favId: number }) =>
          item.productId === productId
      );
  }

  private normalizeCategory(category: string): string {
    const normalizedInput = category.toLowerCase().replace(/-|\s+/g, '');
    const categoryMap: { [key: string]: string } = {
      shirt: 'Shirts',
      tshirt: 'Shirts',
      tshirts: 'Shirts',
      jeans: 'Jeans',
      denim: 'Jeans',
      pants: 'Pants',
    };
    return (
      categoryMap[normalizedInput] ||
      category.charAt(0).toUpperCase() + category.slice(1)
    );
  }

  updateCategories(): void {
    this.categories.set([
      ...new Set(
        this.products().map((product) =>
          this.normalizeCategory(product.categoryName)
        )
      ),
    ]);
  }

  applyFilters(): void {
    let tempProducts = [...this.products()];

    // Category filter
    if (this.selectedCategory()) {
      tempProducts = tempProducts.filter(
        (product) =>
          this.normalizeCategory(product.categoryName) ===
          this.selectedCategory()
      );
    }

    // Price range filter
    if (this.minPrice() !== null && this.minPrice()! >= 0) {
      tempProducts = tempProducts.filter(
        (product) => product.sellPrice >= this.minPrice()!
      );
    }
    if (this.maxPrice() !== null && this.maxPrice()! >= 0) {
      tempProducts = tempProducts.filter(
        (product) => product.sellPrice <= this.maxPrice()!
      );
    }

    // Search filter
    if (this.searchQuery()) {
      tempProducts = tempProducts.filter((product) =>
        product.title.toLowerCase().includes(this.searchQuery().toLowerCase())
      );
    }

    // Sort
    tempProducts = this.sortProducts(tempProducts);

    this.filteredProducts.set(tempProducts);
    this.updatePagination();
  }

  sortProducts(products: showAllProducts[]): showAllProducts[] {
    switch (this.sortOption()) {
      case 'title-asc':
        return products.sort((a, b) => a.title.localeCompare(b.title));
      case 'title-desc':
        return products.sort((a, b) => b.title.localeCompare(a.title));
      case 'sellPrice-asc':
        return products.sort((a, b) => a.sellPrice - b.sellPrice);
      case 'sellPrice-desc':
        return products.sort((a, b) => b.sellPrice - a.sellPrice);
      default:
        return products;
    }
  }

  updatePagination(): void {
    this.totalPages.set(
      Math.ceil(this.filteredProducts().length / this.pageSize())
    );
    this.currentPage.set(Math.min(this.currentPage(), this.totalPages() || 1));
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    this.paginatedProducts.set(
      this.filteredProducts().slice(startIndex, startIndex + this.pageSize())
    );
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.updatePagination();
    }
  }

  // Filter toggle methods
  toggleCategoryFilter(): void {
    this.isCategoryOpen.set(!this.isCategoryOpen());
  }

  togglePriceFilter(): void {
    this.isPriceOpen.set(!this.isPriceOpen());
  }

  toggleSortFilter(): void {
    this.isSortOpen.set(!this.isSortOpen());
  }

  // Get arrow class based on open state
  getArrowClass(isOpen: boolean): string {
    return isOpen ? 'fa-chevron-up' : 'fa-chevron-down';
  }

  // TrackBy for performance
  trackByProductId(index: number, product: showAllProducts): number {
    return product.id;
  }

  // Handle image load errors
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'https://fakeimg.pl/300/'; // Fallback image
  }
  private getCustomerId(): string {
    const token = localStorage.getItem('token') || '';
    if (token) {
      const decodedToken: any = jwtDecode(token);
      return decodedToken.ID;
    }
    return '';
  }
}
