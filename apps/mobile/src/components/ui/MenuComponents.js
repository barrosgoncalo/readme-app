// @readme/shared/src/components/MenuComponents.js
import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { Iconify } from 'react-native-iconify';

export const MenuGroup = ({ children, styles, bgColor }) => (
    <View style={[styles.menuGroup, { backgroundColor: bgColor }]}>
        {children}
    </View>
);

export const MenuItem = ({ icon, label, textColor, iconColor, iconBgColor = null, theme, styles, onPress }) => {
    const dynamicIconBgColor = iconBgColor ? { backgroundColor: iconBgColor } : {};
    const finalIconColor = iconColor || theme.icon;

    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuItemLeft}>
                <View style={[styles.iconWrapper, dynamicIconBgColor]}>
                    {icon ? (
                        <Iconify icon={icon} size={24} color={finalIconColor} />
                    ) : (
                            <View style={styles.emptyIconPlaceholder} />
                        )}
                </View>
                <Text style={[styles.menuItemLabel, { color: textColor || theme.text }]}>
                    {label}
                </Text>
            </View>
            <Iconify icon="lucide:chevron-right" size={20} color={theme.subtext} />
        </TouchableOpacity>
    );
};

export const MenuSwitchItem = ({ icon, label, textColor, iconColor, iconBgColor, value, onValueChange, theme, styles }) => {
    return (
        <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
                <View style={[styles.iconWrapper, iconBgColor && { backgroundColor: iconBgColor }]}>
                    {icon ? (
                        <Iconify icon={icon} size={20} color={iconColor} />
                    ) : (
                            <View style={styles.emptyIconPlaceholder} />
                        )}
                </View>
                <Text style={[styles.menuItemLabel, { color: textColor || theme.text }]}>
                    {label}
                </Text>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ true: theme.darkerSecondary, false: '#D1CCC9' }} 
                thumbColor={'#FFFFFF'}
            />
        </View>
    );
};
