using Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Core.Entities;
using API.Errors;
using Stripe;
using Core.Entities.OrderAggregate;

namespace API.Controllers
{
    // the PaymentsController class serves as a controller responsible for handling HTTP POST 
    //requests to create or update payment intents. It depends on an IPaymentService implementation 
    //to perform the necessary operations, and the response is returned as an ActionResult<CustomerBasket>.
    public class PaymentsController: BaseApiController
    {
        private const string WhSecret = "whsec_b263e242d69aaca67da0499a271748419d1963d017dd5da44ecf7bee2a3f1409";
        private readonly IPaymentService _paymentService;
        private readonly ILogger<PaymentsController> _logger;
        public PaymentsController(IPaymentService paymentService, ILogger<PaymentsController> logger)
        {
            _logger = logger;
            _paymentService = paymentService;
            
        }

        [Authorize]
        [HttpPost("{basketId}")]

        public async Task<ActionResult<CustomerBasket>> CreateOrUpdatePaymentIntent(string basketId)
        {
           var basket = await _paymentService.CreateOrUpdatePaymentIntent(basketId);

           if (basket == null) return BadRequest(new ApiResponse(400, "Problem with your basket"));

           return basket;
        } 

        [HttpPost("webhook")]
        public async Task<ActionResult> StripeWebhook()
        {
            var json = await new StreamReader(Request.Body).ReadToEndAsync();

            var stripeEvent = EventUtility.ConstructEvent(json, Request.Headers["Stripe-Signature"], WhSecret);

            PaymentIntent intent;
            Order order;

            switch (stripeEvent.Type)
            {
                case "payment_intent.succeeded":
                    intent = (PaymentIntent) stripeEvent.Data.Object;
                    _logger.LogInformation("Payment succeeded: ", intent.Id);
                    order = await _paymentService.UpdateOrderPaymentSucceeded(intent.Id);
                     //TODO: update the order with the new status
                    _logger.LogInformation("Order updated to payment recieved: ", order.Id);
                    break;

                case "payment_intent.payment_failed":
                    intent = (PaymentIntent) stripeEvent.Data.Object;
                    _logger.LogInformation("Payment failed: ", intent.Id);
                    order = await _paymentService.UpdateOrderPaymentFailed(intent.Id);
                    //TODO: update the order with the new status
                     _logger.LogInformation("Order updated to payment failed: ", order.Id);
                    break;
            }

            return new EmptyResult();
        }
    }
}