import React, { useState } from 'react';
import {
  Building2,
  Database,
  Download,
  Hash,
  Percent,
  RefreshCw,
  Save,
  Upload,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BusinessSettings } from '../../types';
import { INDIAN_STATES, validateGSTIN, validatePAN } from '../../utils/indianGST';
import { BrandLogo } from '../common/BrandLogo';

export const SettingsView: React.FC = () => {
  const { state, updateSettings, backupData, restoreData, resetToDemo, showToast } = useApp();
  const [formData, setFormData] = useState<BusinessSettings>(state.settings);
  const [restoreFileText, setRestoreFileText] = useState('');

  const handleChange = (field: keyof BusinessSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStateChange = (code: string) => {
    const st = INDIAN_STATES.find(s => s.code === code);
    if (!st) return;
    setFormData(prev => ({
      ...prev,
      stateCode: st.code,
      state: st.name,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate GSTIN if present
    if (formData.gstin.trim()) {
      const gstinVal = validateGSTIN(formData.gstin);
      if (!gstinVal.isValid) {
        showToast(`Warning: Business GSTIN format issue: ${gstinVal.error}`, 'error');
        return;
      }
    }

    updateSettings(formData);
  };

  const handleFileRestoreUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const text = evt.target?.result as string;
      if (text) {
        if (confirm('Restore database from this backup? Existing records will be replaced.')) {
          restoreData(text);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-xs">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Business Profile & GSTIN */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Company Identity & GST Registration
            </h3>
          </div>

          {/* Logo & Brand Display Preview & Custom Logo Upload */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <BrandLogo
                  variant="icon"
                  size="lg"
                  logoUrl={formData.logoUrl}
                  businessName={formData.businessName}
                  className="shrink-0"
                />
                <div>
                  <h4
                    className="text-base font-serif font-black tracking-tight"
                    style={{ color: '#3d2514', fontFamily: 'Georgia, "Times New Roman", serif' }}
                  >
                    {formData.businessName}
                  </h4>
                  <p className="text-[11px] text-amber-800 font-medium">
                    Official Brand Emblem & Invoice Seal ({formData.tradeName || 'Mr,farmercorp'})
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-500 mt-1">
                    <span>GSTIN: <strong className="text-slate-800">{formData.gstin}</strong></span>
                    <span>•</span>
                    <span>PAN: <strong className="text-slate-800">{formData.pan}</strong></span>
                    <span>•</span>
                    <span>Mobile: <strong className="text-slate-800">{formData.phone}</strong></span>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap">
                ✓ Printed on Invoices & Reports
              </div>
            </div>

            {/* Custom Logo Upload / URL Controller */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium rounded-lg text-xs transition-colors shadow-xs">
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Upload Logo Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = ev => {
                        const dataUrl = ev.target?.result as string;
                        if (dataUrl) {
                          handleChange('logoUrl', dataUrl);
                          showToast('Custom logo uploaded successfully! Click "Save Settings" below to store.', 'success');
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>

                {formData.logoUrl && formData.logoUrl !== '/logo.svg' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleChange('logoUrl', '/logo.svg');
                      showToast('Logo reset to default Mr. Farmer Corp emblem.', 'info');
                    }}
                    className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg bg-white text-xs transition-colors"
                  >
                    Reset to Default Emblem
                  </button>
                )}
              </div>

              <div className="text-[11px] text-slate-500">
                Supports PNG, SVG, JPG, WebP. Automatically scaled for tax invoice headers.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Legal Business Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={e => handleChange('businessName', e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Trade / Brand Name</label>
              <input
                type="text"
                value={formData.tradeName || ''}
                onChange={e => handleChange('tradeName', e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Business GSTIN (15 Digits) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={15}
                required
                value={formData.gstin}
                onChange={e => {
                  const clean = e.target.value.toUpperCase();
                  handleChange('gstin', clean);
                  if (clean.length === 15) {
                    const res = validateGSTIN(clean);
                    if (res.isValid && res.stateCode) handleStateChange(res.stateCode);
                    if (res.isValid && res.pan) handleChange('pan', res.pan);
                  }
                }}
                className="w-full border border-slate-300 rounded-lg p-2 font-mono uppercase font-bold text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Business PAN (10 Digits)</label>
              <input
                type="text"
                maxLength={10}
                required
                value={formData.pan}
                onChange={e => handleChange('pan', e.target.value.toUpperCase())}
                className="w-full border border-slate-300 rounded-lg p-2 font-mono uppercase text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Phone / Mobile</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => handleChange('phone', e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 font-mono text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Billing Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Registered Office Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => handleChange('address', e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={e => handleChange('city', e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">State & GST Code</label>
              <select
                value={formData.stateCode}
                onChange={e => handleStateChange(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 bg-white"
              >
                {INDIAN_STATES.map(s => (
                  <option key={s.code} value={s.code}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">PIN Code</label>
              <input
                type="text"
                maxLength={6}
                value={formData.pincode}
                onChange={e => handleChange('pincode', e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 font-mono text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Current Financial Year</label>
              <input
                type="text"
                value={formData.financialYear}
                onChange={e => handleChange('financialYear', e.target.value)}
                placeholder="2026-27"
                className="w-full border border-slate-300 rounded-lg p-2 font-mono text-slate-900 bg-white font-bold"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Bank & UPI Payment Details */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Default Bank & UPI Remittance Details (Printed on Invoices)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Bank Name</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={e => handleChange('bankName', e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Account Number</label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={e => handleChange('accountNumber', e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 font-mono text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">IFSC Code</label>
              <input
                type="text"
                maxLength={11}
                value={formData.ifscCode}
                onChange={e => handleChange('ifscCode', e.target.value.toUpperCase())}
                className="w-full border border-slate-300 rounded-lg p-2 font-mono uppercase text-slate-900 bg-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Bank Branch</label>
              <input
                type="text"
                value={formData.branch}
                onChange={e => handleChange('branch', e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Official UPI ID</label>
              <input
                type="text"
                value={formData.upiId}
                onChange={e => handleChange('upiId', e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 font-mono text-emerald-700 font-semibold bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Document Numbering Series */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Hash className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Document Numbering Series Configuration
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Sales Invoice Prefix</label>
              <input
                type="text"
                value={formData.invoicePrefix}
                onChange={e => handleChange('invoicePrefix', e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 font-mono text-slate-900 bg-white uppercase"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Format: {formData.invoicePrefix}/2026-27/0001
              </span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Purchase Bill Prefix</label>
              <input
                type="text"
                value={formData.purchasePrefix}
                onChange={e => handleChange('purchasePrefix', e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 font-mono text-slate-900 bg-white uppercase"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Credit Note Prefix</label>
              <input
                type="text"
                value={formData.creditNotePrefix}
                onChange={e => handleChange('creditNotePrefix', e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 font-mono text-slate-900 bg-white uppercase"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Debit Note Prefix</label>
              <input
                type="text"
                value={formData.debitNotePrefix}
                onChange={e => handleChange('debitNotePrefix', e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 font-mono text-slate-900 bg-white uppercase"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Terms & Notes Defaults */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b pb-2">
            Default Invoicing Terms & Customer Notes
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Default Payment Terms</label>
              <textarea
                rows={2}
                value={formData.defaultPaymentTerms}
                onChange={e => handleChange('defaultPaymentTerms', e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Default Notes</label>
              <textarea
                rows={2}
                value={formData.defaultNotes}
                onChange={e => handleChange('defaultNotes', e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 bg-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save All Settings</span>
          </button>
        </div>
      </form>

      {/* Section 5: Backup & Disaster Recovery */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <Database className="w-4 h-4 text-slate-800" />
          <h3 className="font-bold text-sm text-slate-900">Database Backup & Disaster Recovery</h3>
        </div>

        <p className="text-slate-600 leading-relaxed">
          All invoices, customer ledgers, inventory stock levels, accounts and audit history can be
          exported into an encrypted or standard JSON backup. You can restore this backup at any
          time or on any workstation.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={backupData}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-lg flex items-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download Database Backup (JSON)</span>
          </button>

          <label className="cursor-pointer px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg flex items-center gap-2">
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Restore From File (JSON)</span>
            <input type="file" accept=".json" onChange={handleFileRestoreUpload} className="hidden" />
          </label>

          <button
            type="button"
            onClick={() => {
              if (confirm('Reset entire application to standard Indian GST demo records?')) {
                resetToDemo();
              }
            }}
            className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold rounded-lg flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
