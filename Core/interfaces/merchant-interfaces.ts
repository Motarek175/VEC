export interface OrderItem {
  id: number;
  productName: string;
  color: string;
  size: string;
  quantity: number;
  merchantName: string;
  status: string; // e.g., "Received"
  price: number;
  imageUrl: string;
}

export interface MerchantProduct {
  id: number;
  description: string;
  title: string;
  status: 'Active' | 'OutOfStock' | 'Banned' | 'Pending';
  discount: number;
  unite: number;
  sellPrice: number;
  categoryName: string;
  image: string;
  quantity: number;
}

export interface ProductDetail {
  id: number;
  productName: string;
  color: string;
  size: string;
  image: string;
  quantity: number;
}

export interface updateProduct {
  id: number;
  title: string;
  description: string;
  discount: number;
  unitPrice: number;
}

export interface addProduct {
  title: string;
  description: string;
  categoryName: string;
  type: 'up' | 'tops' | 'bottoms' | 'one-pieces';
  unitPrice: number;
  discount: number;
  merchantId: string;
}

export interface updateOrderStatus {
  id: number;
  newStatus: string;
}

export interface addColorSizeImage {
  ProductId: number;
  Color: string;
  Size: string;
  Quantities: number[];
  Images: File[];
}
