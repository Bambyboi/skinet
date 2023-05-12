
import * as cuid from 'cuid';

export interface BasketItem {
    id: number;
    productName: string;
    price: number;
    quantity: number;
    pictureUrl: string;
    brand: string;
    type: string;
}

export interface Basket {
    id: string;
    items: BasketItem[];
}
// will be use to create another basket for us
export class Basket implements Basket {
    id = cuid();
    items: BasketItem[] = [];
}
//this could use to add up the price of the total item inside the cart
export interface BasketTotals {
    shipping: number;
    subtotal: number;
    total: number;
}
