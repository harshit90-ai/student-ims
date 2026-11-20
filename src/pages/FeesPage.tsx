import { useMemo, useState } from 'react';
import { CreditCard, DollarSign, Printer, Receipt, Search, X } from 'lucide-react';
import { simsApi } from '../services/api';
import type { AuthUser, FeeRecord, PaymentTransaction } from '../types/sims';

interface FeesPageProps {
  user: AuthUser;
  fees: FeeRecord[];
  onUpdated: (updated: FeeRecord) => void;
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export function FeesPage({ user, fees, onUpdated, onNotify }: FeesPageProps) {
  const isStudent = user.role === 'student';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Partial' | 'Pending'>('All');

  const [payTarget, setPayTarget] = useState<FeeRecord | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<PaymentTransaction['method']>('Online Portal');
  const [paying, setPaying] = useState(false);

  const [receiptFee, setReceiptFee] = useState<FeeRecord | null>(null);

  const visibleFees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return fees.filter((f) => {
      if (isStudent && user.linkedEntityId && f.studentId !== user.linkedEntityId) return false;
      if (statusFilter !== 'All' && f.status !== statusFilter) return false;
      if (
        q &&
        !f.studentName.toLowerCase().includes(q) &&
        !f.registrationNumber.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [fees, isStudent, user.linkedEntityId, statusFilter, search]);

  const totals = useMemo(() => {
    const total = visibleFees.reduce((s, f) => s + f.totalFee, 0);
    const paid = visibleFees.reduce((s, f) => s + f.paidFee, 0);
    const pending = visibleFees.reduce((s, f) => s + f.pendingFee, 0);
    return { total, paid, pending };
  }, [visibleFees]);

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payTarget) return;
    setPaying(true);
    try {
      const res = await simsApi.payFee(payTarget.id, {
        amount: payAmount,
        method: payMethod,
        actor: user.name,
      });
      onUpdated(res.fee);
      setPayTarget(null);
      setReceiptFee(res.fee);
      onNotify(
        'success',
        'Payment Recorded',
        `Receipt ${res.receipt.receiptNo} generated for $${res.receipt.amount.toLocaleString()}.`
      );
    } catch (err) {
      onNotify('error', 'Payment Error', err instanceof Error ? err.message : 'Failed');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Billed Tuition</span>
            <DollarSign className="w-4 h-4 text-[#0B1F3A]" />
          </div>
          <p className="font-display text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            ${totals.total.toLocaleString()}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Collected</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-display text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-2">
            ${totals.paid.toLocaleString()}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Pending Balance</span>
            <Receipt className="w-4 h-4 text-amber-600" />
          </div>
          <p className="font-display text-2xl font-bold font-mono tabular-nums text-amber-700 mt-2">
            ${totals.pending.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      {!isStudent && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student or registration ID..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['All', 'Paid', 'Partial', 'Pending'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  statusFilter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fee Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Course · Sem</th>
                <th className="px-4 py-3 font-semibold text-right">Total Fee</th>
                <th className="px-4 py-3 font-semibold text-right">Paid</th>
                <th className="px-4 py-3 font-semibold text-right">Pending</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleFees.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{f.studentName}</p>
                    <p className="text-[11px] font-mono text-slate-500">{f.registrationNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {f.course} · Sem {f.semester}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-right text-slate-900">
                    ${f.totalFee.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-right text-emerald-700 font-semibold">
                    ${f.paidFee.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-right text-amber-700 font-semibold">
                    ${f.pendingFee.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    <span
                      className={
                        f.status === 'Paid'
                          ? 'text-emerald-700'
                          : f.status === 'Partial'
                          ? 'text-amber-700'
                          : 'text-rose-600'
                      }
                    >
                      {f.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      {f.pendingFee > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setPayTarget(f);
                            setPayAmount(f.pendingFee);
                          }}
                          className="px-2.5 py-1.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-semibold rounded-md"
                        >
                          {isStudent ? 'Pay Online' : 'Record Payment'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setReceiptFee(f)}
                        className="px-2.5 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-md"
                      >
                        Receipt
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {payTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-slate-900">Record Fee Payment</h3>
              <button type="button" onClick={() => setPayTarget(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handlePaySubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="font-semibold text-slate-900">{payTarget.studentName}</p>
                <p className="text-slate-600 font-mono mt-0.5">
                  Pending Balance: ${payTarget.pendingFee.toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Amount ($)</label>
                <input
                  type="number"
                  min={1}
                  max={payTarget.pendingFee}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentTransaction['method'])}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Online Portal">Online Portal</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Debit / Credit Card</option>
                  <option value="Check">Institutional Check</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setPayTarget(null)} className="px-4 py-2 border border-slate-300 rounded-lg font-semibold">Cancel</button>
                <button type="submit" disabled={paying} className="px-4 py-2 bg-[#1D4ED8] text-white rounded-lg font-semibold">
                  {paying ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Fee Receipt Modal */}
      {receiptFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden print-only-container">
            <div className="bg-[#0B1F3A] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold">cgc University Bursar</h3>
                <p className="text-xs text-blue-200">Official Tuition Fee Statement & Receipt</p>
              </div>
              <button type="button" onClick={() => setReceiptFee(null)} className="text-slate-300 hover:text-white no-print">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-slate-500">Student Name</p>
                  <p className="font-semibold text-sm text-slate-900">{receiptFee.studentName}</p>
                  <p className="text-slate-600 mt-0.5">{receiptFee.course} · Sem {receiptFee.semester}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Registration No.</p>
                  <p className="font-mono font-bold text-slate-900">{receiptFee.registrationNumber}</p>
                  <p className="text-slate-500 mt-1">Academic Year {receiptFee.academicYear}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-slate-500">Total Fee</p>
                  <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">${receiptFee.totalFee.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-500">Paid</p>
                  <p className="font-mono font-bold text-emerald-700 text-sm mt-0.5">${receiptFee.paidFee.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-500">Balance</p>
                  <p className="font-mono font-bold text-amber-700 text-sm mt-0.5">${receiptFee.pendingFee.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-slate-900 mb-2">Payment Transaction History</p>
                {receiptFee.paymentHistory.length === 0 ? (
                  <p className="text-slate-500 italic">No payments recorded yet.</p>
                ) : (
                  <table className="w-full text-left border border-slate-200">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Receipt #</th>
                        <th className="px-3 py-2 font-semibold">Date</th>
                        <th className="px-3 py-2 font-semibold">Method</th>
                        <th className="px-3 py-2 font-semibold text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {receiptFee.paymentHistory.map((tx) => (
                        <tr key={tx.receiptNo}>
                          <td className="px-3 py-2 font-mono font-semibold text-blue-700">{tx.receiptNo}</td>
                          <td className="px-3 py-2 font-mono">{tx.date}</td>
                          <td className="px-3 py-2">{tx.method}</td>
                          <td className="px-3 py-2 font-mono font-semibold text-right">${tx.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 no-print">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1D4ED8] text-white font-semibold rounded-lg"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptFee(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

