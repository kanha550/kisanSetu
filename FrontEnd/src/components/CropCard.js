import React, { useState } from 'react';
import { MapPin, User, ShoppingCart, Edit, Trash2 } from 'lucide-react';

function CropCard({ crop, onAddToCart, onEdit, onDelete, viewMode = 'buyer' }) {
  const [qty, setQty] = useState(1);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:550${imagePath}`;
  };

  const getStockBadgeColor = (quantity) => {
    if (quantity === 0) return 'bg-red-100 text-red-800 border-red-200';
    if (quantity < 100) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  };

  const handleAddToCart = () => {
    if (qty <= 0 || qty > crop.quantity) return;
    onAddToCart(crop, parseInt(qty));
    alert(`${qty}kg of ${crop.name} added to cart!`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-150 overflow-hidden transition-all duration-300 transform hover:-translate-y-1 text-left flex flex-col h-full">
      {/* Header Image & Badges */}
      <div className="relative h-48 bg-stone-100 overflow-hidden">
        <img
          src={getImageUrl(crop.image)}
          alt={crop.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute top-3 left-3 bg-emerald-600/90 text-white font-bold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
          {crop.category}
        </div>
        <div className={`absolute top-3 right-3 border font-semibold text-xs px-2.5 py-1 rounded-full backdrop-blur-sm ${getStockBadgeColor(crop.quantity)}`}>
          {crop.quantity === 0 ? 'Out of Stock' : `${crop.quantity}kg Available`}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5 flex-grow flex flex-col">
        <h3 className="text-xl font-bold text-emerald-950 mb-1 line-clamp-1">{crop.name}</h3>
        
        <p className="text-xs text-gray-400 mb-3 flex items-center">
          <MapPin className="h-3 w-3 mr-1 text-amber-500" />
          {crop.location}
        </p>

        <p className="text-sm text-gray-600 line-clamp-2 mb-4 h-10">
          {crop.description || 'Fresh crop available directly from the farm fields, ensuring prime quality and nutritional value.'}
        </p>

        {crop.farmer && (
          <div className="flex items-center space-x-2 border-t border-gray-100 pt-3 mb-4">
            <div className="bg-emerald-50 p-1.5 rounded-full text-emerald-700 flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
            <div className="text-xs">
              <p className="font-semibold text-emerald-900">{crop.farmer.name}</p>
              <p className="text-gray-400 font-medium">{crop.farmer.phone}</p>
            </div>
          </div>
        )}

        {/* Pricing & Footer Actions */}
        <div className="mt-auto border-t border-gray-100 pt-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Price</p>
            <p className="text-2xl font-black text-emerald-800">
              ₹{crop.price}<span className="text-xs font-bold text-gray-500"> / kg</span>
            </p>
          </div>

          {viewMode === 'buyer' && crop.quantity > 0 && (
            <div className="flex flex-col items-end space-y-2">
              <div className="flex items-center space-x-1 border border-gray-200 rounded-lg p-1 bg-gray-50">
                <span className="text-xs font-semibold px-1 text-gray-500">Qty:</span>
                <input
                  type="number"
                  min="1"
                  max={crop.quantity}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Math.min(crop.quantity, parseInt(e.target.value) || 1)))}
                  className="w-12 text-center text-sm font-bold bg-transparent focus:outline-none"
                />
                <span className="text-[10px] text-gray-400 pr-1">kg</span>
              </div>
              <button
                onClick={handleAddToCart}
                className="bg-emerald-600 hover:bg-emerald-505 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm hover:shadow flex items-center space-x-1.5 cursor-pointer"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>Add to Cart</span>
              </button>
            </div>
          )}

          {viewMode === 'farmer' && (
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(crop)}
                className="p-2 border border-amber-300 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                title="Edit Listing"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(crop._id)}
                className="p-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                title="Delete Listing"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}

          {viewMode === 'admin' && (
            <button
              onClick={() => onDelete(crop._id)}
              className="px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Flag & Remove</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CropCard;
