import { View, Text } from "react-native";

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
