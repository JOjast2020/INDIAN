import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ItemType, Product, UnitType } from '../../types';

interface ProductModalProps {
  initialProduct?: Product | null;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ initialProduct, onClose }) => {
  const { state, saveProduct } = useApp();

  const [name, setName] = useState(initialProduct?.name || '');
  const [sku, setSku] = useState(initialProduct?.sku || '');
  const [hsnSac, setHsnSac] = useState(initialProduct?.hsnSac || '8471');
  const [category, setCategory] = useState(initialProduct?.category || 'General');
  const [unit, setUnit] = useState<UnitType>(initialProduct?.unit || 'PCS');
  const [type, setType] = useState<ItemType>(initialProduct?.type || 'Product');
  const [purchasePrice, setPurchasePrice] = useState<number>(initialProduct?.purchasePrice || 0);
  const [sellingPrice, setSellingPrice] = useState<number>(initialProduct?.sellingPrice || 0);
  const [gstRate, setGstRate] = useState<number>(
    initialProduct?.gstRate ?? state.settings.defaultGstRate
  );
  const [openingStock, setOpeningStock] = useState<number>(initialProduct?.openingStock || 0);
  const [currentStock, setCurrentStock] = useState<number>(initialProduct?.currentStock || 0);
  const [minStockLevel, setMinStockLevel] = useState<number>(initialProduct?.minStockLevel || 5);
  const [description, setDescription] = useState(initialProduct?.description || '');

  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Product/Service name is required');
      return;
    }

    const newProd: Product = {
      id: initialProduct ? initialProduct.id : `PRD-${Date.now()}`,
      productId: initialProduct
        ? initialProduct.productId
        : `PRD-${(state.products.length + 1).toString().padStart(3, '0')}`,
      name: name.trim(),
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      hsnSac: hsnSac.trim(),
      category: category.trim() || 'General',
      unit,
      type,
      purchasePrice: Number(purchasePrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      gstRate: Number(gstRate) || 0,
      openingStock: Number(openingStock) || 0,
      currentStock: initialProduct ? Number(currentStock) : Number(openingStock) || 0,
      minStockLevel: Number(minStockLevel) || 0,
      description: description.trim(),
      createdAt: initialProduct ? initialProduct.createdAt : new Date().toISOString().substring(0, 10),
    };

    saveProduct(newProd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <h2 className="text-base font-bold text-white">
            {initialProduct ? 'Edit Product / Service' : 'Add Product / Service'}
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
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">
                Item Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Industrial IoT Edge Gateway 4G"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">SKU / Item Code</label>
              <input
                type="text"
                value={sku}
                onChange={e => setSku(e.target.value)}
                placeholder="e.g. IOT-GW-4G"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                HSN / SAC Code (GST) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={hsnSac}
                onChange={e => setHsnSac(e.target.value)}
                placeholder="84713010 or 998314"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Item Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as ItemType)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white"
              >
                <option value="Product">Product (Inventory tracked)</option>
                <option value="Service">Service (SAC Code)</option>
                <option value="Non-stock">Non-stock Item</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Unit of Measurement</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value as UnitType)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white"
              >
                {(['PCS', 'NOS', 'KG', 'MTR', 'BOX', 'SET', 'HOURS', 'PKT', 'LTR'] as UnitType[]).map(u => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="Hardware, Electronics, Service..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">GST Tax Rate (%)</label>
              <select
                value={gstRate}
                onChange={e => setGstRate(parseFloat(e.target.value) || 0)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white font-mono"
              >
                <option value="0">0% (Nil / Exempt)</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18% (Standard)</option>
                <option value="28">28% (Luxury / High)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Purchase Price (₹)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={purchasePrice}
                onChange={e => setPurchasePrice(parseFloat(e.target.value) || 0)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Selling Price (₹)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={sellingPrice}
                onChange={e => setSellingPrice(parseFloat(e.target.value) || 0)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 bg-white font-semibold text-emerald-700"
              />
            </div>

            {type === 'Product' && (
              <>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {initialProduct ? 'Current Stock' : 'Opening Stock'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={initialProduct ? currentStock : openingStock}
                    onChange={e => {
                      const v = parseFloat(e.target.value) || 0;
                      if (initialProduct) setCurrentStock(v);
                      else setOpeningStock(v);
                    }}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Minimum Reorder Stock Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={minStockLevel}
                    onChange={e => setMinStockLevel(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Triggers low stock alert when inventory falls below this
                  </span>
                </div>
              </>
            )}
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Product Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Technical specs, serial info, etc."
              className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 bg-white"
            />
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
              Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
