import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Customer, CustomerType } from '../../types';
import { INDIAN_STATES, validateGSTIN, validatePAN } from '../../utils/indianGST';

interface CustomerModalProps {
  initialCustomer?: Customer | null;
  onClose: () => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({ initialCustomer, onClose }) => {
  const { state, saveCustomer } = useApp();
  const bState = state.settings.state;
  const bStateCode = state.settings.stateCode;

  const [name, setName] = useState(initialCustomer?.name || '');
  const [companyName, setCompanyName] = useState(initialCustomer?.companyName || '');
  const [mobile, setMobile] = useState(initialCustomer?.mobile || '');
  const [email, setEmail] = useState(initialCustomer?.email || '');
  const [billingAddress, setBillingAddress] = useState(initialCustomer?.billingAddress || '');
  const [shippingAddress, setShippingAddress] = useState(initialCustomer?.shippingAddress || '');
  const [city, setCity] = useState(initialCustomer?.city || '');
  const [stateName, setStateName] = useState(initialCustomer?.state || bState);
  const [stateCode, setStateCode] = useState(initialCustomer?.stateCode || bStateCode);
  const [pincode, setPincode] = useState(initialCustomer?.pincode || '');
  const [gstin, setGstin] = useState(initialCustomer?.gstin || '');
  const [pan, setPan] = useState(initialCustomer?.pan || '');
  const [customerType, setCustomerType] = useState<CustomerType>(
    initialCustomer?.customerType || 'Regular'
  );
  const [creditLimit, setCreditLimit] = useState<number>(initialCustomer?.creditLimit || 100000);
  const [openingBalance, setOpeningBalance] = useState<number>(
    initialCustomer?.openingBalance || 0
  );

  const [error, setError] = useState('');

  const handleStateChange = (code: string) => {
    const st = INDIAN_STATES.find(s => s.code === code);
    if (!st) return;
    setStateCode(st.code);
    setStateName(st.name);
  };

  const handleGstinChange = (val: string) => {
    const clean = val.toUpperCase().trim();
    setGstin(clean);
    if (clean.length === 15) {
      const res = validateGSTIN(clean);
      if (res.isValid) {
        if (res.stateCode) handleStateChange(res.stateCode);
        if (res.pan) setPan(res.pan);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() && !companyName.trim()) {
      setError('Please provide either customer name or company name');
      return;
    }

    if (gstin.trim()) {
      const gstinVal = validateGSTIN(gstin);
      if (!gstinVal.isValid) {
        setError(`Invalid GSTIN format: ${gstinVal.error}`);
        return;
      }
    }

    const newCust: Customer = {
      id: initialCustomer ? initialCustomer.id : `CUST-${Date.now()}`,
      customerId: initialCustomer
        ? initialCustomer.customerId
        : `CUST-${(state.customers.length + 1).toString().padStart(3, '0')}`,
      name: name.trim(),
      companyName: companyName.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      billingAddress: billingAddress.trim(),
      shippingAddress: shippingAddress.trim() || billingAddress.trim(),
      city: city.trim(),
      state: stateName,
      stateCode,
      pincode: pincode.trim(),
      gstin: gstin.trim().toUpperCase(),
      pan: pan.trim().toUpperCase(),
      customerType,
      creditLimit: Number(creditLimit) || 0,
      openingBalance: Number(openingBalance) || 0,
      currentBalance: initialCustomer
        ? initialCustomer.currentBalance
        : Number(openingBalance) || 0,
      createdAt: initialCustomer ? initialCustomer.createdAt : new Date().toISOString().substring(0, 10),
    };

    saveCustomer(newCust);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <h2 className="text-base font-bold text-white">
            {initialCustomer ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Company / Trade Name</label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g. Apex Infotech Solutions Pvt Ltd"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Contact Person Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Anil Singhania"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Mobile / Phone</label>
              <input
                type="text"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                placeholder="+91 98200 11223"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 bg-white outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="accounts@apexinfotech.co.in"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white outline-hidden"
              />
            </div>

            {/* GSTIN & PAN */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                GSTIN (15 Digits)
              </label>
              <input
                type="text"
                maxLength={15}
                value={gstin}
                onChange={e => handleGstinChange(e.target.value)}
                placeholder="27AABCA5678B1Z1"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono uppercase text-slate-900 bg-white outline-hidden"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Auto extracts State Code and PAN
              </span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">PAN Number (10 Digits)</label>
              <input
                type="text"
                maxLength={10}
                value={pan}
                onChange={e => setPan(e.target.value.toUpperCase())}
                placeholder="AABCA5678B"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono uppercase text-slate-900 bg-white outline-hidden"
              />
            </div>

            {/* State selection */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">State & GST Code</label>
              <select
                value={stateCode}
                onChange={e => handleStateChange(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white outline-hidden"
              >
                {INDIAN_STATES.map(s => (
                  <option key={s.code} value={s.code}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Customer Type</label>
              <select
                value={customerType}
                onChange={e => setCustomerType(e.target.value as CustomerType)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white outline-hidden"
              >
                <option value="Regular">Regular (Registered Taxpayer)</option>
                <option value="Composition">Composition Dealer</option>
                <option value="Consumer">Consumer / End-User</option>
                <option value="Unregistered">Unregistered Business</option>
                <option value="SEZ">Special Economic Zone (SEZ)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Billing Address</label>
            <input
              type="text"
              value={billingAddress}
              onChange={e => setBillingAddress(e.target.value)}
              placeholder="Unit #, Building, Street, Area"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Mumbai"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Pincode</label>
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={e => setPincode(e.target.value)}
                placeholder="400063"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 bg-white outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Credit Limit (₹)</label>
              <input
                type="number"
                value={creditLimit}
                onChange={e => setCreditLimit(parseFloat(e.target.value) || 0)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 bg-white outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Opening Balance (₹)</label>
              <input
                type="number"
                value={openingBalance}
                onChange={e => setOpeningBalance(parseFloat(e.target.value) || 0)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 bg-white outline-hidden"
                placeholder="0"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs"
            >
              Save Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
