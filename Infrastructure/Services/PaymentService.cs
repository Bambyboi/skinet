using Core.Entities;
using Core.Entities.OrderAggregate;
using Core.Interfaces;
using Core.Specifications;
using Microsoft.Extensions.Configuration;
using Stripe;
using Product = Core.Entities.Product;

namespace Infrastructure.Services
{
    public class PaymentService : IPaymentService
    {
        //we add constructor for PaymentService to combine three interfaces listed below
        private readonly IBasketRepository _basketRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _config;
        public PaymentService(IBasketRepository basketRepository, IUnitOfWork unitOfWork, IConfiguration config)
        {
            _config = config;
            _unitOfWork = unitOfWork;
            _basketRepository = basketRepository;

        }

        //method from IPaymentService interface

        public async Task<CustomerBasket> CreateOrUpdatePaymentIntent(string basketId)
        {
            //this is when we use the stripe packages to provide the configuration to link our API to the stripe in our appsettings.json file
            //also to allow our application to use the SecretKey for maintaining much more securable to all the clients credit cards  
            StripeConfiguration.ApiKey = _config["StripeSettings:SecretKey"];

            //Retrieves the customer basket using the _basketRepository (presumably a repository for managing baskets) based on the provided basketId.
            var basket = await _basketRepository.GetBasketAsync(basketId);

            if (basket == null) return null;

            //Initializes a shippingPrice variable to 0.
            var shippingPrice = 0m;

            //If the customer basket has a delivery method selected (DeliveryMethodId has a value), 
            if (basket.DeliveryMethodId.HasValue)
            {
                //retrieves the corresponding delivery method using the _unitOfWork.Repository<DeliveryMethod>() method. 
                var deliveryMethod = await _unitOfWork.Repository<DeliveryMethod>()
                    .GetByIdAsync((int)basket.DeliveryMethodId);
                          
                //The delivery method's price is assigned to the shippingPrice variable.
                shippingPrice = deliveryMethod.Price;
            }
            //Loops through each item in the customer basket and retrieves the corresponding product 
            //using the _unitOfWork.Repository<Product>().GetByIdAsync() method. 
            //If the item's price is different from the product's price, updates the item's price to match the product's price.
            foreach (var item in basket.Items)
            {
                var productItem = await _unitOfWork.Repository<Product>().GetByIdAsync(item.Id);
                if (item.Price != productItem.Price)
                {
                    item.Price = productItem.Price;
                }
            }
             //Creates a new instance of the PaymentIntentService class.
            var service = new PaymentIntentService();
           
            PaymentIntent intent;
           
             
            //quantities and prices, along with the shipping price. The currency is set to "usd", and the payment 
            //method type is set to "card". The resulting intent is assigned to the intent variable.
            
            //Checks if the customer basket's PaymentIntentId is null or empty.
            if (string.IsNullOrEmpty(basket.PaymentIntentId))
            {
                // If so, creates a new paymentintent using the service.CreateAsync() method or PaymentIntentCreateOptions method from stripe.net package, 
                //passing in the total amount calculated from the basket items'
                var options = new PaymentIntentCreateOptions
                {
                    Amount = (long) basket.Items.Sum( i => i.Quantity * (i.Price * 100)) + (long)
                    shippingPrice * 100,
                    Currency = "usd",
                    PaymentMethodTypes = new List<string> {"card"}
                };
                //Updates the customer basket's PaymentIntentId and ClientSecret with the corresponding values from the created intent.
                intent = await service.CreateAsync(options);
                basket.PaymentIntentId = intent.Id;
                basket.ClientSecret = intent.ClientSecret;
            }
            //Checks if the customer basket's PaymentIntentId is not null or empty. 
            //If this condition is true, it means that a payment intent already exists for the basket.
            else
            {
                //If a payment intent exists, creates a new PaymentIntentUpdateOptions object and sets the Amount property to the updated
                //total amount calculated from the basket items' quantities and prices, along with the shipping price.
                var options = new PaymentIntentUpdateOptions
                {
                    Amount = (long) basket.Items.Sum( i => i.Quantity * (i.Price * 100)) + (long)
                    shippingPrice * 100
                };
                //Calls the service.UpdateAsync() method, passing the PaymentIntentId from the basket and the updated 
                //options to update the existing payment intent with the new amount.
                await service.UpdateAsync(basket.PaymentIntentId, options);
            }
            //Calls the _basketRepository.UpdateBasketAsync() method to update the customer basket with the modified 
            //payment intent information.
            await _basketRepository.UpdateBasketAsync(basket);

            //Finally, returns the updated customer basket.
            return basket;


        }

        public async Task<Order> UpdateOrderPaymentFailed(string PaymentIntentId)
        {
            var spec = new OrderByPaymentIntentIdSpecification(PaymentIntentId);
            var order = await _unitOfWork.Repository<Order>().GetEntityWithSpec(spec);

            if (order == null) return null;

            order.Status = OrderStatus.PaymentFailed;
            await _unitOfWork.Complete();

            return order;


        }

        public async Task<Order> UpdateOrderPaymentSucceeded(string PaymentIntentId)
        {
            var spec = new OrderByPaymentIntentIdSpecification(PaymentIntentId);
            var order = await _unitOfWork.Repository<Order>().GetEntityWithSpec(spec);

            if (order == null) return null;

            order.Status = OrderStatus.PaymentReceived;
            await _unitOfWork.Complete();

            return order;
        }
    }
}