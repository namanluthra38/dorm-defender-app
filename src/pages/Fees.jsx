// src/pages/Fees.jsx
import React, { useState } from 'react';
import { CreditCard, CheckCircle2, AlertTriangle, ArrowUpRight, ShieldCheck, Loader2 } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { toast } from 'sonner';

const Fees = () => {
  const fees = {
    total: 5000,
    paid: 3750,
    due: 1250,
    lastPayment: '2025-10-01'
  };

  const [paymentLoading, setPaymentLoading] = useState(false);

  const handlePayment = () => {
    if (fees.due === 0) {
      toast.info('No outstanding dues found.');
      return;
    }
    setPaymentLoading(true);
    setTimeout(() => {
      setPaymentLoading(false);
      toast.success('Fee payment portal initiated successfully!');
    }, 1200);
  };

  const payments = [
    { id: 'PAY-99241', date: '2025-10-01', title: 'Mess & Accommodation Fee', amount: 3750, status: 'Successful' },
    { id: 'PAY-98104', date: '2025-07-15', title: 'Caution Deposit & Hostel Reg', amount: 1500, status: 'Successful' }
  ];

  return (
    <PageContainer>
      <div className="max-w-[900px] mx-auto flex flex-col gap-stack-lg animate-in fade-in duration-300">
        
        {/* Header Section */}
        <header className="flex flex-col gap-stack-sm">
          <div className="flex items-center gap-stack-sm text-primary">
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Fees & Payments</h1>
          </div>
          <p className="font-body-lg text-body-lg text-on-surface-variant">View your residency fee status, outstanding dues, and transaction logs.</p>
        </header>

        {/* Bento Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest p-stack-md rounded-xl security-shadow border border-outline-variant flex flex-col justify-between">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Total Term Fees</span>
            <span className="font-headline-md text-headline-md text-primary mt-2">₹{fees.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="bg-surface-container-lowest p-stack-md rounded-xl security-shadow border border-outline-variant flex flex-col justify-between">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Amount Paid</span>
            <span className="font-headline-md text-headline-md text-[#15803d] mt-2">₹{fees.paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="bg-surface-container-lowest p-stack-md rounded-xl security-shadow border border-outline-variant flex flex-col justify-between">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Outstanding Dues</span>
            <span className="font-headline-md text-headline-md text-[#da3737] mt-2">₹{fees.due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Content Columns: Payment Details & Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Transaction logs table */}
          <section className="lg:col-span-2 flex flex-col gap-6">
            <div className="security-shadow glass-effect rounded-xl overflow-hidden bg-surface-container-lowest p-6 flex flex-col gap-6 border border-outline-variant">
              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
                <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">Payment History</h3>
                <span className="font-label-sm text-label-sm text-secondary">Showing {payments.length} transactions</span>
              </div>

              {/* Payments log table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/30 text-on-surface-variant font-label-sm">
                      <th className="pb-3 pr-2">Transaction ID</th>
                      <th className="pb-3 px-2">Date</th>
                      <th className="pb-3 px-2">Description</th>
                      <th className="pb-3 px-2 text-right">Amount</th>
                      <th className="pb-3 pl-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors font-body-md text-on-surface">
                        <td className="py-3.5 pr-2 font-semibold text-secondary">{p.id}</td>
                        <td className="py-3.5 px-2">{p.date}</td>
                        <td className="py-3.5 px-2">{p.title}</td>
                        <td className="py-3.5 px-2 text-right font-semibold">₹{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3.5 pl-2 text-right">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#15803d] bg-[#dcfce7] px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Right Column: Checkout & Pay card widget */}
          <section className="lg:col-span-1">
            <div className="security-shadow glass-effect rounded-xl overflow-hidden bg-surface-container-lowest p-6 h-full flex flex-col justify-between gap-6 border border-outline-variant">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-4">
                  <CreditCard className="w-5 h-5 text-secondary" />
                  <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">Quick Checkout</h3>
                </div>

                <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2 border border-outline-variant/30">
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Due to Vacate</span>
                  <span className="font-headline-md text-headline-md text-primary font-bold">₹{fees.due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-2 leading-relaxed">
                    Last recorded payment transaction dated {fees.lastPayment}. Term dues must be paid to prevent check-out processing locks.
                  </p>
                </div>
              </div>

              <button 
                onClick={handlePayment}
                disabled={paymentLoading || fees.due === 0}
                className={`w-full text-white font-label-md text-label-md px-6 py-3.5 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all ${
                  paymentLoading 
                    ? 'bg-rose-400 cursor-not-allowed opacity-80'
                    : fees.due === 0 
                      ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                      : 'bg-portal-primary hover:bg-portal-primary/95 shadow-portal-primary/20 hover:scale-[1.01] active:scale-[0.98]'
                }`}
              >
                {paymentLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4 shrink-0" />
                    <span>Pay Dues Online</span>
                  </>
                )}
              </button>
            </div>
          </section>
        </div>

      </div>
    </PageContainer>
  );
};

export default Fees;
