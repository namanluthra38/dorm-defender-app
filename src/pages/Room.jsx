import React from 'react';
import { Home } from 'lucide-react';

const Room = () => {
  const roomDetails = {
    number: 'A-302',
    block: 'A',
    bed: 'Upper',
    roommate: 'Rohit Sharma',
    facilities: ['WiFi', 'Attached bathroom', 'Cupboard']
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Room Details</h2>
        <p className="text-sm text-gray-500">Your current assigned room and facilities</p>
      </div>

      <div className="bg-white border rounded-md p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-500">Room</p>
            <p className="text-xl font-semibold">{roomDetails.number}</p>
          </div>
          <Home className="w-6 h-6 text-sky-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Block</p>
            <p className="font-medium">{roomDetails.block}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Bed</p>
            <p className="font-medium">{roomDetails.bed}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Roommate</p>
            <p className="font-medium">{roomDetails.roommate}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Facilities</p>
            <p className="font-medium">{roomDetails.facilities.join(', ')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
