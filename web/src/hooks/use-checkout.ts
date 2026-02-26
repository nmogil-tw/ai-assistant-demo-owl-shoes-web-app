import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { twilioApi } from "@/integrations/twilio";
import { CheckoutFormData, CartItem, Customer, OrderResponse } from "@/types/checkout";
import { trackSegmentEvent, getCartId, clearCartId } from "@/lib/segment";

export const useCheckout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const calculateTotalAmount = (cartItems: CartItem[]): number => {
    return cartItems.reduce(
      (sum: number, item: CartItem) => sum + item.price * item.quantity,
      0
    );
  };

  const handleSubmit = async (formData: CheckoutFormData) => {
    setLoading(true);
    console.log("Starting checkout process with form data:", formData);

    try {
      // Get cart items and calculate total
      const cartItems = JSON.parse(localStorage.getItem("cart") || "[]") as CartItem[];
      const totalAmount = calculateTotalAmount(cartItems);

      // Create or update customer via Twilio Function
      console.log("Creating/updating customer");
      const customerResponse = await twilioApi.customers.create({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.isStorePickup ? "" : formData.address,
        city: formData.isStorePickup ? "" : formData.city,
        state: formData.isStorePickup ? "" : formData.state,
        zipCode: formData.isStorePickup ? "" : formData.zipCode
      });

      if (!customerResponse.success) {
        throw new Error("Failed to create/update customer");
      }

      const customer = customerResponse.data as Customer;

      // Create order via Twilio Function
      console.log("Creating order");
      const orderResponse = await twilioApi.orders.create({
        items: cartItems,
        totalAmount,
        customerId: customer.id,
        email: formData.email,
        phone: formData.phone,
        isStorePickup: formData.isStorePickup,
        storeId: formData.storeId,
        storeName: formData.storeName
      }) as OrderResponse;

      if (!orderResponse.success) {
        throw new Error(orderResponse.error || "Failed to create order");
      }

      // Send data to Segment via Twilio Function
      console.log("Sending data to Segment");
      trackSegmentEvent({
        eventTrigger: "order_completed",
        formData,
        properties: {
          order_id: orderResponse.data.id,
          cart_id: getCartId(),
          total: totalAmount,
          products: cartItems.map((item) => ({
            product_id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      });

      // Send SMS if user opted in
      if (formData.smsOptIn) {
        console.log("Sending order confirmation SMS", {
          formData,
          orderData: {
            order_id: orderResponse.data.id,
            total_amount: totalAmount,
            items: cartItems,
            isStorePickup: formData.isStorePickup,
            storeName: formData.storeName
          }
        });
        
        const smsResponse = await twilioApi.orders.sendOrderSms({
          formData,
          orderData: {
            order_id: orderResponse.data.id,
            total_amount: totalAmount,
            items: cartItems,
            isStorePickup: formData.isStorePickup,
            storeName: formData.storeName
          }
        });

        console.log("SMS response:", smsResponse);

        if (!smsResponse.success) {
          console.error("Failed to send SMS:", smsResponse.error);
          // Don't throw error here, as the order was still successful
          toast({
            title: "Order placed successfully",
            description: "However, we couldn't send the confirmation SMS. You can check your order status online.",
            variant: "default"
          });
        }
      } else {
        console.log("SMS opt-in not selected, skipping SMS");
      }

      // Clear cart and show success message
      localStorage.removeItem("cart");
      clearCartId();
      
      // Customize success message based on delivery method
      const successDescription = formData.isStorePickup
        ? `Thank you for your purchase. ${formData.smsOptIn ? "You'll receive an SMS confirmation shortly. " : ""}Your order will be available for pickup at ${formData.storeName}.`
        : `Thank you for your purchase. ${formData.smsOptIn ? "You'll receive an SMS confirmation shortly." : ""}`;
      
      toast({
        title: "Order placed successfully!",
        description: successDescription,
        variant: "default"
      });
      
      // Navigate to home page
      navigate("/");
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Error placing order",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleSubmit
  };
};