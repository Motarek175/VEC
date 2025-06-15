import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerService } from '../../../Core/services/customer.service';
import { UserAuthService } from '../../../Core/services/user-auth.service';
import { jwtDecode } from 'jwt-decode';
import Swal from 'sweetalert2';
import {
  showAllCart,
  showAllFav,
} from '../../../Core/interfaces/customer-interfaces';
import { Subscription } from 'rxjs';
import { TrackingService } from '../../../Core/services/tracking.service';

interface CartItem {
  id: number;
  productId: number;
  name: string;
  description: string;
  productPrice: number;
  quantity: number;
  color: string;
  size: string;
  image: string;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
})
export class CartComponent implements OnInit {
  errorMessage = signal<string>('');
  loading = signal<boolean>(true);
  cartItems = signal<CartItem[]>([]);
  shippingCost = 10.0; // Default shipping cost
  wishlist = signal<{ productId: number; favId: number }[]>([]);
  customerId: string = '';
  customerPersonName: string = '';
  decodedToken: any;
  prodId: any;
  private loginSubscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private customerService: CustomerService,
    private userAuthService: UserAuthService,
    private router: Router,
    private TrackingService: TrackingService
  ) {}

  ngOnInit(): void {
    if (!this.userAuthService.isUserLogin.value) {
      Swal.fire({
        icon: 'info',
        title: 'Not Logged In',
        text: 'You need to log in to view your cart. Would you like to log in now?',
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
    }
    const token = localStorage.getItem('token') || '';
    if (token) {
      this.decodedToken = jwtDecode(token);
      this.customerPersonName = this.decodedToken.Name;
      this.customerId = this.decodedToken.ID;
      this.loadCart();
      this.wishlist.set(this.customerService.getWishlist()());
      this.loginSubscription = this.userAuthService.isUserLogin.subscribe(
        (isLoggedIn) => {
          if (isLoggedIn && this.customerId) {
            this.customerService.loadCartItems(this.customerId);
          }
        }
      );
    } else {
      this.customerId = '';
      this.customerPersonName = '';
    }
  }

  private getCustomerId(): string {
    const token = localStorage.getItem('token') || '';
    if (token) {
      const decodedToken: any = jwtDecode(token);
      return decodedToken.ID;
    }
    return '';
  }

  removeFromCart(cartId: number): void {
    Swal.fire({
      icon: 'warning',
      title: 'Remove Item?',
      text: 'Are you sure you want to remove this item from your cart?',
      showCancelButton: true,
      confirmButtonText: 'Yes, Remove',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        const currentUrl = this.router.url;
        localStorage.setItem('returnUrl', currentUrl);
        this.loading.set(true);
        this.getProductId(cartId);
        this.customerService.deleteCart(cartId).subscribe({
          next: () => {
            this.loadCart();
            Swal.fire({
              icon: 'success',
              title: 'Removed',
              text: 'Item removed from cart successfully!',
              timer: 1500,
              showConfirmButton: false,
            });
            this.getProductId(cartId);
            const currentUrl = this.router.url;
            this.router
              .navigateByUrl('/', { skipLocationChange: true })
              .then(() => {
                this.router.navigate([currentUrl]);
              });
          },
          error: (err) => {
            this.errorMessage.set('Failed to remove item from cart.');
            this.loading.set(false);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to remove item from cart.',
            });
          },
        });
      }
    });
  }

  toggleWishlist(prodId: number): void {
    if (this.userAuthService.isUserLogin.getValue()) {
      const productId = prodId;
      if (this.isInWishlist(productId)) {
        this.customerService.showAllFav(this.customerId).subscribe({
          next: (favorites: showAllFav[]) => {
            const favorite = favorites.find(
              (fav) => fav.productId === productId
            );
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
                this.customerService.removeFromWishlist(productId);
                this.TrackingService.trackEvent(
                  this.getCustomerId(),
                  productId,
                  'remove_from_wishlist'
                );
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
        this.customerService.AddToFav(this.customerId, productId).subscribe({
          next: (response: any) => {
            const favId = response.productId || Date.now();
            this.customerService.addToWishlist({ productId, favId });
            this.wishlist.update((items) => [...items, { productId, favId }]);
            this.TrackingService.trackEvent(
              this.getCustomerId(),
              productId,
              'add_to_wishlist'
            );
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
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Please Log In First',
        text: 'You must log in first to add products to your wishlist.',
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

  loadCart(): void {
    this.loading.set(true);
    const customerId = this.getCustomerId();
    if (!customerId) {
      this.errorMessage.set('Unable to fetch customer ID.');
      this.loading.set(false);
      return;
    }

    this.customerService.ShowAllCarts(customerId).subscribe({
      next: (response: showAllCart) => {
        const items = this.mapCartResponse(response);
        this.cartItems.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        if (err.status === 404) {
          this.cartItems.set([]);
          this.errorMessage.set('');
        } else {
          this.errorMessage.set('Failed to load cart.');
        }
        this.loading.set(false);
      },
    });
  }

  updateQuantity(cartId: number, quantity: number): void {
    if (quantity < 1) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Quantity',
        text: 'Quantity cannot be less than 1.',
      });
      return;
    }

    this.loading.set(true);
    this.customerService.updateQuantity(cartId, quantity).subscribe({
      next: () => {
        this.loadCart();
        Swal.fire({
          icon: 'success',
          title: 'Quantity Updated',
          text: 'Cart quantity updated successfully!',
          timer: 1500,
          showConfirmButton: false,
        });
      },
      error: (err) => {
        this.errorMessage.set('Failed to update quantity.');
        this.loading.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update quantity.',
        });
      },
    });
  }

  getTotalPrice(): number {
    return this.cartItems().reduce((sum, item) => {
      const price =
        typeof item.productPrice === 'number' ? item.productPrice : 0;
      const qty = typeof item.quantity === 'number' ? item.quantity : 0;
      return sum + price * qty;
    }, 0);
  }

  checkout(): void {
    if (this.cartItems().length > 0) {
      const orderData = {
        items: this.cartItems().map((item) => ({
          id: item.id,
          image: item.image,
          name: item.name,
          color: item.color,
          size: item.size,
          price: item.productPrice,
          quantity: item.quantity,
        })),
        summary: {
          subtotal: this.getTotalPrice(),
          shippingCost: this.isShippingFree() ? 0 : this.shippingCost,
          total:
            this.getTotalPrice() +
            (this.isShippingFree() ? 0 : this.shippingCost),
        },
      };

      // Save to localStorage
      localStorage.setItem('checkoutData', JSON.stringify(orderData));

      // Navigate to billing page
      this.router.navigate(['/billing']);
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Empty Cart',
        text: 'Your cart is empty. Add items before checking out.',
        confirmButtonText: 'OK',
      });
    }
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'https://fakeimg.pl/300/';
  }

  private mapCartResponse(response: showAllCart): CartItem[] {
    const items: CartItem[] = [];
    const length = response.productIds?.length || 0;
    for (let i = 0; i < length; i++) {
      items.push({
        id: response.id?.[i] ?? 0,
        productId: response.productIds?.[i] ?? 0,
        name: response.productsNames?.[i] ?? 'Unknown Product',
        description: response.productDescribtions?.[i] ?? 'No description',
        productPrice: response.productPrice?.[i] ?? 0,
        quantity: response.quantity?.[i] ?? 0,
        color: response.color?.[i] ?? 'N/A',
        size: response.size?.[i] ?? 'N/A',
        image: response.image?.[i]
          ? response.image[i].startsWith('//')
            ? `https:${response.image[i]}`
            : response.image[i]
          : 'https://fakeimg.pl/300/',
      });
    }
    return items;
  }

  isShippingFree(): boolean {
    return this.getTotalPrice() >= 50;
  }

  getProductId(cartId: any) {
    const custId = this.getCustomerId();
    this.customerService.ShowAllCarts(custId).subscribe({
      next: (response) => {
        for (const id of response.id) {
          let i = 0;
          if (id === cartId) {
            this.prodId = response.productIds[i];
            this.TrackingService.trackEvent(
              this.getCustomerId(),
              this.prodId,
              'remove_from_cart'
            );
          }
        }
      },
    });
  }
}
