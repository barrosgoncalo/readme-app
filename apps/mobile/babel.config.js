module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'react-native-iconify/babel', 
        {
          icons: [
            'material-symbols:verified',
            'lucide:book',
            'lucide:edit',
            'lucide:user-x',
            'lucide:activity',
            'lucide:settings',
            'lucide:heart',
            'lucide:log-out',
            'lucide:chevron-right',
            'solar:medal-star-circle-linear',
          ],
        },
      ],
    ],
  };
};
