import React from 'react';
import { View } from 'react-native';

export default function StepDots({ currentStep, totalSteps, styles }) {
    return (
        <View style={styles.dotsContainer}>
            {Array.from({ length: totalSteps }).map((_, i) => (
                <View
                    key={i}
                    style={[
                        styles.dot,
                        currentStep === i + 1 ? styles.dotActive : styles.dotInactive,
                    ]}
                />
            ))}
        </View>
    );
}
