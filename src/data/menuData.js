export const menuData = {
  categories: [
    {
      id: 'mains',
      name: 'Mains',
      description: 'Main dishes and rice specialties'
    },
    {
      id: 'sides',
      name: 'Sides',
      description: 'Curries, breads and accompaniments'
    },
    {
      id: 'finger-food',
      name: 'Finger Food',
      description: 'Perfect for events and catering'
    },
    {
      id: 'desserts-drinks',
      name: 'Desserts & Drinks',
      description: 'Sweet treats and refreshing beverages'
    }
  ],
  items: [
    // Mains
    {
      id: 'kottu',
      name: 'Kottu',
      category: 'mains',
      price: 25.00,
      description: 'Sri Lankan street food classic with chopped roti, chicken, vegetables, and spices',
      image: '/images/food/chickenkottu-506x405.png',
      dietary: ['spicy'],
      popular: true
    },
    {
      id: 'nasi-goreng',
      name: 'Nasi Goreng',
      category: 'mains',
      price: 25.00,
      description: 'Indonesian-style fried rice with prawns, vegetables, and aromatic spices',
      image: '/images/food/nasigoreng-506x405.png',
      dietary: ['spicy'],
      popular: true
    },
    {
      id: 'rice-curry',
      name: 'Rice & Curry',
      category: 'mains',
      price: 22.00,
      description: 'Traditional rice and curry with your choice of protein',
      image: '/images/food/riceandcurryfish-506x405.png',
      dietary: ['spicy'],
      popular: true,
      variations: [
        { id: 'chicken', name: 'Chicken', price: 22.00 },
        { id: 'fish', name: 'Fish', price: 22.00 }
      ]
    },
    {
      id: 'biriyani',
      name: 'Biriyani',
      category: 'mains',
      price: 20.00,
      description: 'Aromatic basmati rice cooked with spices and your choice of protein',
      image: '/images/food/chickenbiryani-506x405.png',
      dietary: ['spicy'],
      popular: true,
      variations: [
        { id: 'vegetable', name: 'Vegetable', price: 20.00 },
        { id: 'chicken', name: 'Chicken', price: 24.00 },
        { id: 'beef', name: 'Beef', price: 25.00 },
        { id: 'lamb', name: 'Lamb', price: 25.00 }
      ]
    },
    {
      id: 'fried-rice',
      name: 'Fried Rice',
      category: 'mains',
      price: 16.00,
      description: 'Wok-fried rice with fresh vegetables and your choice of protein',
      image: '/images/food/chillichickenfriedrice-506x405.png',
      dietary: ['spicy'],
      popular: true,
      variations: [
        { id: 'chicken', name: 'Chicken', price: 20.00 },
        { id: 'chilli-chicken', name: 'Chilli Chicken', price: 22.00 },
        { id: 'egg', name: 'Egg', price: 18.00 },
        { id: 'vegetable', name: 'Vegetable', price: 16.00 },
        { id: 'seafood', name: 'Seafood', price: 22.00 },
        { id: 'beef', name: 'Beef', price: 22.00 },
        { id: 'lamb', name: 'Lamb', price: 22.00 },
        { id: 'mixed', name: 'Mixed', price: 25.00 }
      ]
    },
    {
      id: 'noodles',
      name: 'Noodles',
      category: 'mains',
      price: 18.00,
      description: 'Stir-fried noodles with vegetables and your choice of protein',
      image: '/images/food/noodles-506x405.png',
      dietary: ['vegetarian'],
      popular: true,
      variations: [
        { id: 'vegetable', name: 'Vegetable', price: 18.00 },
        { id: 'egg', name: 'Egg', price: 18.00 },
        { id: 'chicken', name: 'Chicken', price: 22.00 },
        { id: 'lamb', name: 'Lamb', price: 23.00 },
        { id: 'beef', name: 'Beef', price: 23.00 },
        { id: 'seafood', name: 'Seafood', price: 23.00 },
        { id: 'mixed', name: 'Mixed', price: 25.00 }
      ]
    },
    {
      id: 'lamprais',
      name: 'Lamprais',
      category: 'mains',
      price: 23.00,
      description: 'Traditional Dutch-influenced dish with rice, meat, and vegetables wrapped in banana leaf',
      image: '/images/food/lamprais-506x405.png',
      dietary: ['spicy'],
      variations: [
        { id: 'chicken', name: 'Chicken', price: 23.00 },
        { id: 'mixed', name: 'Mixed', price: 25.00 }
      ]
    },
    {
      id: 'string-hopper-pilau',
      name: 'String Hopper Pilau',
      category: 'mains',
      price: 17.00,
      description: 'Delicate rice flour noodles served with aromatic pilau rice and curry',
      image: '/images/food/stringhopperspilau-506x405.png',
      dietary: ['vegetarian'],
      variations: [
        { id: 'vegetable', name: 'Vegetable', price: 17.00 },
        { id: 'egg', name: 'Egg', price: 18.00 },
        { id: 'chicken', name: 'Chicken', price: 22.00 },
        { id: 'fish', name: 'Fish', price: 25.00 },
        { id: 'lamb', name: 'Lamb', price: 25.00 },
        { id: 'beef', name: 'Beef', price: 24.00 }
      ]
    },

    // Sides
    {
      id: 'butter-chicken',
      name: 'Butter Chicken',
      category: 'sides',
      price: 25.00,
      description: 'Creamy and rich butter chicken curry',
      dietary: ['spicy']
    },
    {
      id: 'sri-lankan-curry',
      name: 'Sri Lankan Curry',
      category: 'sides',
      price: 27.00,
      description: 'Traditional Sri Lankan curry with authentic spices',
      dietary: ['spicy']
    },
    {
      id: 'devilled-chicken',
      name: 'Devilled Chicken',
      category: 'sides',
      price: 27.00,
      description: 'Spicy devilled chicken with onions and peppers',
      dietary: ['spicy']
    },
    {
      id: 'fish-curry',
      name: 'Fish Curry',
      category: 'sides',
      price: 27.00,
      description: 'Traditional fish curry with coconut milk and spices',
      dietary: ['spicy']
    },
    {
      id: 'prawn-curry',
      name: 'Prawn Curry',
      category: 'sides',
      price: 30.00,
      description: 'Rich prawn curry with aromatic spices',
      dietary: ['spicy']
    },
    {
      id: 'lamb-curry',
      name: 'Lamb Curry',
      category: 'sides',
      price: 27.00,
      description: 'Tender lamb curry with traditional spices',
      dietary: ['spicy']
    },
    {
      id: 'beef-curry',
      name: 'Beef Curry',
      category: 'sides',
      price: 27.00,
      description: 'Hearty beef curry with rich flavors',
      dietary: ['spicy']
    },
    {
      id: 'plain-naan',
      name: 'Plain Naan',
      category: 'sides',
      price: 4.00,
      description: 'Soft and fluffy plain naan bread',
      dietary: ['vegetarian']
    },
    {
      id: 'garlic-naan',
      name: 'Garlic Naan',
      category: 'sides',
      price: 4.50,
      description: 'Garlic-flavored naan bread with herbs',
      dietary: ['vegetarian']
    },

    // Finger Food
    {
      id: 'chicken-rolls',
      name: 'Chicken Rolls',
      category: 'finger-food',
      price: 4.50,
      description: 'Spiced chicken wrapped in roti with fresh vegetables',
      dietary: ['spicy']
    },
    {
      id: 'chicken-roti',
      name: 'Chicken Roti',
      category: 'finger-food',
      price: 5.00,
      description: 'Chicken wrapped in soft roti bread',
      dietary: ['spicy']
    },
    {
      id: 'egg-roti',
      name: 'Egg Roti',
      category: 'finger-food',
      price: 5.00,
      description: 'Egg wrapped in soft roti bread',
      dietary: ['vegetarian']
    },
    {
      id: 'rolls-chicken-lamb-fish',
      name: 'Rolls (Chicken/Lamb/Fish)',
      category: 'finger-food',
      price: 4.50,
      description: 'Choice of chicken, lamb, or fish rolls',
      dietary: ['spicy']
    },
    {
      id: 'rolls-vegetable',
      name: 'Rolls (Vegetable)',
      category: 'finger-food',
      price: 3.50,
      description: 'Vegetable rolls with fresh ingredients',
      dietary: ['vegetarian']
    },
    {
      id: 'rolls-fish-egg',
      name: 'Rolls (Fish & Egg)',
      category: 'finger-food',
      price: 5.00,
      description: 'Fish and egg combination rolls',
      dietary: ['spicy']
    },
    {
      id: 'roti-chicken-lamb-fish',
      name: 'Roti (Chicken/Lamb/Fish)',
      category: 'finger-food',
      price: 5.00,
      description: 'Choice of chicken, lamb, or fish wrapped in roti',
      dietary: ['spicy']
    },
    {
      id: 'fish-cutlets',
      name: 'Fish Cutlets',
      category: 'finger-food',
      price: 2.50,
      description: 'Spiced fish patties coated in breadcrumbs and fried',
      dietary: ['spicy']
    },

    // Desserts & Drinks
    {
      id: 'ice-cream',
      name: 'Ice Cream',
      category: 'desserts-drinks',
      price: 3.50,
      description: 'Creamy vanilla ice cream',
      dietary: ['vegetarian']
    },
    {
      id: 'creme-caramel',
      name: 'Crème Caramel',
      category: 'desserts-drinks',
      price: 9.00,
      description: 'Smooth caramel custard dessert',
      dietary: ['vegetarian']
    },
    {
      id: 'wattalappam',
      name: 'Wattalappam',
      category: 'desserts-drinks',
      price: 9.00,
      description: 'Coconut custard pudding with jaggery and spices',
      dietary: ['vegetarian']
    },
    {
      id: 'biscuit-pudding',
      name: 'Biscuit Pudding',
      category: 'desserts-drinks',
      price: 9.00,
      description: 'Layered biscuit pudding with cream',
      dietary: ['vegetarian']
    },
    {
      id: 'faluda',
      name: 'Faluda',
      category: 'desserts-drinks',
      price: 8.50,
      description: 'Sweet rose-flavored drink with vermicelli and ice cream',
      dietary: ['vegetarian']
    },
    {
      id: 'mango-lassi',
      name: 'Mango Lassi',
      category: 'desserts-drinks',
      price: 8.50,
      description: 'Refreshing mango yogurt drink',
      dietary: ['vegetarian']
    },
    {
      id: 'woodapple-shake',
      name: 'Woodapple Shake',
      category: 'desserts-drinks',
      price: 8.50,
      description: 'Unique woodapple fruit shake',
      dietary: ['vegetarian']
    },
    {
      id: 'tea-coffee',
      name: 'Tea / Coffee',
      category: 'desserts-drinks',
      price: 4.00,
      description: 'Hot tea or coffee',
      dietary: ['vegetarian']
    }
  ]
};

export const getItemsByCategory = (categoryId) => {
  return menuData.items.filter(item => item.category === categoryId);
};

export const getPopularItems = () => {
  return menuData.items.filter(item => item.popular);
};

export const getCategories = () => {
  return menuData.categories;
}; 