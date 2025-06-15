export interface Order {
  id: string;
  customerName: string;
  deliveryAddress: string;
  status: string;
  items?: {
    name: string;
    quantity: number;
    color?: string;
    size?: string;
    image?: string;
  }[];
  orderDate?: Date;
  customerId?: string;
  phone?: string;
  totalPrice?: number;
}
