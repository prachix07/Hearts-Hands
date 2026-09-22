export type UserRole = 'customer' | 'artisan';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  shopName?: string;
  bio?: string;
  avatar?: string;
  joinedDate: string;
  location?: string;
  specialty?: string;
  categories?: string[];
  instagramId?: string;
  authProvider?: 'local' | 'google';
}

export type MainCategory =
  | 'Jewelry'
  | 'Accessories'
  | 'Home & Décor'
  | 'Art & Stationery'
  | 'Crafts'
  | 'Gifts'
  | 'Custom Creations';

export type Subcategory =
  // Jewelry
  | 'Necklaces'
  | 'Chokers'
  | 'Earrings'
  | 'Bracelets'
  | 'Rings'
  | 'Charms & Pendants'
  // Accessories
  | 'Bags'
  | 'Hair Accessories'
  | 'Keychains'
  | 'Phone Charms'
  | 'Other Accessories'
  // Home & Décor
  | 'Candles'
  | 'Pottery'
  | 'Wall Décor'
  | 'Decorative Items'
  | 'Plants & Floral Décor'
  // Art & Stationery
  | 'Paintings'
  | 'Bookmarks'
  | 'Greeting Cards'
  | 'Journaling & Paper Crafts'
  | 'Handmade Illustrations'
  // Crafts
  | 'Crochet'
  | 'Knitting'
  | 'Clay Crafts'
  | 'Resin Crafts'
  | 'Macramé'
  | 'Other Handmade Crafts'
  // Gifts
  | 'Personalized Gifts'
  | 'Gift Sets'
  | 'Birthday Gifts'
  | 'Couple Gifts'
  | 'Handmade Keepsakes'
  // Custom Creations
  | 'Personalized Jewelry'
  | 'Customized Accessories'
  | 'Custom Décor'
  | 'Custom Gifts';

export interface CategoryStructure {
  id: string;
  name: MainCategory;
  tagline: string;
  description: string;
  image: string;
  subcategories: Subcategory[];
}

export interface ProductCustomOption {
  allowEngraving: boolean;
  engravingPlaceholder: string;
  engravingMaxChars: number;
  materials: string[];
  fonts: string[];
  giftWrapAvailable: boolean;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  category: MainCategory | string;
  mainCategory?: MainCategory;
  subcategory?: Subcategory | string;
  price: number;
  artisanId: string;
  artisanName: string;
  artisanShop: string;
  image: string;
  images?: string[];
  inStock: boolean;
  stockCount: number;
  status?: 'Active' | 'Out of Stock' | 'Draft';
  rating: number;
  reviewCount: number;
  customOptions: ProductCustomOption;
  badge?: string;
  craftTimeDays: number;
  material?: string;
  sizeDimensions?: string;
  shippingInfo?: string;
  artisanBio?: string;
  artisanLocation?: string;
  artisanAvatar?: string;
  artisanSpecialty?: string;
  createdAt?: string;
}

export interface CustomSelections {
  engravingText: string;
  material: string;
  font: string;
  giftWrap: boolean;
  giftMessage?: string;
  specialInstructions?: string;
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  product: Product;
  quantity: number;
  customSelections: CustomSelections;
  totalPrice: number;
}

export type OrderStatus = 
  | 'Pending'
  | 'Confirmed'
  | 'Crafting'
  | 'Ready to Ship'
  | 'Shipped'
  | 'Delivered'
  | 'Completed'
  | 'Order Placed' 
  | 'In Crafting' 
  | 'Quality Check';

export interface OrderTimelineEvent {
  status: OrderStatus;
  date: string;
  note: string;
}

export interface ShippingAddress {
  fullName: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentStatus?: 'Paid' | 'Pending' | 'Refunded';
  artisanNotes?: string;
  trackingNumber?: string;
  carrier?: string;
  createdAt: string;
  estimatedDelivery: string;
  timeline: OrderTimelineEvent[];
}

export interface ProductReview {
  id: string;
  productId: string;
  orderId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  customDetailsSummary?: string;
  artisanReply?: string;
}

export interface ArtisanNotification {
  id: string;
  artisanId: string;
  type: 'new_order' | 'custom_order' | 'low_stock' | 'out_of_stock' | 'cancellation' | 'completed_order';
  title: string;
  message: string;
  orderId?: string;
  productId?: string;
  createdAt: string;
  read: boolean;
}

export interface ArtisanEarnings {
  totalSales: number;
  completedOrdersCount: number;
  pendingPayments: number;
  availableEarnings: number;
  earningsHistory: Array<{
    id: string;
    orderNumber: string;
    date: string;
    amount: number;
    status: 'Pending' | 'Available' | 'Paid';
    customerName: string;
  }>;
}

export interface ArtisanProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  shopName: string;
  bio: string;
  specialty: string;
  categories: string[];
  location: string;
  instagramId: string;
  avatar: string;
  joinedDate: string;
  rating?: number;
  reviewCount?: number;
}
