module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        // A magia estava aqui: mudou de /plugin para /babel
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
            'mdi:home',
          ],
        },
      ],
    ],
  };
};
