import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CustomerService } from '../../../Core/services/customer.service';
import { UserAuthService } from '../../../Core/services/user-auth.service';
import { TrackingService } from '../../../Core/services/tracking.service';
import {
  showAllFav,
  ShowSpecificProduct,
} from '../../../Core/interfaces/customer-interfaces';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css',
})
export class WishlistComponent implements OnInit {
  wishlistItems = signal<showAllFav[]>([]);
  recommendedProducts = signal<ShowSpecificProduct[]>([]);
  loading = signal<boolean>(true);
  recommendationsLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  private loginSubscription: Subscription | null = null;
  customerId: string = '';
  decodedToken: any;

  constructor(
    private customerService: CustomerService,
    private userAuthService: UserAuthService,
    private trackingService: TrackingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.userAuthService.isUserLogin.value) {
      Swal.fire({
        icon: 'warning',
        title: 'Please login first',
        text: 'You need to be logged in to view your wishlist.',
        confirmButtonText: 'Go to Login',
        showCancelButton: true,
        cancelButtonText: 'Cancel',
      }).then((result) => {
        if (result.isConfirmed) {
          const currentUrl = this.router.url;
          localStorage.setItem('returnUrl', currentUrl);
          this.router.navigate(['/login']);
        } else {
          this.router.navigate(['/']);
        }
      });
    }

    this.loadWishlist();
  }

  private getCustomerId(): string {
    const token = localStorage.getItem('token') || '';
    if (token) {
      const decodedToken: any = jwtDecode(token);
      return decodedToken.ID;
    }
    return '';
  }

  loadWishlist(): void {
    this.loading.set(true);
    const customerId = this.getCustomerId();
    if (!customerId) {
      this.errorMessage.set('Unable to fetch customer ID.');
      this.loading.set(false);
      return;
    }

    this.customerService.showAllFav(customerId).subscribe({
      next: (items: showAllFav[]) => {
        this.wishlistItems.set(items);
        this.loading.set(false);
        this.loadRecommendations();
      },
      error: (err) => {
        if (err.status === 404) {
          this.wishlistItems.set([]);
          this.errorMessage.set('');
        }
        this.loading.set(false);
      },
    });
  }

  loadRecommendations(): void {
    const items = this.wishlistItems();
    if (items.length === 0) {
      this.recommendedProducts.set([]);
      return;
    }

    this.recommendationsLoading.set(true);

    const itemsToProcess = items.slice(0, 4);
    const totalItems = itemsToProcess.length;
    let topN: number;

    if (totalItems === 1) {
      topN = 4;
    } else if (totalItems === 2) {
      topN = 2;
    } else {
      topN = 1;
    }

    const tempRecommendations: { productId: number; score: number }[] = [];
    let requestsCompleted = 0;

    itemsToProcess.forEach((item, index) => {
      this.customerService.RecommendProduct(item.productId, topN).subscribe({
        next: (response: { recommendations: [number, number][] }) => {
          const recommended = response.recommendations.map(
            ([productId, score]) => ({
              productId,
              score,
            })
          );
          tempRecommendations.push(...recommended);
          requestsCompleted++;
          if (requestsCompleted === totalItems) {
            if (totalItems === 3) {
              this.customerService
                .RecommendProduct(itemsToProcess[0].productId, 1)
                .subscribe({
                  next: (extraResponse: {
                    recommendations: [number, number][];
                  }) => {
                    const extraRecommended = extraResponse.recommendations.map(
                      ([productId, score]) => ({
                        productId,
                        score,
                      })
                    );
                    tempRecommendations.push(...extraRecommended);
                    this.fetchProductDetails(tempRecommendations);
                  },
                  error: (err) => {
                    this.fetchProductDetails(tempRecommendations);
                  },
                });
            } else {
              this.fetchProductDetails(tempRecommendations);
            }
          }
        },
        error: (err) => {
          console.error(
            'Error fetching recommendations for product:',
            item.productId,
            err
          );
          requestsCompleted++;
          if (requestsCompleted === totalItems) {
            this.fetchProductDetails(tempRecommendations);
          }
        },
      });
    });
  }

  fetchProductDetails(
    recommendations: { productId: number; score: number }[]
  ): void {
    const productDetails: ShowSpecificProduct[] = [];
    let detailsFetched = 0;

    if (recommendations.length === 0) {
      this.recommendedProducts.set([]);
      this.recommendationsLoading.set(false);
      return;
    }

    recommendations.slice(0, 4).forEach((rec) => {
      this.customerService
        .showSpecifiProduct(rec.productId, this.getCustomerId())
        .subscribe({
          next: (product: ShowSpecificProduct) => {
            if (product) {
              productDetails.push(product);
            }
            detailsFetched++;

            if (detailsFetched === recommendations.slice(0, 4).length) {
              this.recommendedProducts.set(productDetails);
              this.recommendationsLoading.set(false);
            }
          },
          error: (err) => {
            console.error(
              'Error fetching product details for ID:',
              rec.productId,
              err
            );
            detailsFetched++;
            if (detailsFetched === recommendations.slice(0, 4).length) {
              this.recommendedProducts.set(productDetails);
              this.recommendationsLoading.set(false);
            }
          },
        });
    });
  }

  removeFromWishlist(productId: number): void {
    const favId = this.wishlistItems().find(
      (item) => item.productId === productId
    )?.id;

    if (!favId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Product not found in wishlist.',
      });
      return;
    }

    this.customerService.DeleteFromFav(favId).subscribe({
      next: () => {
        this.wishlistItems.update((items) =>
          items.filter((item) => item.productId !== productId)
        );
        this.trackingService.trackEvent(
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
        //this.loadRecommendations();
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
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = target.src.startsWith('//')
      ? `https:${target.src}`
      : 'https://fakeimg.pl/300/';
  }
}
