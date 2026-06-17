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
            'lucide:arrow-left',
            'lucide:calendar',
            'lucide:chevron-down',
            'solar:medal-star-circle-linear',
            'fluent:presence-blocked-10-regular',
            'material-symbols:password',
          ],
        },
      ],
    ],
  };
};
