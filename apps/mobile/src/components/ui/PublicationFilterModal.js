import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Iconify } from 'react-native-iconify';
import { BOOK_CONDITIONS, BOOK_GENRES } from '@readme/shared/src/constants/bookOptions';
import { SORT_OPTIONS } from '@readme/shared/src/services/searchBook';

const SORT_CHOICES = [
    // { key: SORT_OPTIONS.RELEVANCE, label: 'Best match' },
    { key: SORT_OPTIONS.TITLE_ASC, label: 'Title A → Z' },
    { key: SORT_OPTIONS.TITLE_DESC, label: 'Title Z → A' },
    { key: SORT_OPTIONS.FAVORITES_DESC, label: 'Most favorited' },
    { key: SORT_OPTIONS.FAVORITES_ASC, label: 'Least favorited' },
    { key: SORT_OPTIONS.DATE_DESC, label: 'Newest first' },
    { key: SORT_OPTIONS.DATE_ASC, label: 'Oldest first' },
];

/**
 * Bottom-sheet filter/sort modal for the publications grid.
 * Keeps its own draft state so Cancel doesn't clobber the applied filters,
 * only "Apply" commits the change back up to the parent.
 *
 * `resetSortBy` lets each screen define what "no filter applied" means
 * for sort — Search's default is RELEVANCE (a text query is present),
 * Explore's default is DATE_DESC (no text query, browsing newest-first).
 * Defaults to RELEVANCE to preserve existing Search-screen behavior.
 */
export default function PublicationFilterModal({
                                                   visible,
                                                   onClose,
                                                   onApply,
                                                   initialSortBy,
                                                   initialConditions,
                                                   initialGenres,
                                                   theme,
                                                   styles,
                                                   resetSortBy = SORT_OPTIONS.RELEVANCE,
                                               }) {
    const [sortBy, setSortBy] = useState(initialSortBy);
    const [conditions, setConditions] = useState(initialConditions);
    const [genres, setGenres] = useState(initialGenres);

    useEffect(() => {
        if (visible) {
            setSortBy(initialSortBy);
            setConditions(initialConditions);
            setGenres(initialGenres);
        }
    }, [visible, initialSortBy, initialConditions, initialGenres]);

    const toggleCondition = (key) => {
        setConditions((prev) =>
            prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
        );
    };

    const toggleGenre = (key) => {
        setGenres((prev) =>
            prev.includes(key) ? prev.filter((g) => g !== key) : [...prev, key]
        );
    };

    const handleReset = () => {
        setSortBy(resetSortBy);
        setConditions([]);
        setGenres([]);
    };
    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />

                <View style={styles.modalSheet}>
                    <View style={styles.modalHandle} />

                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Filter & Sort</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Iconify icon="lucide:x" size={20} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                        <Text style={styles.modalSectionLabel}>Sort by</Text>
                        {SORT_CHOICES.map((opt) => {
                            const active = sortBy === opt.key;
                            return (
                                <TouchableOpacity
                                    key={opt.key}
                                    style={styles.modalOptionRow}
                                    onPress={() => setSortBy(opt.key)}
                                    activeOpacity={0.7}
                                >
                                    <Iconify
                                        icon={active ? 'lucide:circle-dot' : 'lucide:circle'}
                                        size={18}
                                        color={active ? theme.secondary : theme.subtext}
                                    />
                                    <Text style={[styles.modalOptionText, active && styles.modalOptionTextActive]}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}

                        <Text style={[styles.modalSectionLabel, { marginTop: 20 }]}>Genre</Text>
                        {BOOK_GENRES.map((genreLabel) => {
                            const active = genres.includes(genreLabel);
                            return (
                                <TouchableOpacity
                                    key={genreLabel}
                                    style={styles.modalOptionRow}
                                    onPress={() => toggleGenre(genreLabel)}
                                    activeOpacity={0.7}
                                >
                                    <Iconify
                                        icon={active ? 'lucide:square-check' : 'lucide:square'}
                                        size={18}
                                        color={active ? theme.secondary : theme.subtext}
                                    />
                                    <Text style={[styles.modalOptionText, active && styles.modalOptionTextActive]}>
                                        {genreLabel}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}

                        <Text style={[styles.modalSectionLabel, { marginTop: 20 }]}>Book condition</Text>
                        {BOOK_CONDITIONS.map((condLabel) => {
                            const active = conditions.includes(condLabel);
                            return (
                                <TouchableOpacity
                                    key={condLabel}
                                    style={styles.modalOptionRow}
                                    onPress={() => toggleCondition(condLabel)}
                                    activeOpacity={0.7}
                                >
                                    <Iconify
                                        icon={active ? 'lucide:square-check' : 'lucide:square'}
                                        size={18}
                                        color={active ? theme.secondary : theme.subtext}
                                    />
                                    <Text style={[styles.modalOptionText, active && styles.modalOptionTextActive]}>
                                        {condLabel}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.modalResetButton} onPress={handleReset}>
                            <Text style={styles.modalResetText}>Reset</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalApplyButton}
                            onPress={() => onApply(sortBy, conditions, genres)}
                        >
                            <Text style={styles.modalApplyText}>Apply</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}