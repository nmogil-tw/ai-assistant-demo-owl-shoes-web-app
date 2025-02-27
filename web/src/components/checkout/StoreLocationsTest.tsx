import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface TestResult {
  success: boolean;
  data?: any;
  error?: string;
  rawResponse?: string;
}

export const StoreLocationsTest = () => {
  const [zipCode, setZipCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [functionUrl, setFunctionUrl] = useState<string>('');

  // Get the environment variable on component mount
  useState(() => {
    const functionsDomain = import.meta.env.VITE_TWILIO_FUNCTION_URL || '';
    const baseUrl = functionsDomain.startsWith('http') 
      ? functionsDomain 
      : `https://${functionsDomain}`;
    setFunctionUrl(baseUrl);
  });

  const testApi = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      // Get the Twilio Functions domain from environment variables
      const functionsDomain = import.meta.env.VITE_TWILIO_FUNCTION_URL || '';
      
      // Ensure the domain is properly formatted
      const baseUrl = functionsDomain.startsWith('http') 
        ? functionsDomain 
        : `https://${functionsDomain}`;
      
      // Construct the URL
      const url = `${baseUrl}/get-store-locations${
        zipCode ? `?zipCode=${zipCode}` : ''
      }`;
      
      console.log('Testing API:', url);
      
      // Make the request
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      // Get the raw response text
      const responseText = await response.text();
      console.log('Raw API response:', responseText);
      
      // Try to parse as JSON
      try {
        const jsonResult = JSON.parse(responseText);
        setResult({
          success: true,
          data: jsonResult,
          rawResponse: responseText
        });
      } catch (parseError) {
        setResult({
          success: false,
          error: `Failed to parse response as JSON: ${parseError}`,
          rawResponse: responseText
        });
      }
    } catch (error) {
      console.error('API test error:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Store Locations API Test</CardTitle>
        <CardDescription>
          Test the store locations API to verify it's working correctly
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-md mb-4">
            <p className="text-sm font-medium">Function URL:</p>
            <p className="text-xs break-all">{functionUrl}/get-store-locations</p>
          </div>
          
          <div className="flex space-x-2">
            <Input
              placeholder="Enter ZIP code (optional)"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
            />
            <Button onClick={testApi} disabled={loading}>
              {loading ? 'Testing...' : 'Test API'}
            </Button>
          </div>
          
          {result && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">
                {result.success ? 'Success' : 'Error'}
              </h3>
              
              {result.error && (
                <div className="bg-red-50 p-4 rounded-md text-red-800 mb-4">
                  <p className="font-medium">Error:</p>
                  <p>{result.error}</p>
                </div>
              )}
              
              <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
                <p className="font-medium mb-2">Raw Response:</p>
                <pre className="text-xs whitespace-pre-wrap">
                  {result.rawResponse || 'No response received'}
                </pre>
              </div>
              
              {result.data && (
                <div className="mt-4 bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
                  <p className="font-medium mb-2">Parsed Data:</p>
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-gray-500">
          This is a test utility to help debug API issues.
        </p>
      </CardFooter>
    </Card>
  );
}; 