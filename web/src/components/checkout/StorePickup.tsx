import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStoreLocations } from '@/hooks/use-store-locations';
import { StoreLocation } from '@/types/checkout';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface StorePickupProps {
  onStoreSelect: (storeId: string, storeName: string) => void;
  selectedStoreId?: string;
}

export const StorePickup = ({ onStoreSelect, selectedStoreId }: StorePickupProps) => {
  const [searchType, setSearchType] = useState<'zipCode' | 'city'>('zipCode');
  const [searchValue, setSearchValue] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const { loading, error, storeLocations, fetchStoreLocations } = useStoreLocations();

  const handleSearch = async () => {
    if (!searchValue.trim()) return;

    setHasSearched(true);
    
    const params = searchType === 'zipCode' 
      ? { zipCode: searchValue.trim() } 
      : { city: searchValue.trim() };
    
    try {
      await fetchStoreLocations(params);
    } catch (err) {
      console.error('Error in handleSearch:', err);
    }
  };

  const handleStoreSelect = (storeId: string) => {
    const selectedStore = storeLocations.find(store => store.storeId === storeId);
    if (selectedStore) {
      onStoreSelect(selectedStore.storeId, selectedStore.storeName);
    }
  };

  const renderStoreDetails = (store: StoreLocation) => {
    return (
      <div className="text-sm mt-2 p-4 bg-gray-50 rounded-md">
        <p className="font-medium">{store.storeName}</p>
        <p>{store.address}</p>
        <p>{store.city}, {store.state} {store.zipCode}</p>
        <p>Phone: {store.phoneNumber}</p>
        <div className="mt-2">
          <p className="font-medium">Hours:</p>
          <p>Monday: {store.hoursMonday}</p>
          <p>Tuesday: {store.hoursTuesday}</p>
          <p>Wednesday: {store.hoursWednesday}</p>
          <p>Thursday: {store.hoursThursday}</p>
          <p>Friday: {store.hoursFriday}</p>
          <p>Saturday: {store.hoursSaturday}</p>
          <p>Sunday: {store.hoursSunday}</p>
        </div>
        <div className="mt-2">
          <p>Parking Available: {store.hasParking === "true" ? "Yes" : store.hasParking === "false" ? "No" : store.hasParking}</p>
          <p>Wheelchair Accessible: {store.isWheelchairAccessible === "true" ? "Yes" : store.isWheelchairAccessible === "false" ? "No" : store.isWheelchairAccessible}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium">Search for a store by:</label>
        <div className="flex space-x-2">
          <Select
            value={searchType}
            onValueChange={(value) => setSearchType(value as 'zipCode' | 'city')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Search by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="zipCode">ZIP Code</SelectItem>
              <SelectItem value="city">City</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1 flex space-x-2">
            <Input
              placeholder={searchType === 'zipCode' ? 'Enter ZIP code' : 'Enter city name'}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading || !searchValue.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {storeLocations.length > 0 && (
        <div className="space-y-4">
          <label className="block text-sm font-medium">Select a store:</label>
          <Select
            value={selectedStoreId}
            onValueChange={handleStoreSelect}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a store" />
            </SelectTrigger>
            <SelectContent>
              {storeLocations.map((store) => (
                <SelectItem key={store.storeId} value={store.storeId}>
                  {store.storeName} - {store.city}, {store.state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedStoreId && (
            renderStoreDetails(storeLocations.find(store => store.storeId === selectedStoreId)!)
          )}
        </div>
      )}

      {!loading && storeLocations.length === 0 && hasSearched && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No stores found</AlertTitle>
          <AlertDescription>
            We couldn't find any stores matching your search. Please try a different {searchType === 'zipCode' ? 'ZIP code' : 'city'}.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}; 