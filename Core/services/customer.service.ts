import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable, switchMap } from 'rxjs';
import {
  AddCommentRequest,
  addOrder,
  addToCart,
  CustomerOrder,
  OrderDetail,
  showAllCart,
  showAllFav,
  showAllProducts,
  ShowHighFeedbackProduct,
  showRandomProduct,
  showsizeImageforColor,
  ShowSpecificProduct,
} from '../interfaces/customer-interfaces';
import { UserAuthService } from './user-auth.service'; // Add this import
import { jwtDecode } from 'jwt-decode'; // Add this import

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private apiUrl: string = 'https://aston.runasp.net/api/';
  private wishlistState = signal<{ productId: number; favId: number }[]>([]);
  private customerId: string = '';
  private cartItems = signal<
    { productId: number; cartId: number; colorId: number; sizeId: number }[]
  >([]);

  constructor(
    private _HttpClient: HttpClient,
    private userAuthService: UserAuthService // Inject UserAuthService
  ) {
    this.userAuthService.isUserLogin.subscribe((isLoggedIn) => {
      if (isLoggedIn) {
        const token = localStorage.getItem('token') || '';
        if (token) {
          const decodedToken: any = jwtDecode(token);
          this.customerId = decodedToken.ID;
          this.loadWishlistFromBackend();
          this.loadCartItems(this.customerId);
        }
      } else {
        this.customerId = '';
        this.clearWishlist();
      }
    });
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  showAllProduct(): Observable<showAllProducts[]> {
    return this._HttpClient.get<showAllProducts[]>(
      `${this.apiUrl}Product/ShowAllProducts`
    );
  }

  ShowHighFeedbackProduct(): Observable<ShowHighFeedbackProduct[]> {
    return this._HttpClient.get<ShowHighFeedbackProduct[]>(
      `${this.apiUrl}Product/ShowHighFeedbackProduct?count=6`
    );
  }

  ShowRandomProduct(): Observable<showRandomProduct[]> {
    return this._HttpClient.get<showRandomProduct[]>(
      `${this.apiUrl}Product/ShowRandomProduct?count=8`
    );
  }

  showSpecifiProduct(
    prodId: number,
    customerId: string
  ): Observable<ShowSpecificProduct> {
    return this._HttpClient.get<ShowSpecificProduct>(
      `https://aston.runasp.net/api/Product/ShowSpecificProduct?id=${prodId}&customerId=${customerId}`
    );
  }

  ShowProductByMerchantId(merchant: string): Observable<any> {
    return this._HttpClient.get(
      `${this.apiUrl}Product/ShowProductByMerchantId?merchantId=${merchant}`
    );
  }

  ShowProductByCategory(categoryId: number): Observable<any> {
    return this._HttpClient.get(
      `${this.apiUrl}Product/ShowProductByCategory?categoryId=${categoryId}&count=4`
    );
  }

  // start wishlist
  private loadWishlistFromBackend(): void {
    if (!this.customerId) return;
    this.showAllFav(this.customerId).subscribe({
      next: (favorites: { id: number; productId: number }[]) => {
        const wishlistItems = favorites.map((fav) => ({
          productId: fav.productId,
          favId: fav.id,
        }));
        this.setWishlist(wishlistItems);
      },
      error: (err) => {
        console.error('Error fetching wishlist:', err);
        this.clearWishlist();
      },
    });
  }

  getWishlist() {
    return this.wishlistState.asReadonly();
  }

  setWishlist(wishlist: { productId: number; favId: number }[]) {
    this.wishlistState.set(wishlist);
  }

  addToWishlist(item: { productId: number; favId: number }) {
    this.wishlistState.set([...this.wishlistState(), item]);
  }

  removeFromWishlist(productId: number) {
    this.wishlistState.set(
      this.wishlistState().filter((item) => item.productId !== productId)
    );
  }

  clearWishlist() {
    this.wishlistState.set([]);
  }

  AddToFav(cusId: string, ProdID: number): Observable<any> {
    return this._HttpClient.post(
      `${this.apiUrl}Product/AddToFavProduct?cusId=${cusId}&ProdID=${ProdID}`,
      null,
      {
        headers: this.getHeaders(),
      }
    );
  }

  DeleteFromFav(favId: number): Observable<any> {
    return this._HttpClient.delete(
      `${this.apiUrl}Product/DeleteProductFromFav?favId=${favId}`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  showAllFav(cusId: string): Observable<showAllFav[]> {
    return this._HttpClient.get<showAllFav[]>(
      `${this.apiUrl}Product/ShowAllFavProduct?customerId=${cusId}`,
      {
        headers: this.getHeaders(),
      }
    );
  }
  // end wishlist

  // comment analysis
  sentiment(data: { text: string }): Observable<any> {
    return this._HttpClient.post(
      `https://sentimentanalisis-api.onrender.com/predict`,
      data
    );
  }

  // specific product

  addComment(data: AddCommentRequest): Observable<any> {
    return this._HttpClient.post(`${this.apiUrl}Product/AddComment`, data, {
      headers: this.getHeaders(),
    });
  }

  deleteComment(
    custId: string,
    prodId: number,
    orgcomment: string
  ): Observable<any> {
    return this._HttpClient.delete(
      `${this.apiUrl}Product/DeleteComment?customerId=${custId}&productId=${prodId}&origincomment=${orgcomment}`
    );
  }

  checkBuying(custId: string, prodId: number | undefined) {
    return this._HttpClient.get(
      `${this.apiUrl}Product/CheckBuyingProduct?customerId=${custId}&productId=${prodId}`
    );
  }

  processComment(commentData: AddCommentRequest): Observable<any> {
    const key = `pendingComment_${commentData.productId}_${commentData.customerId}`;
    // Store in localStorage
    localStorage.setItem(key, JSON.stringify(commentData));

    // Send to sentiment analysis
    return this.sentiment({ text: commentData.originalComment }).pipe(
      switchMap((sentimentResponse: any) => {
        const finalCommentData: AddCommentRequest = {
          ...commentData,
          translateComment: sentimentResponse.translated_text,
          commentRate: Math.round(sentimentResponse.rating),
        };
        // Send to addComment API
        return this.addComment(finalCommentData).pipe(
          map((response) => {
            // On success, remove from localStorage
            localStorage.removeItem(key);
            return response;
          })
        );
      })
    );
  }

  retryPendingComments(): void {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('pendingComment_'))
      .forEach((key) => {
        const commentData: AddCommentRequest = JSON.parse(
          localStorage.getItem(key)!
        );
        this.processComment(commentData).subscribe({
          next: () => {},
          error: (err) => {
            console.error(
              `Failed to send pending comment for product ${commentData.productId}`,
              err
            );
            // Keep in localStorage for another retry
          },
        });
      });
  }

  showsizeImageforColor(
    prodId: number,
    colorId: number
  ): Observable<showsizeImageforColor> {
    return this._HttpClient.get<showsizeImageforColor>(
      `${this.apiUrl}Product/showsizeImageforColor?productId=${prodId}&colorId=${colorId}`,
      { headers: this.getHeaders() }
    );
  }

  addToCart(data: addToCart): Observable<addToCart> {
    return this._HttpClient.post<addToCart>(
      `${this.apiUrl}Product/AddToCart`,
      data,
      {
        headers: this.getHeaders(),
      }
    );
  }

  ShowAllCarts(custId: string): Observable<showAllCart> {
    return this._HttpClient.get<showAllCart>(
      `${this.apiUrl}Product/ShowAllCarts?customerId=${custId}`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  deleteCart(cartId: number): Observable<any> {
    return this._HttpClient.delete(
      `${this.apiUrl}Product/DeleteFromCart?cartId=${cartId}`
    );
  }

  updateQuantity(cartId: number, quantity: number): Observable<any> {
    return this._HttpClient.put(
      `${this.apiUrl}Product/UpdateQuantity?cartId=${cartId}&quantity=${quantity}`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  addToCartItems(item: {
    productId: number;
    cartId: number;
    colorId: number;
    sizeId: number;
  }): void {
    this.cartItems.update((items) => [...items, item]);
  }

  removeFromCartItem(productId: number, colorId: number, sizeId: number): void {
    this.cartItems.update((items) =>
      items.filter(
        (item) =>
          item.productId !== productId ||
          item.colorId !== colorId ||
          item.sizeId !== sizeId
      )
    );
  }

  getCartItems() {
    return this.cartItems.asReadonly();
  }

  loadCartItems(custId: string): void {
    this.ShowAllCarts(custId).subscribe({
      next: (cart: any) => {
        const items = cart.productIds.map(
          (productId: number, index: number) => ({
            productId,
            cartId: cart.id[index],
          })
        );
        this.cartItems.set(items);
      },
      error: (err) => {
        console.error('Error loading cart items:', err);
        this.cartItems.set([]); // Reset cart items on error
      },
    });
  }

  addOrder(data: addOrder): Observable<addOrder> {
    return this._HttpClient.post<addOrder>(
      `${this.apiUrl}Order/AddOrder`,
      data,
      {
        headers: this.getHeaders(),
      }
    );
  }

  showCustomerOrders(customerId: string): Observable<CustomerOrder[]> {
    return this._HttpClient.get<CustomerOrder[]>(
      `${this.apiUrl}Customer/ShowCustomerOrders?customerId=${customerId}`
    );
  }

  getCustomerOrderDetails(orderId: number): Observable<OrderDetail> {
    return this._HttpClient.get<OrderDetail>(
      `${this.apiUrl}Customer/GetCustomerOrderDetails?orderId=${orderId}`
    );
  }

  // recommendation
  TrainModel(): Observable<any> {
    return this._HttpClient.get(
      `https://aston.runasp.net/api/Product/TrainModel`
    );
  }

  RecommendationTrain(data: any): Observable<any> {
    return this._HttpClient.post(
      `https://rerecom-api.onrender.com/train`,
      data
    );
  }

  RecommendProduct(prodId: number, num: number): Observable<any> {
    return this._HttpClient.post(
      'https://rerecom-api.onrender.com/recommend-product',
      {
        product_id: prodId,
        top_n: num,
      }
    );
  }

  RecommendUser(userId: string, num: number): Observable<any> {
    return this._HttpClient.post(
      'https://rerecom-api.onrender.com/recommend-user',
      {
        user_id: userId,
        top_n: num,
      }
    );
  }

  ShowCustomerLogs(): Observable<any> {
    return this._HttpClient.get(
      `https://aston.runasp.net/api/Customer/ShowCustomerLogs`
    );
  }

  postUserLogs(data: any): Observable<any> {
    return this._HttpClient.post(
      'https://rerecom-api.onrender.com/update-user-logs',
      data
    );
  }

  // Initiate a new try-on prediction
  private apiKey = 'fa-BVRzXM4pKmY8-9Xmd1o7lHeNqPbXS1YIsceno';
  tryIt(data: any): Observable<any> {
    const url = `https://api.fashn.ai/v1/run`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    });

    return this._HttpClient.post(url, data, { headers });
  }

  // Get the status of a prediction by ID
  getPredictionStatus(predictionId: string): Observable<any> {
    const url = `https://api.fashn.ai/v1/status/${predictionId}`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.apiKey}`,
    });

    return this._HttpClient.get(url, { headers });
  }
}
