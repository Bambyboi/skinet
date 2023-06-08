using System.ComponentModel.DataAnnotations;

namespace API.Dtos
{
    public class CustomerBasketDto
    {
        [Required]
        public string Id { get; set; }
        public List<BasketItemDto> Items { get; set; }
        public int? DeliveryMethodId { get; set; }
        public string ClientSecret { get; set; }
        //PaymentIntentId is use to let client to update they order information instead of creating a new order information 
        public string PaymentIntentId { get; set;}
        public decimal ShippingPrice { get; set; }
    }
}