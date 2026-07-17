import React, { useMemo, useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Pressable,
    useColorScheme,
} from 'react-native';
import { Iconify } from 'react-native-iconify';
import { SafeAreaView } from 'react-native-safe-area-context';
import { REPORT_REASONS, type ReportReasonId } from '@readme/shared/src/constants/reportReasons';
import { buildReportModalStyles } from '../../styles/reportModalStyles';
import { useTheme } from '@readme/shared/src/hooks/use-theme';

interface ReportModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (payload: { reasonId: ReportReasonId }) => Promise<void>;
    submitting: boolean;
}

export function ReportModal({ visible, onClose, onSubmit, submitting }: ReportModalProps) {
    const [selectedReasonId, setSelectedReasonId] = useState<ReportReasonId | null>(null);

    const colorScheme = useColorScheme() ?? 'light';
    const theme = useTheme();
    const styles = useMemo(
        () => buildReportModalStyles(theme),
        [colorScheme]
    );

    // Reset internal form state whenever the modal visibility changes
    useEffect(() => {
        if (visible) {
            setSelectedReasonId(null);
        }
    }, [visible]);

    const handleFormSubmit = () => {
        if (!selectedReasonId) return;
        // `details` is kept in the payload shape for API compatibility, but
        // the free-text box has been removed from this modal, so it's
        // always empty here.
        onSubmit({ reasonId: selectedReasonId });
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            {/* Dark translucent backdrop */}
            <Pressable
                style={styles.backdrop}
                onPress={submitting ? undefined : onClose}
            >
                <View style={styles.keyboardContainer}>
                    {/* Modal Content Card */}
                    <Pressable style={styles.modalContent} pointerEvents="box-none">
                        <SafeAreaView edges={['bottom']} style={styles.safeArea}>

                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.headerTitle}>Report Listing</Text>
                                <Text style={styles.headerSubtitle}>
                                    Help us understand what's wrong with this listing. Your report remains anonymous.
                                </Text>
                            </View>

                            {/* Reasons List */}
                            <ScrollView
                                style={styles.scrollContainer}
                                contentContainerStyle={styles.scrollContent}
                                showsVerticalScrollIndicator={false}
                            >
                                {REPORT_REASONS.map((reason) => {
                                    const isSelected = selectedReasonId === reason.id;
                                    return (
                                        <TouchableOpacity
                                            key={reason.id}
                                            style={[
                                                styles.reasonTile,
                                                isSelected && { borderColor: reason.accentColor, backgroundColor: `${reason.accentColor}0A` }
                                            ]}
                                            onPress={() => setSelectedReasonId(reason.id)}
                                            disabled={submitting}
                                            activeOpacity={0.7}
                                        >
                                            {/* Left side tinted icon */}
                                            <View style={[styles.iconWrapper, { backgroundColor: `${reason.accentColor}15` }]}>
                                                <Iconify icon={reason.icon} size={22} color={reason.accentColor} />
                                            </View>

                                            {/* Text Block */}
                                            <View style={styles.reasonTextContainer}>
                                                <Text style={styles.reasonTitle}>{reason.title}</Text>
                                                <Text style={styles.reasonSubtitle}>{reason.subtitle}</Text>
                                            </View>

                                            {/* Right side Selection indicator */}
                                            <View style={[styles.radioCircle, isSelected && { borderColor: reason.accentColor }]}>
                                                {isSelected && <View style={[styles.radioInnerCircle, { backgroundColor: reason.accentColor }]} />}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            {/* Action Buttons Footer */}
                            <View style={styles.footerButtons}>
                                <TouchableOpacity
                                    style={[styles.button, styles.cancelButton]}
                                    onPress={onClose}
                                    disabled={submitting}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.button,
                                        styles.submitButton,
                                        (!selectedReasonId || submitting) && styles.submitButtonDisabled
                                    ]}
                                    onPress={handleFormSubmit}
                                    disabled={!selectedReasonId || submitting}
                                >
                                    {submitting ? (
                                        <ActivityIndicator size="small" color={styles.submitButtonText.color} />
                                    ) : (
                                        <Text style={styles.submitButtonText}>Submit Report</Text>
                                    )}
                                </TouchableOpacity>
                            </View>

                        </SafeAreaView>
                    </Pressable>
                </View>
            </Pressable>
        </Modal>
    );
}