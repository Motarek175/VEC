import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  signal,
  computed,
  AfterViewInit,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ImageCompareModule } from 'primeng/imagecompare';
import { GalleriaModule } from 'primeng/galleria';
import { RouterLink, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CustomerService } from '../../../Core/services/customer.service';
import { UserAuthService } from '../../../Core/services/user-auth.service';
import {
  showAllFav,
  ShowHighFeedbackProduct,
  showRandomProduct,
  ShowSpecificProduct1,
} from '../../../Core/interfaces/customer-interfaces';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode';
import { TrackingService } from '../../../Core/services/tracking.service';
import { Subscription } from 'rxjs';
import { Customer } from '../../../Core/interfaces/admin-intefaces';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    InputTextModule,
    ImageCompareModule,
    GalleriaModule,
    RouterLink,
    ButtonModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('carouselContainer') carouselContainer!: ElementRef;
  customerPersonName: string = '';
  customerId: string = '';
  decodedToken: any;

  // State management (non-signal for products, signal for loading/wishlist)
  popularProducts: ShowHighFeedbackProduct[] = [];
  randomProducts: showRandomProduct[] = [];
  loading = signal<boolean>(true);
  errorMessage: string = '';
  wishlist = signal<{ productId: number; favId: number }[]>([]);
  private loginSubscription: Subscription | null = null;
  recommendedProducts = signal<ShowSpecificProduct1[]>([]);
  recommendationsLoading = signal<boolean>(false);

  // Carousel parameters
  slideWidth = 0;
  slideGap = 16;
  visibleSlides = 4;

  currentIndex = signal<number>(0);

  currentSlideOffset = computed(
    () => this.currentIndex() * (this.slideWidth + this.slideGap)
  );

  maxIndex = computed(() => {
    return Math.max(0, this.popularProducts.length - this.visibleSlides);
  });

  // Variables for Landing carousel
  currentIndexLanding = 0;
  images = [
    {
      imageUrl: 'assets/landing.jpg',
    },
    {
      imageUrl: 'assets/landing1.jpg',
    },
  ];

  constructor(
    private customerService: CustomerService,
    public _UserAuthService: UserAuthService,
    private TrackingService: TrackingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token') || '';
    if (token) {
      this.decodedToken = jwtDecode(token);
      this.customerPersonName = this.decodedToken.Name;
      this.customerId = this.decodedToken.ID;
      this.loadRecommendation(this.customerId, 5);
    } else {
      this.customerId = '';
      this.customerPersonName = '';
    }
    this.loadHighFeedbackProducts();
    this.loadRandomProducts();
    this.loginSubscription = this._UserAuthService.isUserLogin.subscribe(
      (isLoggedIn) => {
        if (isLoggedIn && this.customerId) {
          this.customerService.loadCartItems(this.customerId);
        }
      }
    );
  }

  loadRecommendation(customerId: string, num: number): void {
    this.recommendationsLoading.set(true);
    this.customerService.RecommendUser(customerId, num).subscribe({
      next: (
        response: { recommendations: [number, number][] } | [number, number][]
      ) => {
        let productIds: number[] = [];
        if (Array.isArray(response)) {
          productIds = response
            .map(([id]: [number, number]) => id)
            .slice(0, num);
        } else if (response && Array.isArray(response.recommendations)) {
          productIds = response.recommendations
            .map(([id]: [number, number]) => id)
            .slice(0, num);
        } else {
          console.warn('Unexpected RecommendUser response format:', response);
          this.recommendedProducts.set([]);
          this.recommendationsLoading.set(false);
          return;
        }
        this.fetchProductDetails(productIds);
      },
      error: (err) => {
        console.error('Error in RecommendUser:', err);
        this.recommendedProducts.set([]);
        this.recommendationsLoading.set(false);
      },
    });
  }

  private fetchProductDetails(productIds: number[]): void {
    if (productIds.length === 0) {
      this.recommendedProducts.set([]);
      this.recommendationsLoading.set(false);
      return;
    }

    const productDetails: ShowSpecificProduct1[] = [];
    let detailsFetched = 0;

    productIds.forEach((prodId) => {
      this.customerService
        .showSpecifiProduct(prodId, this.customerId)
        .subscribe({
          next: (product: ShowSpecificProduct1) => {
            if (product) {
              const modifiedProduct = {
                ...product,
                image: Array.isArray(product.imageUrls)
                  ? product.imageUrls[0] || 'https://fakeimg.pl/300/'
                  : product.imageUrls || 'https://fakeimg.pl/300/',
              };
              productDetails.push(modifiedProduct);
            }
            detailsFetched++;
            if (detailsFetched === productIds.length) {
              this.recommendedProducts.set(productDetails);
              this.recommendationsLoading.set(false);
            }
          },
          error: (err) => {
            console.error(
              'Error fetching product details for ID:',
              prodId,
              err
            );
            detailsFetched++;
            if (detailsFetched === productIds.length) {
              this.recommendedProducts.set(productDetails);
              this.recommendationsLoading.set(false);
            }
          },
        });
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.calculateSlideWidth();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.calculateSlideWidth();
    }, 0);
  }

  calculateSlideWidth() {
    if (this.carouselContainer && this.carouselContainer.nativeElement) {
      const containerWidth =
        this.carouselContainer.nativeElement.parentElement.clientWidth;
      this.updateVisibleSlides(containerWidth);
      this.slideWidth = Math.floor(
        ((containerWidth - (this.visibleSlides - 1) * this.slideGap) /
          this.visibleSlides) *
          0.94
      );

      setTimeout(() => {
        const newMaxIndex = Math.max(
          0,
          this.popularProducts.length - this.visibleSlides
        );
        if (this.currentIndex() > newMaxIndex) {
          this.currentIndex.set(newMaxIndex);
        }
      }, 0);
    }
  }

  updateVisibleSlides(containerWidth: number) {
    if (containerWidth < 640) {
      this.visibleSlides = 2;
    } else if (containerWidth < 1024) {
      this.visibleSlides = 3;
    } else {
      this.visibleSlides = 4;
    }
  }

  nextSlide() {
    if (this.currentIndex() < this.maxIndex()) {
      this.currentIndex.update((current) => current + 1);
    }
  }

  prevSlide() {
    if (this.currentIndex() > 0) {
      this.currentIndex.update((current) => current - 1);
    }
  }

  prevLandingSlide() {
    this.currentIndexLanding =
      this.currentIndexLanding === 0
        ? this.images.length - 1
        : this.currentIndexLanding - 1;
  }

  nextLandingSlide() {
    this.currentIndexLanding =
      (this.currentIndexLanding + 1) % this.images.length;
  }

  loadHighFeedbackProducts(): void {
    this.loading.set(true);
    this.customerService.ShowHighFeedbackProduct().subscribe({
      next: (products: ShowHighFeedbackProduct[]) => {
        this.popularProducts = products.map((product) => ({
          ...product,
          imageUrl: product.imageUrl.startsWith('//')
            ? `https:${product.imageUrl}`
            : product.imageUrl,
        }));
        this.loading.set(false);
        setTimeout(() => {
          this.calculateSlideWidth();
        }, 0);
      },
      error: (err) => {
        this.errorMessage =
          err.error?.message || 'Failed to load high feedback products';
        this.loading.set(false);
        this.popularProducts = [];
        console.error('Error fetching high feedback products:', err);
      },
    });
  }

  loadRandomProducts(): void {
    this.loading.set(true);
    this.customerService.ShowRandomProduct().subscribe({
      next: (products: showRandomProduct[]) => {
        this.randomProducts = products.map((product) => ({
          ...product,
          imageUrl: product.imageUrl.startsWith('//')
            ? `https:${product.imageUrl}`
            : product.imageUrl,
        }));
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage =
          err.error?.message || 'Failed to load random products';
        this.loading.set(false);
        this.randomProducts = [];
        console.error('Error fetching random products:', err);
      },
    });
  }

  // Toggle product in wishlist
  toggleWishlist(productId: number): void {
    if (!this._UserAuthService.isUserLogin.getValue()) {
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
            this.getCustomerId(),
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

  isInWishlist(productId: number): boolean {
    return this.customerService
      .getWishlist()()
      .some(
        (item: { productId: number; favId: number }) =>
          item.productId === productId
      );
  }

  private getCustomerId(): string {
    const token = localStorage.getItem('token') || '';
    if (token) {
      const decodedToken: any = jwtDecode(token);
      return decodedToken.ID;
    }
    return '';
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'https://fakeimg.pl/300/'; // Fallback image
  }
}
