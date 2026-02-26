import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Navigation } from "@/components/Navigation";
import { airtable } from "@/integrations/airtable/client";
import type { Product } from "@/integrations/airtable/types.generated";

const ProductDetails = () => {
  const { id } = useParams();
  const { toast } = useToast();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      try {
        const product = await airtable.getById("plans", id as string) as Product;
        return {
          ...product,
          price: typeof product.price === 'number' ? product.price : parseFloat(product.price as string)
        };
      } catch (error) {
        console.error("Error fetching product:", error);
        throw error;
      }
    },
  });

  const addToCart = () => {
    const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItemIndex = cartItems.findIndex(
      (item: any) => item.id === product.id
    );

    if (existingItemIndex >= 0) {
      cartItems[existingItemIndex].quantity += 1;
    } else {
      cartItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: 1,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cartItems));
    toast({
      title: "Added to cart",
      description: `${product.name} added to your cart`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!product) {
    return <div>Plan not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200">
            <img
              src={product.image_url || "/placeholder.svg"}
              alt={product.name}
              className="h-full w-full object-cover object-center"
            />
          </div>
          <div className="flex flex-col space-y-4">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-gray-600">{product.brand}</p>
            <p className="text-2xl font-bold">£{product.price}/mo</p>
            <p className="text-gray-700">{product.description}</p>
            <div className="space-y-2">
              <h3 className="font-semibold mb-2">Plan Details</h3>
              {product.speed && (
                <p className="text-gray-600">Speed: {product.speed}</p>
              )}
              {product.data_allowance && (
                <p className="text-gray-600">Data: {product.data_allowance}</p>
              )}
              {product.contract_months && (
                <p className="text-gray-600">Contract: {product.contract_months} months</p>
              )}
            </div>
            <Button
              className="mt-8"
              size="lg"
              onClick={addToCart}
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
