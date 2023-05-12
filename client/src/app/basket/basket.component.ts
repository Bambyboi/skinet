import { Component } from '@angular/core';
import { BasketService } from './basket.service';
import { BasketItem } from '../shared/models/basket';

@Component({
  selector: 'app-basket',
  templateUrl: './basket.component.html',
  styleUrls: ['./basket.component.scss']
})
export class BasketComponent {
  //this could use to call all the methods in basket service
  constructor(public basketService: BasketService){}

  incrementQuantity(item: BasketItem){
    this.basketService.addItemToBasket(item);
  }

  removeItem(id: number, quantity: number){
    this.basketService.removeItemFromBasket(id,quantity);
  }
}
