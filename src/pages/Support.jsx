import React from 'react';

const Support = () => {
  const faqs = [
    { q: 'How do I pay my fees?', a: 'Use the Pay Now action in the dashboard or visit Fees -> Pay.' },
    { q: 'How to raise a complaint?', a: 'Go to Complaints and click New Complaint. Fill details and submit.' }
  ];

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Support</h2>
        <p className="text-sm text-gray-500">Help and frequently asked questions</p>
      </div>

      <div className="bg-white border rounded-md p-4">
        <ul className="space-y-3">
          {faqs.map((f, i) => (
            <li key={i}>
              <p className="font-medium">{f.q}</p>
              <p className="text-sm text-gray-600">{f.a}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Support;
