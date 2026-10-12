/**
 * Helper utility to provide authentic train imagery, amenities, and badges
 */

export const getTrainImageUrl = (train) => {
  if (train?.image_url) return train.image_url;
  if (train?.display_image_url) return train.display_image_url;

  const name = (train?.train_name || '').toLowerCase();
  const num = String(train?.train_number || '');

  if (name.includes('vande bharat') || num.startsWith('206') || num.startsWith('209') || num.startsWith('224')) {
    return '/images/trains/vande-bharat.jpg';
  }
  if (name.includes('tejas')) {
    return '/images/trains/tejas.jpg';
  }
  if (name.includes('rajdhani') || num.startsWith('1295') || num.startsWith('2222') || num.startsWith('1230')) {
    return '/images/trains/rajdhani.jpg';
  }
  if (name.includes('shatabdi') || name.includes('duronto')) {
    return '/images/trains/shatabdi.jpg';
  }
  return '/images/trains/dudhsagar.jpg';
};

export const getTrainTypeBadge = (train) => {
  const name = (train?.train_name || '').toLowerCase();
  if (name.includes('vande bharat')) {
    return {
      label: 'Vande Bharat Express',
      speed: '160 km/h',
      tag: 'Semi-High Speed',
      gradient: 'from-blue-600 to-indigo-700',
    };
  }
  if (name.includes('tejas')) {
    return {
      label: 'Tejas Superfast',
      speed: '130 km/h',
      tag: 'Smart Express',
      gradient: 'from-amber-500 to-orange-600',
    };
  }
  if (name.includes('rajdhani')) {
    return {
      label: 'Rajdhani Express',
      speed: '130 km/h',
      tag: 'Premier Superfast',
      gradient: 'from-red-600 to-rose-700',
    };
  }
  if (name.includes('shatabdi')) {
    return {
      label: 'Shatabdi Express',
      speed: '130 km/h',
      tag: 'Intercity Express',
      gradient: 'from-sky-600 to-blue-700',
    };
  }
  if (name.includes('duronto')) {
    return {
      label: 'Duronto Express',
      speed: '120 km/h',
      tag: 'Point-to-Point SF',
      gradient: 'from-emerald-600 to-teal-700',
    };
  }
  return {
    label: 'Superfast Express',
    speed: '110 km/h',
    tag: 'Indian Railways SF',
    gradient: 'from-slate-700 to-slate-800',
  };
};

export const getTrainAmenities = (train) => {
  const name = (train?.train_name || '').toLowerCase();
  if (name.includes('vande bharat')) {
    return [
      { id: 'wifi', label: 'Wi-Fi', icon: 'wifi' },
      { id: 'food', label: 'Catering', icon: 'food' },
      { id: 'ac', label: 'AC Climate', icon: 'ac' },
      { id: 'power', label: 'USB Port', icon: 'power' },
      { id: 'doors', label: 'Auto Doors', icon: 'door' },
    ];
  }
  if (name.includes('rajdhani') || name.includes('tejas')) {
    return [
      { id: 'food', label: 'Pantry Meals', icon: 'food' },
      { id: 'ac', label: 'AC Coaches', icon: 'ac' },
      { id: 'bed', label: 'Bedroll', icon: 'bed' },
      { id: 'power', label: 'Charging', icon: 'power' },
    ];
  }
  return [
    { id: 'food', label: 'Pantry', icon: 'food' },
    { id: 'power', label: 'Charging', icon: 'power' },
    { id: 'ac', label: 'AC Available', icon: 'ac' },
  ];
};
