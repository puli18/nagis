import React from 'react';

const VariationSelector = ({ item, onVariationSelect, selectedVariation }) => {
  // Only show variation selector if item has variations
  if (!item.variations || item.variations.length === 0) {
    return null;
  }

  const handleVariationChange = (event) => {
    const variationId = event.target.value;
    const variation = item.variations.find(v => v.id === variationId);
    onVariationSelect(variation);
  };

  // Set default variation if none is selected
  const defaultVariation = selectedVariation || item.variations[0];

  return (
    <div className="variation-selector">
      <select
        id={`variation-${item.id}`}
        value={defaultVariation ? defaultVariation.id : ''}
        onChange={handleVariationChange}
        className="variation-dropdown"
      >
        {item.variations.map((variation) => (
          <option key={variation.id} value={variation.id}>
            {variation.name} - ${variation.price.toFixed(2)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default VariationSelector; 