import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerService } from '../../../Core/services/customer.service';
import {
  showAllFav,
  ShowSpecificProduct,
  AddCommentRequest,
  showsizeImageforColor,
  addToCart,
  showAllProducts,
} from '../../../Core/interfaces/customer-interfaces';
import { TrackingService } from '../../../Core/services/tracking.service';
import { FormsModule } from '@angular/forms';
import { UserAuthService } from '../../../Core/services/user-auth.service';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode';
import { catchError } from 'rxjs/operators';
import { Subscription, throwError } from 'rxjs';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css',
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  product: ShowSpecificProduct | null = null;
  loading = false;
  loadingRelatedProducts = false;
  newComment = '';
  selectedImage: string = '';
  selectedColor: string | null = null;
  selectedColorId: number | null = null;
  selectedSize: string | null = null;
  prodImages: string[] = [];
  availableSizes: string[] = [];
  availableSizeIds: number[] = [];
  wishlist = signal<{ productId: number; favId: number }[]>([]);
  relatedProducts = signal<showAllProducts[]>([]);
  customerPersonName: string = '';
  customerId: string = '';
  decodedToken: any;
  userName: string[] = [];
  selectedStarRating: number = 0;
  hoverStarRatingValue: number = 0;
  newCommentData: AddCommentRequest | null = null;
  isCommentProcessing: boolean = false;
  private loginSubscription: Subscription | null = null;
  private routeSubscription: Subscription | null = null;
  sentiment: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private customerService: CustomerService,
    private trackingService: TrackingService,
    public UserAuthService: UserAuthService,
    private router: Router
  ) {}

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
    // Subscribe to route param changes
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      const prodId = +params.get('prodId')!;
      if (prodId) {
        this.loadProductDetails(prodId, this.customerId);
        this.loadPendingComment(prodId);
        this.trackingService.trackEvent(this.getCustomerId(), prodId, 'view');
      }
    });

    this.customerService.retryPendingComments();
    this.loginSubscription = this.UserAuthService.isUserLogin.subscribe(
      (isLoggedIn) => {
        if (isLoggedIn && this.customerId) {
          this.customerService.loadCartItems(this.customerId);
        }
      }
    );
  }

  ngOnDestroy(): void {
    if (this.loginSubscription) {
      this.loginSubscription.unsubscribe();
    }
  }

  loadPendingComment(prodId: number): void {
    const key = `pendingComment_${prodId}_${this.customerId}`;
    const storedComment = localStorage.getItem(key);
    if (storedComment) {
      this.newCommentData = JSON.parse(storedComment) as AddCommentRequest;
    }
  }

  savePendingComment(commentData: AddCommentRequest): void {
    const key = `pendingComment_${commentData.productId}_${this.customerId}`;
    localStorage.setItem(key, JSON.stringify(commentData));
  }

  clearPendingComment(prodId: number): void {
    const key = `pendingComment_${prodId}_${this.customerId}`;
    localStorage.removeItem(key);
  }

  loadProductDetails(prodId: number, custId: string): void {
    this.loading = true;
    this.customerService.showSpecifiProduct(prodId, custId).subscribe({
      next: (prod) => {
        this.userName = prod.userName || [];
        this.product = prod || null;
        this.prodImages = (prod.imageUrls || []).map((url) =>
          url.startsWith('//') ? `https:${url}` : url
        );
        this.availableSizes = [];
        this.availableSizeIds = [];
        this.selectedImage = this.prodImages[0] || 'https://fakeimg.pl/300/';
        this.selectedStarRating = prod.personStar
          ? Math.round(prod.personStar)
          : 0;
        this.loading = false;
        if (prod.color?.length && prod.colorId?.length) {
          this.selectColor(prod.color[0], prod.colorId[0]);
        }
        this.sentiment = [];
        const commentRates = prod.commentRate || [];
        for (let i = 0; i < commentRates.length; i++) {
          const rate = commentRates[i];
          if (rate >= 4) {
            this.sentiment.push('happy');
          } else if (rate === 3) {
            this.sentiment.push('normal');
          } else if (rate === 2) {
            this.sentiment.push('sad');
          } else {
            this.sentiment.push('angry');
          }
        }
        this.loadRelatedProduct(this.product.categoriesId);
      },
      error: (err) => {
        console.error('Error fetching product details:', err);
        this.product = null;
        this.loading = false;
      },
    });
  }

  getGradientColor(colorString: string): string {
    if (!colorString.includes('&')) {
      return colorString;
    }
    const colors = colorString.split('&').map((c) => c.trim());
    const count = colors.length;
    const percentage = 100 / count;

    const gradient = colors
      .map(
        (color, index) =>
          `${color} ${index * percentage}%, ${color} ${
            (index + 1) * percentage
          }%`
      )
      .join(', ');
    return `linear-gradient(to right, ${gradient})`;
  }

  getMixedColor(colorString: string): string {
    if (!colorString.includes('&')) {
      return colorString; // إذا كان لونًا واحدًا، ارجع القيمة كما هي
    }
    const colors = colorString.split('&').map((c) => c.trim());
    if (colors.length === 1) return colors[0];

    // حساب متوسط القيم RGB
    let r = 0,
      g = 0,
      b = 0;
    colors.forEach((color) => {
      const hex = color.replace('#', '');
      r += parseInt(hex.substr(0, 2), 16);
      g += parseInt(hex.substr(2, 2), 16);
      b += parseInt(hex.substr(4, 2), 16);
    });
    r = Math.round(r / colors.length);
    g = Math.round(g / colors.length);
    b = Math.round(b / colors.length);
    return `#${r.toString(16).padStart(2, '0')}${g
      .toString(16)
      .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  loadRelatedProduct(catId: number): void {
    this.loadingRelatedProducts = true;
    this.customerService.ShowProductByCategory(catId).subscribe({
      next: (products: any[]) => {
        // Map API response to match showAllProducts interface
        const mappedProducts = products
          .map((product) => ({
            id: product.id,
            title: product.title,
            categoryName: product.category,
            status: product.status,
            unitPrice: product.unitPrice,
            discount: product.discount,
            sellPrice: product.sellPrice,
            image: product.imageUrl?.startsWith('//')
              ? `https:${product.imageUrl}`
              : product.imageUrl || 'https://fakeimg.pl/300/',
          }))
          .slice(0, 4) as showAllProducts[]; // Limit to 4 products
        this.relatedProducts.set(mappedProducts);
        this.loadingRelatedProducts = false;
      },
      error: (err) => {
        console.error('Error fetching related products:', err);
        this.relatedProducts.set([]);
        this.loadingRelatedProducts = false;
      },
    });
  }

  selectImage(img: string): void {
    this.selectedImage = img;
  }

  selectColor(color: string, colorId: number): void {
    if (this.selectedColor === color && this.selectedColorId === colorId) {
      return;
    }
    this.selectedColor = color;
    this.selectedColorId = colorId;
    this.loading = true;
    this.customerService
      .showsizeImageforColor(this.product!.id, colorId)
      .subscribe({
        next: (response: showsizeImageforColor) => {
          this.prodImages = (response.images || []).map((url) =>
            url.startsWith('//') ? `https:${url}` : url
          );
          this.selectedImage = this.prodImages[0] || 'https://fakeimg.pl/300/';
          this.availableSizes = response.sizes || [];
          this.availableSizeIds = response.sizeId || [];
          if (
            this.selectedSize &&
            !this.availableSizes.includes(this.selectedSize)
          ) {
            this.selectedSize = null;
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error fetching images and sizes for color:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load images and sizes for the selected color.',
          });
          this.prodImages = (this.product?.imageUrls || []).map((url) =>
            url.startsWith('//') ? `https:${url}` : url
          );
          this.availableSizes = [];
          this.availableSizeIds = [];
          this.selectedImage = this.prodImages[0] || 'https://fakeimg.pl/300/';
          this.selectedSize = null;
          this.loading = false;
        },
      });
  }

  selectSize(size: string): void {
    this.selectedSize = this.selectedSize === size ? null : size;
  }

  roundStar(value?: number): number {
    return value ? Math.round(value) : 0;
  }

  hoverStarRating(rating: number): void {
    this.hoverStarRatingValue = rating;
  }

  resetHoverStarRating(): void {
    this.hoverStarRatingValue = 0;
  }

  selectStarRating(rating: number): void {
    if (!this.UserAuthService.isUserLogin.getValue()) {
      Swal.fire({
        icon: 'warning',
        title: 'Please Log In First',
        text: 'You must log in first to rate this product.',
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
    const prodId = this.product?.id;
    if (prodId) {
      this.customerService.checkBuying(this.customerId, prodId).subscribe({
        next: (response: any) => {
          if (!response.buyIt) {
            Swal.fire({
              icon: 'warning',
              title: 'Cannot Rate',
              text: 'You must purchase and receive the product before rating.',
            });
            this.selectedStarRating = 0;
            return;
          }
          this.selectedStarRating = rating;
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to verify purchase status.',
          });
          console.error('Error checking purchase:', err);
        },
      });
    }
  }

  toggleWishlist(): void {
    if (this.UserAuthService.isUserLogin.getValue()) {
      const productId = +this.route.snapshot.paramMap.get('prodId')!;
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
            const favId = response?.id || Date.now();
            this.customerService.addToWishlist({ productId, favId });
            this.wishlist.update((items) => [...items, { productId, favId }]);
            this.trackingService.trackEvent(
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

  toggleWishlistRelated(productId: number): void {
    if (!this.UserAuthService.isUserLogin.getValue()) {
      Swal.fire({
        icon: 'warning',
        title: 'Please Log In First',
        text: 'You must log in to add products to your wishlist.',
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
            this.trackingService.trackEvent(
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
      this.customerService.AddToFav(this.customerId, productId).subscribe({
        next: (response: any) => {
          const favId = response?.id || Date.now();
          this.trackingService.trackEvent(
            this.customerId,
            productId,
            'add_to_wishlist'
          );
          this.customerService.addToWishlist({ productId, favId });
          this.wishlist.update((items) => [...items, { productId, favId }]);
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

  isInCart(
    productId: number,
    colorId: number | null,
    sizeId: number | null
  ): boolean {
    if (!colorId || !sizeId) return false;
    return this.customerService
      .getCartItems()()
      .some(
        (item: {
          productId: number;
          cartId: number;
          colorId: number;
          sizeId: number;
        }) =>
          item.productId === productId &&
          item.colorId === colorId &&
          item.sizeId === sizeId
      );
  }

  toggleCart(): void {
    if (!this.UserAuthService.isUserLogin.getValue()) {
      Swal.fire({
        icon: 'warning',
        title: 'Please Log In First',
        text: 'You must log in to manage your cart.',
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

    const prodId = this.product?.id;
    if (!prodId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Product not found.',
      });
      return;
    }

    if (!this.selectedColorId) {
      Swal.fire({
        icon: 'warning',
        title: 'Select Color',
        text: 'Please select a color before adding to cart.',
      });
      return;
    }

    if (!this.selectedSize) {
      Swal.fire({
        icon: 'warning',
        title: 'Select Size',
        text: 'Please select a size before adding to cart.',
      });
      return;
    }

    const sizeIndex = this.availableSizes.indexOf(this.selectedSize);
    if (sizeIndex === -1) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Invalid size selected.',
      });
      return;
    }
    const sizeId = this.availableSizeIds[sizeIndex];

    // Add to cart
    const cartData: addToCart = {
      productId: prodId,
      colorId: this.selectedColorId,
      sizeId: sizeId,
      customerId: this.customerId,
    };

    this.loading = true;
    this.customerService.addToCart(cartData).subscribe({
      next: (response: any) => {
        const cartId = response?.id || Date.now();
        this.customerService.addToCartItems({
          productId: prodId,
          cartId,
          colorId: this.selectedColorId!,
          sizeId,
        });
        this.loading = false;
        this.trackingService.trackEvent(
          this.getCustomerId(),
          prodId,
          'add_to_cart'
        );
        Swal.fire({
          icon: 'success',
          title: 'Added',
          text: 'Product added to cart successfully!',
          timer: 1500,
          showConfirmButton: false,
        });
      },
      error: (err) => {
        this.loading = false;
        if (
          err.error?.message
            ?.toLowerCase()
            .includes('item exist before inside cart')
        ) {
          this.customerService.loadCartItems(this.customerId);
          Swal.fire({
            icon: 'info',
            title: 'Already in Cart',
            text: 'This product configuration is already in your cart, please remove it first from Cart ',
            showConfirmButton: true,
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error?.message || 'Failed to add product to cart.',
          });
          console.error('Error adding to cart:', err);
        }
      },
    });
  }

  tryIt(): void {
    if (!this.UserAuthService.isUserLogin.getValue()) {
      Swal.fire({
        icon: 'warning',
        title: 'Please Log In First',
        text: 'You must log in first to try the product.',
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
    const prodId = this.product?.id;
    if (!prodId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Product not found.',
      });
      return;
    }
    if (!this.selectedColor) {
      Swal.fire({
        icon: 'warning',
        title: 'Select Color',
        text: 'Please select a color before trying the product.',
      });
      return;
    }
    const tryItData = {
      type: this.product?.type || '',
      color: this.selectedColor,
      image: this.selectedImage || 'https://fakeimg.pl/300/',
    };
    localStorage.setItem('tryItProduct', JSON.stringify(tryItData));
    this.router.navigate(['/try']);
  }

  submitComment(): void {
    if (!this.newComment.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Empty Comment',
        text: 'Please enter a comment before submitting.',
      });
      return;
    }
    if (!this.selectedStarRating) {
      Swal.fire({
        icon: 'warning',
        title: 'No Rating Selected',
        text: 'Please select a star rating by clicking on the stars above.',
      });
      return;
    }
    if (!this.UserAuthService.isUserLogin.getValue()) {
      Swal.fire({
        icon: 'warning',
        title: 'Please Log In First',
        text: 'You must log in first to add a comment.',
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
    const prodId = this.product?.id;
    if (prodId) {
      this.customerService
        .checkBuying(this.customerId, prodId)
        .pipe(
          catchError((error) => {
            if (error.status === 404 && error.error && 'buyIt' in error.error) {
              return throwError(error.error);
            }
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to connect to the server.',
            });
            console.error('Critical error checking purchase:', error);
            return throwError(error);
          })
        )
        .subscribe({
          next: (response: any) => {
            if (!response.buyIt) {
              Swal.fire({
                icon: 'warning',
                title: 'Cannot Comment',
                text: 'You must purchase and receive the product before commenting.',
              });
              return;
            }
            Swal.fire({
              icon: 'info',
              title: 'Processing Comment',
              text: 'Your comment is being analyzed and will be saved shortly.',
              showConfirmButton: false,
              timer: 2000,
            });
            this.newCommentData = {
              productId: prodId,
              customerId: this.customerId,
              star: this.selectedStarRating,
              originalComment: this.newComment,
              translateComment: this.newComment,
              commentRate: this.selectedStarRating,
            };
            this.savePendingComment(this.newCommentData);
            this.isCommentProcessing = true;
            this.customerService.processComment(this.newCommentData).subscribe({
              next: () => {
                this.newCommentData = null;
                this.newComment = '';
                this.selectedStarRating = this.product?.personStar
                  ? Math.round(this.product.personStar)
                  : 0;
                this.isCommentProcessing = false;
                this.loadProductDetails(prodId, this.customerId);
              },
              error: (err) => {
                console.error('Error processing comment:', err);
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: err.error.error,
                }).then(() => {
                  this.isCommentProcessing = false;
                  this.deleteNewComment();
                });
              },
            });
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to verify purchase status.',
            });
            console.error('Unexpected error:', err);
          },
        });
    }
  }

  deleteComment(prodId: number, comment: string, index: number): void {
    if (!this.UserAuthService.isUserLogin.getValue()) {
      Swal.fire({
        icon: 'warning',
        title: 'Please Log In',
        text: 'You must be logged in to delete a comment.',
        confirmButtonText: 'Go to Login',
        showCancelButton: true,
      }).then((result) => {
        if (result.isConfirmed) {
          const currentUrl = this.router.url;
          localStorage.setItem('returnUrl', currentUrl);
          this.router.navigate(['/login']);
        }
      });
      return;
    }
    Swal.fire({
      icon: 'warning',
      title: 'Are you sure?',
      text: 'Do you want to delete this comment?',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.customerService
          .deleteComment(this.customerId, prodId, comment)
          .subscribe({
            next: (response) => {
              Swal.fire({
                icon: 'success',
                title: 'Deleted',
                text: 'Comment deleted successfully!',
                timer: 1500,
                showConfirmButton: false,
              });
              this.loadProductDetails(prodId, this.customerId);
              this.loading = false;
            },
            error: (err) => {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.error.message || 'Failed to delete comment.',
              });
              this.loading = false;
              console.error('Error deleting comment:', err);
            },
          });
      }
    });
  }

  deleteNewComment(): void {
    if (!this.UserAuthService.isUserLogin.getValue()) {
      Swal.fire({
        icon: 'warning',
        title: 'Please Log In',
        text: 'You must be logged in to delete a comment.',
        confirmButtonText: 'Go to Login',
        showCancelButton: true,
      }).then((result) => {
        if (result.isConfirmed) {
          const currentUrl = this.router.url;
          localStorage.setItem('returnUrl', currentUrl);
          this.router.navigate(['/login']);
        }
      });
      return;
    }
    const prodId = this.newCommentData?.productId;
    if (prodId) {
      this.clearPendingComment(prodId);
      this.newCommentData = null;
      Swal.fire({
        icon: 'success',
        title: 'Deleted',
        text: 'Comment deleted successfully!',
        timer: 1500,
        showConfirmButton: false,
      });
    }
  }

  averageRating(): any {
    return this.product?.averageStar;
  }

  onCommentChange(): void {}

  onImageError(img?: string): void {
    console.warn('Image failed to load:', img);
    if (!this.selectedImage || this.selectedImage === img) {
      this.selectedImage = 'https://fakeimg.pl/300/';
    }
    if (img) {
      this.prodImages = this.prodImages.filter((i) => i !== img);
      this.relatedProducts.update((products) =>
        products.map((p) =>
          p.image === img ? { ...p, image: 'https://fakeimg.pl/300/' } : p
        )
      );
    }
  }

  trackByProductId(index: number, product: showAllProducts): number {
    return product.id;
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
