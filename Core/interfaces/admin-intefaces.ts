export interface Order {
  id: number;
  status: 'Pending' | 'Preparing' | 'OnWay' | 'Recieved';
  customerId: string;
  userName: string;
  address: string;
  phone: string;
  deliveryId: string;
  deliveryName: string;
}

export interface OrderDetails {
  id: number;
  status: string[];
  customerId: string;
  userName: string;
  address: string;
  phone: string;
  productId: number[];
  productsName: string[];
  totalPrice: number;
  quantity: number[];
  deliveryId: string;
  deliveryName: string;
}

export interface Product {
  id: number;
  title: string;
  feedback: number;
  status: 'Active' | 'OutOfStock' | 'Pending' | 'Banned';
  quantity: number;
  merchantName: string;
  merchantId: string;
  image: string;
}

export interface Merchant {
  merchantId: string;
  merchantName: string;
  feedback: number;
  hireAge: number;
  status: string;
  gainMoney: number;
}

export interface Customer {
  customerId: string;
  customerName: string;
  status: 'Active' | 'Inactive' | 'Banned';
  ordercount: number;
}

export interface DeliveryRep {
  id: string;
  name: string;
  hireAge: number;
  deliveredOrdersCount: number;
  status: 'Active' | 'Inactive';
  createdByAdmin?: string;
}
