import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Supplier } from '../../types';
import { INDIAN_STATES, validateGSTIN } from '../../utils/indianGST';

interface SupplierModalProps {
  initialSupplier?: Supplier | null;
  onClose: () => void;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({ initialSupplier, onClose }) => {
  const { state, saveSupplier } = useApp();
  const bState = state.settings.state;
  const bStateCode = state.settings.stateCode;

  const [name, setName] = useState(initialSupplier?.name || '');
  const [companyName, setCompanyName] = useState(initialSupplier?.companyName || '');
  const [mobile, setMobile] = useState(initialSupplier?.mobile || '');
  const [email, setEmail] = useState(initialSupplier?.email || '');
  const [address, setAddress] = useState(initialSupplier?.address || '');
  const [city, setCity] = useState(initialSupplier?.city || '');
  const [stateName, setStateName] = useState(initialSupplier?.state || bState);
  const [stateCode, setStateCode] = useState(initialSupplier?.stateCode || bStateCode);
  const [pincode, setPincode] = useState(initialSupplier?.pincode || '');
  const [gstin, setGstin] = useState(initialSupplier?.gstin || '');
  const [pan, setPan] = useState(initialSupplier?.pan || '');
  const [openingBalance, setOpeningBalance] = useState<number>(initialSupplier?.openingBalance || 0);

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

    if (!companyName.trim() && !name.trim()) {
      setError('Please provide supplier company name or contact person');
      return;
    }

    if (gstin.trim()) {
      const gstinVal = validateGSTIN(gstin);
      if (!gstinVal.isValid) {
        setError(`Invalid GSTIN format: ${gstinVal.error}`);
        return;
      }
    }

    const newSup: Supplier = {
      id: initialSupplier ? initialSupplier.id : `SUP-${Date.now()}`,
      supplierId: initialSupplier
        ? initialSupplier.supplierId
        : `SUP-${(state.suppliers.length + 1).toString().padStart(3, '0')}`,
      name: name.trim(),
      companyName: companyName.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      state: stateName,
      stateCode,
      pincode: pincode.trim(),
      gstin: gstin.trim().toUpperCase(),
      pan: pan.trim().toUpperCase(),
      openingBalance: Number(openingBalance) || 0,
      currentBalance: initialSupplier
        ? initialSupplier.currentBalance
        : Number(openingBalance) || 0,
      createdAt: initialSupplier ? initialSupplier.createdAt : new Date().toISOString().substring(0, 10),
    };

    saveSupplier(newSup);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <h2 className="text-base font-bold text-white">
            {initialSupplier ? 'Edit Supplier' : 'Add New Supplier'}
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
              <label className="block text-slate-700 font-semibold mb-1">Company / Vendor Name</label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g. Zenith Semiconductors India Ltd"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Contact Person Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Manoj Joshi"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Mobile / Phone</label>
              <input
                type="text"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                placeholder="+91 98900 88776"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="sales@zenithsemi.in"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Supplier GSTIN (15 Digits)</label>
              <input
                type="text"
                maxLength={15}
                value={gstin}
                onChange={e => handleGstinChange(e.target.value)}
                placeholder="27AABCZ1122S1Z4"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono uppercase text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">PAN Number</label>
              <input
                type="text"
                maxLength={10}
                value={pan}
                onChange={e => setPan(e.target.value.toUpperCase())}
                placeholder="AABCZ1122S"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono uppercase text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">State & GST Code</label>
              <select
                value={stateCode}
                onChange={e => handleStateChange(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white"
              >
                {INDIAN_STATES.map(s => (
                  <option key={s.code} value={s.code}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Opening Payable Balance (₹)</label>
              <input
                type="number"
                value={openingBalance}
                onChange={e => setOpeningBalance(parseFloat(e.target.value) || 0)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 bg-white"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Plot / Industrial Area / Street"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Pune"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Pincode</label>
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={e => setPincode(e.target.value)}
                placeholder="411026"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 bg-white"
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
              className="px-5 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-lg shadow-xs"
            >
              Save Supplier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
