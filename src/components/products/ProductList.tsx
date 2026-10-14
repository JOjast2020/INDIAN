import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Download,
  Edit2,
  Package,
  Plus,
  Search,
  Tag,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { formatINR } from '../../utils/indianGST';

interface ProductListProps {
  onOpenCreateModal: () => void;
  onEditProduct: (p: Product) => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  onOpenCreateModal,
  onEditProduct,
}) => {
  const { state, deleteProduct, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = useMemo(() => {
    const set = new Set<string>();
    state.products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [state.products]);

  const filteredProducts = useMemo(() => {
    return state.products.filter(p => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.hsnSac.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = typeFilter === 'all' || p.type === typeFilter;
      const matchCat = categoryFilter === 'all' || p.category === categoryFilter;

      return matchSearch && matchType && matchCat;
    });
  }, [state.products, searchTerm, typeFilter, categoryFilter]);

  // Aggregates
  const totalStockItems = state.products.filter(p => p.type === 'Product').length;
  const totalInventoryValue = state.products
    .filter(p => p.type === 'Product')
    .reduce((sum, p) => sum + p.currentStock * p.purchasePrice, 0);

  const lowStockCount = state.products.filter(
    p => p.type === 'Product' && p.currentStock <= p.minStockLevel
  ).length;

  const handleExportCSV = () => {
    if (filteredProducts.length === 0) {
      showToast('No products to export', 'info');
      return;
    }
    const headers = [
      'Product ID',
      'Name',
      'SKU',
      'HSN/SAC',
      'Category',
      'Type',
      'Unit',
      'Purchase Price',
      'Selling Price',
      'GST Rate',
      'Current Stock',
      'Min Reorder Level',
    ];

    const rows = filteredProducts.map(p => [
      `"${p.productId}"`,
      `"${p.name}"`,
      `"${p.sku}"`,
      `"${p.hsnSac}"`,
      `"${p.category}"`,
      `"${p.type}"`,
      `"${p.unit}"`,
      p.purchasePrice,
      p.sellingPrice,
      p.gstRate,
      p.currentStock,
      p.minStockLevel,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Inventory_Products_${new Date().toISOString().substring(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Inventory exported successfully.');
  };

  return (
    <div className="space-y-6">
      {/* Aggregates Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Catalog Items</span>
          <div className="mt-1 text-xl font-bold font-mono text-slate-900">{state.products.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{totalStockItems} physical inventory items</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-indigo-600">Total Inventory Valuation (Cost)</span>
          <div className="mt-1 text-xl font-bold font-mono text-indigo-700">
            {formatINR(totalInventoryValue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Asset value in stock warehouse</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-amber-600 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Alerts</span>
          </span>
          <div className="mt-1 text-xl font-bold font-mono text-amber-700">{lowStockCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Items at or below reorder threshold</div>
        </div>
      </div>

      {/* Filter and Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search product name, SKU, HSN code..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-2 text-xs bg-white text-slate-700 outline-hidden"
          >
            <option value="all">All Types</option>
            <option value="Product">Product</option>
            <option value="Service">Service</option>
            <option value="Non-stock">Non-stock</option>
          </select>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-2 text-xs bg-white text-slate-700 outline-hidden max-w-[150px] truncate"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Item Code</th>
                <th className="px-4 py-3">Product Name & Category</th>
                <th className="px-4 py-3">HSN/SAC</th>
                <th className="px-4 py-3 text-center">Type</th>
                <th className="px-4 py-3 text-right">Cost Price</th>
                <th className="px-4 py-3 text-right">Selling Price</th>
                <th className="px-4 py-3 text-center">GST %</th>
                <th className="px-4 py-3 text-center">In Stock</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    No items found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const isLowStock = p.type === 'Product' && p.currentStock <= p.minStockLevel;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{p.productId}</td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono">SKU: {p.sku}</span>
                          <span>•</span>
                          <span className="text-slate-600">{p.category}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] font-semibold text-slate-800">
                        {p.hsnSac}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            p.type === 'Product'
                              ? 'bg-blue-50 text-blue-700'
                              : p.type === 'Service'
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.type}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {formatINR(p.purchasePrice)}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                        {formatINR(p.sellingPrice)}
                      </td>

                      <td className="px-4 py-3 text-center font-mono text-slate-800">{p.gstRate}%</td>

                      <td className="px-4 py-3 text-center">
                        {p.type === 'Product' ? (
                          <div className="inline-flex items-center gap-1">
                            <span
                              className={`font-mono font-bold ${
                                isLowStock ? 'text-amber-600' : 'text-slate-900'
                              }`}
                            >
                              {p.currentStock} {p.unit}
                            </span>
                            {isLowStock && (
                              <span
                                className="px-1.5 py-0.2 rounded-xs bg-amber-100 text-amber-800 text-[9px] font-bold"
                                title={`Low Stock! Reorder level: ${p.minStockLevel}`}
                              >
                                Low
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditProduct(p)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Remove product ${p.name}?`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
