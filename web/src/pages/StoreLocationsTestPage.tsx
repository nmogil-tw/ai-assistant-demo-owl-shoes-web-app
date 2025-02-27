import { useState, useEffect, useCallback } from 'react';
import { StoreLocation } from '@/types/checkout';

interface UseStoreLocationsProps {
  zipCode?: string;
  city?: string;
}

interface UseStoreLocationsResult {
  loading: boolean;
  error: string | null;
  storeLocations: StoreLocation[];
  fetchStoreLocations: (params?: { zipCode?: string; city?: string }) => Promise<void>;
}

export const useStoreLocations = (
  initialParams?: UseStoreLocationsProps
): UseStoreLocationsResult => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([]);

  const fetchStoreLocations = useCallback(
    async (params?: { zipCode?: string; city?: string }) => {
      setLoading(true);
      setError(null);

      try {
        // Build query parameters
        const queryParams = new URLSearchParams();
        
        if (params?.zipCode) {
          queryParams.append('zipCode', params.zipCode);
        }
        
        if (params?.city) {
          queryParams.append('city', params.city);
        }

        // Get the Twilio Functions domain from environment variables
        const functionsDomain = import.meta.env.VITE_TWILIO_FUNCTION_URL || '';
        
        // Ensure the domain is properly formatted with https://
        const baseUrl = functionsDomain.startsWith('http') 
          ? functionsDomain 
          : `https://${functionsDomain}`;
        
        // Construct the full URL with the correct path
        const url = `${baseUrl}/front-end/get-store-locations${
          queryParams.toString() ? `?${queryParams.toString()}` : ''
        }`;
        
        console.log('Fetching store locations from:', url);

        // Fetch store locations from Twilio Function
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
        });

        // Log the raw response for debugging
        const responseText = await response.text();
        console.log('Raw API response:', responseText);
        
        // Try to parse the response as JSON
        let result;
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
        }

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to fetch store locations');
        }

        setStoreLocations(result.data || []);
      } catch (err) {
        console.error('Error fetching store locations:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setStoreLocations([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Fetch store locations on initial render if params are provided
  useEffect(() => {
    if (initialParams?.zipCode || initialParams?.city) {
      fetchStoreLocations(initialParams);
    }
  }, [fetchStoreLocations, initialParams]);

  return {
    loading,
    error,
    storeLocations,
    fetchStoreLocations,
  };
}; 