export default function (api) {
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
                        'lucide:user',
                        'lucide:user-x',
                        'lucide:activity',
                        'lucide:settings',
                        'lucide:heart',
                        'lucide:log-out',
                        'lucide:chevron-right',
                        'lucide:arrow-left',
                        'lucide:calendar',
                        'lucide:chevron-down',
                        'lucide:globe',
                        'lucide:trash-2',
                        'lucide:image',
                        'lucide:camera',
                        'lucide:map',
                        'mdi:home',
                        'lucide:lock',
                        'solar:medal-star-circle-linear',
                        'solar:moon-outline',
                        'fluent:presence-blocked-10-regular',
                        'fluent:home-24-filled',
                        'fluent:home-24-regular',
                        'fluent:add-24-filled',
                        'fluent:add-24-regular',
                        'fluent:person-24-filled',
                        'fluent:person-24-regular',
                        'fluent:library-24-regular',
                        'fluent:library-24-filled',
                        'fluent:alert-24-regular',
                        'fluent:alert-off-24-regular',
                        'fluent:add-circle-12-filled',
                        'fluent:caret-right-24-filled',
                        'material-symbols:password',
                        'material-symbols-light:verified-rounded',
                        'material-symbols-light:home-outline-rounded',
                        'material-symbols:edit-rounded',
                        'uiw:user-delete',


                    ],
                },
            ],
        ],
    };
};
