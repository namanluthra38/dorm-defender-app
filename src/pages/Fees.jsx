import React from 'react';
import { CreditCard } from 'lucide-react';

const Fees = () => {
  const fees = {
    total: 5000,
    paid: 3750,
    due: 1250,
    lastPayment: '2025-10-01'
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Fees & Payments</h2>
        <p className="text-sm text-gray-500">View your fee status and payment history</p>
      </div>

      <div className="bg-white border rounded-md p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-500">Total Fees</p>
            <p className="text-xl font-semibold">₹{fees.total.toFixed(2)}</p>
          </div>
          <CreditCard className="w-6 h-6 text-amber-500" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Paid</p>
            <p className="font-medium">₹{fees.paid.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Due</p>
            <p className="font-medium text-rose-500">₹{fees.due.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Last Payment</p>
            <p className="font-medium">{fees.lastPayment}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Fees;
