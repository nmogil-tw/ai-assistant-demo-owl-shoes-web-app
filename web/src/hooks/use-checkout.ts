import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { twilioApi } from "@/integrations/twilio";
import { CheckoutFormData, CartItem, Customer, OrderResponse } from "@/types/checkout";

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
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode
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
        phone: formData.phone
      }) as OrderResponse;

      if (!orderResponse.success) {
        throw new Error(orderResponse.error || "Failed to create order");
      }

      // Send data to Segment via Twilio Function
      console.log("Sending data to Segment");
      await twilioApi.analytics.sendToSegment({
        formData,
        orderData: orderResponse.data,
        cartItems,
        totalAmount
      });

      // Send SMS if user opted in
      if (formData.smsOptIn) {
        console.log("Sending order confirmation SMS", {
          formData,
          orderData: {
            order_id: orderResponse.data.id,
            total_amount: totalAmount,
            items: cartItems
          }
        });
        
        const smsResponse = await twilioApi.orders.sendOrderSms({
          formData,
          orderData: {
            order_id: orderResponse.data.id,
            total_amount: totalAmount,
            items: cartItems
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
      toast({
        title: "Order placed successfully!",
        description: formData.smsOptIn 
          ? "Thank you for your purchase. You'll receive an SMS confirmation shortly."
          : "Thank you for your purchase.",
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