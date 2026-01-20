import React from 'react';

const VariationSelector = ({ item, onVariationSelect, selectedVariation }) => {
  const variations = item.variations || [];
  const availableVariations = variations.filter(
    (variation) => variation.available !== false
  );

  // Only show variation selector if item has variations
  if (variations.length === 0) {
    return null;
  }

  const handleVariationChange = (event) => {
    const variationId = event.target.value;
    const variation = variations.find(v => v.id === variationId);
    onVariationSelect(variation);
  };

  // Set default variation if none is selected
  const defaultVariation = availableVariations.find(
    (variation) => variation.id === selectedVariation?.id
  ) || availableVariations[0];

  return (
    <div className="variation-selector">
      <select
        id={`variation-${item.id}`}
        value={defaultVariation ? defaultVariation.id : ''}
        onChange={handleVariationChange}
        className="variation-dropdown"
      >
        {variations.map((variation) => (
          <option
            key={variation.id}
            value={variation.id}
            disabled={variation.available === false}
          >
            {variation.name} - ${variation.price.toFixed(2)}
            {variation.available === false ? ' (Sold Out)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
};

export default VariationSelector; 