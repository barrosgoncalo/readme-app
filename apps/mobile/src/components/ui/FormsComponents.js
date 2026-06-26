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

export function FormBoxInput({ label, dirty, focused, children, styles }) {
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

export function FormLineInput ({ label, placeholder, value, onChangeText, maxLength, styles }) { 
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

export function FormDropdown({ label, placeholder, value, onSelect, options, styles }) {
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
                <Iconify icon="lucide:chevron-down" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <Modal visible={isVisible} transparent animationType="slide">
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setIsVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select {label}</Text>
                        <FlatList
                            data={options}
                            keyExtractor={(item) => item}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.modalOptionItem}
                                    onPress={() => {
                                        onSelect(item);
                                        setIsVisible(false);
                                    }}
                                >
                                    <Text style={styles.modalOptionText}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};


