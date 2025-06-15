export interface showAllProducts {
  id: number;
  title: string;
  feedback: number;
  status: string;
  discount: number;
  unitPrice: number;
  sellPrice: number;
  merchantName: string;
  categoryName: string;
  merchantId: string;
  image: string;
}

export interface showRandomProduct {
  id: number;
  discount: number;
  unitPrice: number;
  sellPrice: number;
  feedback: number;
  title: string;
  category: string;
  status: string;
  imageUrl: string;
}

export interface ShowHighFeedbackProduct {
  id: number;
  discount: number;
  unitPrice: number;
  sellPrice: number;
  feedback: number;
  title: string;
  category: string;
  status: string;
  imageUrl: string;
}

export interface ShowSpecificProduct {
  id: number;
  title: string;
  status: string;
  personStar: number;
  averageStar: number | 0;
  originalComment: string[];
  translateComment: string[];
  dateCreate: string[];
  userName: string[];
  unitPrice: number;
  discount: number;
  sellPrice: number;
  description: string;
  color: string[];
  colorId: number[];
  categoriesId: number;
  type: string;
  category: string;
  commentRate: number[];
  merchantFeedbak: number;
  merchantName: string;
  merchantId: string;
  imageUrls: string[];
  allStars: number[];
}

export interface ShowSpecificProduct1 {
  id: number;
  title: string;
  status: string;
  personStar: number;
  averageStar: number | 0;
  originalComment: string[];
  translateComment: string[];
  dateCreate: string[];
  userName: string[];
  unitPrice: number;
  discount: number;
  sellPrice: number;
  description: string;
  color: string[];
  colorId: number[];
  categoriesId: number;
  type: string;
  category: string;
  commentRate: number[];
  merchantFeedbak: number;
  merchantName: string;
  merchantId: string;
  imageUrls: string[];
  image?: string;
  allStars: number[];
}

export interface showAllFav {
  id: number;
  productId: number;
  status: string;
  title: string;
  discount: number;
  unitPrice: number;
  sellPrice: number;
  image: string;
}

export interface AddCommentRequest {
  productId: number;
  customerId: string;
  star: number;
  originalComment: string;
  translateComment: string;
  commentRate: number;
}

export interface AddCommentResponse {
  message: string;
}

export interface showsizeImageforColor {
  productId: number;
  images: string[];
  sizeId: number[];
  sizes: string[];
}

export interface addToCart {
  productId: number;
  colorId: number;
  sizeId: number;
  customerId: string;
}

export interface showAllCart {
  id: number[];
  productIds: number[];
  productsNames: string[];
  productDescribtions: string[];
  productPrice: number[];
  quantity: number[];
  color: string[];
  size: string[];
  image: string[];
  totalPrice: number;
}

export interface addOrder {
  customerId: string;
  address: string;
  phone: string;
}

export interface CustomerOrder {
  orderId: number;
  status: string;
  userName: string;
  address: string;
  phone: string;
  deliveryName: string;
}

export interface OrderDetail {
  orderId: number;
  status: string[];
  userName: string;
  address: string;
  phone: string;
  productId: number[];
  productsName: string[];
  color: string[];
  size: string[];
  totalPrice: number;
  quantity: number[];
  deliveryName: string;
}
