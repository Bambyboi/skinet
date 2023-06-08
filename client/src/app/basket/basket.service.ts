import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Basket, BasketItem, BasketTotals } from '../shared/models/basket';
import { HttpClient } from '@angular/common/http';
import { Product } from '../shared/models/product';
import { ReturnStatement } from '@angular/compiler';
import { DeliveryMethod } from '../shared/models/deliveryMethod';

@Injectable({
  providedIn: 'root'
})
export class BasketService {
  baseUrl = environment.apiUrl;
  //new observable: this could use to update or provide support for passing messages between parts of your application
  private basketSource = new BehaviorSubject<Basket | null>(null);
  basketSource$ = this.basketSource.asObservable();
  //another observable
  private basketTotalSource = new BehaviorSubject<BasketTotals | null>(null);
  basketTotalSource$ = this.basketTotalSource.asObservable();
  shipping =0;

  //this constuctor will use for a http request to our application
  constructor(private http: HttpClient) { }
 
  //createPaymentIntent method is responsible for sending an HTTP POST request to create 
  //a payment intent and handling the response. It updates the current basket with the response, 
  //emits the updated basket to subscribers, and logs the basket object to the console for debugging purposes.
  createPaymentIntent(){
    return this.http.post<Basket>(this.baseUrl + 'payments/' + this.getCurrentBasketValue()?.id, {})
    .pipe(
      map(basket => {
        this.basketSource.next(basket);
      })
    )
  }
 
  //The method takes a parameter deliveryMethod of type DeliveryMethod, which likely represents a specific delivery method selected by the user.
  setShippingPrice(deliveryMethod: DeliveryMethod){
    //The code checks if the basket object (retrieved earlier) is not null or undefined.
    const basket = this.getCurrentBasketValue();
  
    //If the basket exists, it sets the deliveryMethodId property of the basket to the id of the selected deliveryMethod. 
    //This associates the chosen delivery method with the basket.
    if (basket)
    {
      basket.shippingPrice = deliveryMethod.price;
      basket.deliveryMethodId = deliveryMethod.id;
      this.setBasket(basket);
    }
  }


  //this could use to get the link of our basket
  getBasket(id: string){
    return this.http.get<Basket>(this.baseUrl + 'basket?id=' + id).subscribe({
      next: basket => {
        this.basketSource.next(basket);
          //This method is likely responsible for recalculating the totals of the basket, taking into account the updated 
          //delivery method and potentially other factors.
        this.calculateTotals();
      }
    })
  }
  setBasket(basket: Basket){
    return this.http.post<Basket>(this.baseUrl + 'basket', basket).subscribe({
      next: basket => {
        this.basketSource.next(basket);
        this.calculateTotals();
      }
    })
  }
  getCurrentBasketValue(){
    return this.basketSource.value;
  }
  //this add item to the basket
  addItemToBasket(item: Product | BasketItem, quantity = 1){
    //this is also use to configured the minus and plus increment
    if (this.isProduct(item)) item = this.mapProductItemToBasketItem(item);
    const basket = this.getCurrentBasketValue() ?? this.createBasket();
    basket.items = this.addOrUpdateItem(basket.items, item, quantity);
    this.setBasket(basket);
  }

  removeItemFromBasket(id: number, quantity = 1){
    const basket = this.getCurrentBasketValue();
    if (!basket) return;
    const item = basket.items.find(x => x.id === id);
    if (item) {
      item.quantity -= quantity;
      if (item.quantity === 0){
        basket.items = basket.items.filter(x => x.id !== id)
      }
      if (basket.items.length > 0) this.setBasket(basket);
      else this.deleteBasket(basket);
    }
  }
  deleteBasket(basket: Basket) {
    //this could allow the http to delete the id item on our application
    return this.http.delete(this.baseUrl + 'basket?id=' + basket.id).subscribe({
      next: () => {
        this.deleteLocalBasket();
      }
    });
  }

  deleteLocalBasket(){
    this.basketSource.next(null),
    this.basketTotalSource.next(null);
    //this could delete the item from the localstorage on the internet
    localStorage.removeItem('basket_id');
  }

  addOrUpdateItem(items: BasketItem[], itemToAdd: BasketItem, quantity: number): BasketItem[] {
    const item = items.find(x => x.id === itemToAdd.id);
    if (item) item.quantity += quantity;
    else{
      itemToAdd.quantity = quantity;
      items.push(itemToAdd);

    }
    return items;
  }
  
  createBasket(): Basket {
    const basket = new Basket();
    localStorage.setItem('basket_id', basket.id);
    return basket;
  }


  //this could use to display all the details of the product into basket
  private mapProductItemToBasketItem(item: Product): BasketItem{
    return{
      id: item.id,
      productName: item.name,
      price: item.price,
      quantity: 0,
      pictureUrl: item.pictureUrl,
      brand: item.productBrand,
      type: item.productType
    }
  }

  //this could calculate the total price in the cart which can implement at the very top observable basketTotalSource
  private calculateTotals (){
    const basket = this.getCurrentBasketValue();
    if (!basket) return;
    //reduce fuction is for calculating array, like price and quantity and add them together in a parameter
    const subtotal = basket.items.reduce((a, b) => (b.price * b.quantity) + a, 0);
    const total = subtotal + basket.shippingPrice;
    this.basketTotalSource.next({shipping : basket.shippingPrice, total, subtotal});
  }

  private isProduct(item: Product | BasketItem) : item is Product{
    return (item as Product).productBrand !== undefined;
  }

}
