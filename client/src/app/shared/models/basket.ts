
import * as cuid from 'cuid';

//The provided code defines TypeScript interfaces to describe the structure of the shopping cart and its items, 
//and a class to provide a concrete implementation of the shopping cart. It also includes an interface for 
//storing the calculated totals of the shopping cart items.

//defines the structure of a single item in the shopping cart.
export interface BasketItem {
    id: number;
    productName: string;
    price: number;
    quantity: number;
    pictureUrl: string;
    brand: string;
    type: string;
}
//Defines the structure of the shopping cart itself.
export interface Basket {
    id: string;
    items: BasketItem[];
    clientSecret?: string;
    paymentIntentId?: string;
    deliveryMethodId?: number;
    shippingPrice: number;
}
// will be use to create another basket for us
export class Basket implements Basket {
    id = cuid();
    items: BasketItem[] = [];
    shippingPrice = 0;
}
//this could use to add up the price of the total item inside the cart or Defines the structure for storing the total price information of the items in the shopping cart.
export interface BasketTotals {
    shipping: number;
    subtotal: number;
    total: number;
}
