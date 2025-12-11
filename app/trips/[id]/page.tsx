import { notFound } from 'next/navigation';
import Image from 'next/image';
import { TripService } from '@/lib/services';
import { formatPrice, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { mockTrips } from '@/lib/data/mockData';

interface TripPageProps {
  params: {
    id: string;
  };
}

// Generate static params for all trip IDs
export async function generateStaticParams() {
  return mockTrips.map((trip) => ({
    id: trip.id,
  }));
}

export default async function TripPage({ params }: TripPageProps) {
  const trip = await TripService.getTripById(params.id);

  if (!trip) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Image */}
        <div className="relative h-96 rounded-lg overflow-hidden mb-8">
          <Image
            src={trip.imageUrl}
            alt={`${trip.destination} - ${trip.title}`}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-end">
            <div className="p-8 text-white">
              <h1 className="text-4xl font-bold mb-2">{trip.title}</h1>
              <p className="text-xl">{trip.destination}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <span className="bg-primary-100 text-primary-600 px-3 py-1 rounded-full text-sm font-medium capitalize">
                    {trip.category}
                  </span>
                  <span className="flex items-center text-yellow-500">
                    ⭐ {trip.rating}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600">{formatPrice(trip.price)}</p>
                  <p className="text-gray-600">per person</p>
                </div>
              </div>

              <h2 className="text-2xl font-semibold mb-4">About This Trip</h2>
              <p className="text-gray-700 mb-6">{trip.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Duration</h3>
                  <p className="text-gray-700">{trip.duration} days</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Category</h3>
                  <p className="text-gray-700 capitalize">{trip.category}</p>
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-4">What&apos;s Included</h3>
              <ul className="space-y-2 mb-6">
                {trip.included.map((item, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h3 className="text-xl font-semibold mb-4">Book This Trip</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Date
                  </label>
                  <select className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="">Choose a date</option>
                    {trip.availableDates.map((date) => (
                      <option key={date} value={date}>
                        {formatDate(date)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Guests
                  </label>
                  <select className="w-full p-2 border border-gray-300 rounded-md">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'guest' : 'guests'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button className="w-full mb-4">
                Book Now
              </Button>
              
              <Button variant="outline" className="w-full">
                Add to Wishlist
              </Button>

              <div className="mt-6 text-center text-sm text-gray-600">
                <p>💳 Secure payment</p>
                <p>📞 24/7 customer support</p>
                <p>✈️ Free cancellation up to 24h</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
