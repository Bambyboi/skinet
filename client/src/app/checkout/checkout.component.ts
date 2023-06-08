import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AccountService } from '../account/account.service';
import { BasketService } from '../basket/basket.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit{
  constructor(private fb: FormBuilder, private accountService: AccountService, private basketService: BasketService){

  }
  //ngOnInit method is a lifecycle hook used for initializing component-specific data or performing any necessary 
  //setup tasks when the component is first created. In this case, it fetches and sets the values for an address 
  //form and the selected delivery method, ensuring the component is properly initialized with the required data.
  ngOnInit(): void {
    this.getAddressFormValues();
    this.getDeliveryMethodValue();
  }

  checkoutForm = this.fb.group({
    addressForm : this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      street: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipcode: ['', Validators.required]
    }),
    deliveryForm: this.fb.group({
      deliveryMethod: ['', Validators.required]
    }),
    paymentForm: this.fb.group({
      nameOnCard: ['', Validators.required]
    })
  })
  getAddressFormValues(){
    this.accountService.getUserAddress().subscribe({
      next: address => {
        address && this.checkoutForm.get('addressForm')?.patchValue(address)
      }
    })
  }

  //getDeliveryMethodValue method is responsible for retrieving the delivery method value from the current basket 
  //and updating a corresponding control within a form. It ensures that the delivery method selected by the user 
  //is pre-selected or populated when displaying the form, potentially allowing the user to view or modify their 
  //selected delivery method during the checkout process.
  getDeliveryMethodValue()
  {
    //retrieves the current basket from the basketService using the getCurrentBasketValue method or property.
    const basket = this.basketService.getCurrentBasketValue();
    //It then checks if the basket object exists and if it has a valid deliveryMethodId.
    if (basket && basket.deliveryMethodId){
      this.checkoutForm.get('deliveryForm')?.get('deliveryMethod')
        ?.patchValue(basket.deliveryMethodId.toString());
    }
  }
}
