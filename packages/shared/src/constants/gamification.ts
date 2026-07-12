export const RankTitles = {
    NOVICE: 'Novice',
    PAGE_TURNER: 'Page Turner',
    AVID_READER: 'Avid Reader',
    LIBRARIAN: 'Librarian',
    COLLECTOR: 'Collector',
    SCHOLAR: 'Scholar',
    MASTER_BIBLIOPHILE: 'Master Bibliophile',
    GRAND_LIBRARIAN: 'Grand Librarian',
    LEGENDARY_BIBLIOPHILE: 'Legendary Bibliophile',
};

export const DEFAULT_STARTING_RANK = RankTitles.NOVICE;

export const GAMIFICATION_RANKS = [
    { id: 1, milestone: 1, title: 'Novice', image: require('@readme/shared/src/assets/badges/Novice.png') },
    { id: 2, milestone: 5, title: 'Page Turner', image: require('@readme/shared/src/assets/badges/PageTurner.png') },
    { id: 3, milestone: 10, title: 'Avid Reader', image: require('@readme/shared/src/assets/badges/AvidReader.png') },
    { id: 4, milestone: 25, title: 'Librarian', image: require('@readme/shared/src/assets/badges/Librarian.png') },
    { id: 5, milestone: 50, title: 'Collector', image: require('@readme/shared/src/assets/badges/Collector.png') },
    { id: 6, milestone: 100, title: 'Scholar', image: require('@readme/shared/src/assets/badges/Scholar.png') },
    { id: 7, milestone: 250, title: 'Master Bibliophile', image: require('@readme/shared/src/assets/badges/MasterBibliophile.png') },
    { id: 8, milestone: 500, title: 'Grand Librarian', image: require('@readme/shared/src/assets/badges/GrandLibrarian.png') },
    { id: 9, milestone: 1000, title: 'Legendary Bibliophile', image: require('@readme/shared/src/assets/badges/LegendaryBibliophile.png') },
];
