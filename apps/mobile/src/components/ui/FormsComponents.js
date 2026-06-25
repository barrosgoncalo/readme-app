import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    FlatList,
} from 'react-native';
import { Iconify } from 'react-native-iconify';

export function Field({ label, dirty, focused, children, styles }) {
    const isHighlighted = dirty || focused;
    return (
        <View style={[styles.field, isHighlighted && styles.fieldHighlighted]}>
            <Text style={[styles.fieldLabel, isHighlighted && styles.fieldLabelHighlighted]}>
                {label}
            </Text>
            {children}
        </View>
    );
}

export function FormInput ({ label, placeholder, value, onChangeText, maxLength, styles }) { 
    return (
        <View style={styles.inputWrapper}>
            <Text style={styles.label}>{label}</Text>
            <View style={[styles.inputUnderline, { paddingBottom: 4 }]}>
                <TextInput
                    style={[styles.textInput, { flex: 1, paddingVertical: 0 }]}
                    placeholder={placeholder}
                    placeholderTextColor="#888"
                    value={value}
                    onChangeText={onChangeText}
                    maxLength={maxLength}
                />
                <Text style={styles.charCount}>
                    {value.length} / {maxLength}
                </Text>
            </View>
        </View>
    )
};

export function FormTextArea ({ label, placeholder, value, onChangeText, maxLength, styles }) {
    return (
        <View style={styles.inputWrapper}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={styles.textArea}
                placeholder={placeholder}
                placeholderTextColor="#888"
                value={value}
                onChangeText={onChangeText}
                maxLength={maxLength}
                multiline
            />
            <Text style={styles.textAreaCharCount}>
                {value.length} / {maxLength}
            </Text>
        </View>
    )
};

export function FormDropdown ({ label, placeholder, value, onSelect, options, styles }) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <View style={styles.inputWrapper}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity 
                style={[styles.inputUnderline, { paddingBottom: 4 }]} 
                activeOpacity={0.7}
                onPress={() => setIsVisible(true)}
            >
                <View style={[styles.dropdownContent, { flex: 1 }]}>
                    <Text style={value ? [styles.textInput, { paddingVertical: 0 }] : [styles.dropdownPlaceholder, { paddingVertical: 0 }]}>
                        {value || placeholder}
                    </Text>
                </View>
                <Iconify icon="lucide:chevron-down" size={20} color="#000" />
            </TouchableOpacity>

            <Modal visible={isVisible} transparent animationType="slide">
                <TouchableOpacity 
                    style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }} 
                    activeOpacity={1} 
                    onPress={() => setIsVisible(false)}
                >
                    <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '50%' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#000' }}>Select {label}</Text>
                        <FlatList
                            data={options}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}
                                    onPress={() => {
                                        onSelect(item);
                                        setIsVisible(false);
                                    }}
                                >
                                    <Text style={{ fontSize: 16, color: '#333' }}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};


