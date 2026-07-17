// Web variant of gamification.ts — same rank data, but badge images are
// loaded via Vite's `import` (returns the asset URL) instead of RN's
// require(), which Vite can't process.
import Novice from '@readme/shared/src/assets/badges/Novice.png';
import PageTurner from '@readme/shared/src/assets/badges/PageTurner.png';
import AvidReader from '@readme/shared/src/assets/badges/AvidReader.png';
import Librarian from '@readme/shared/src/assets/badges/Librarian.png';
import Collector from '@readme/shared/src/assets/badges/Collector.png';
import Scholar from '@readme/shared/src/assets/badges/Scholar.png';
import MasterBibliophile from '@readme/shared/src/assets/badges/MasterBibliophile.png';
import GrandLibrarian from '@readme/shared/src/assets/badges/GrandLibrarian.png';
import LegendaryBibliophile from '@readme/shared/src/assets/badges/LegendaryBibliophile.png';

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
    { id: 1, milestone: 1, title: 'Novice', image: Novice },
    { id: 2, milestone: 5, title: 'Page Turner', image: PageTurner },
    { id: 3, milestone: 10, title: 'Avid Reader', image: AvidReader },
    { id: 4, milestone: 25, title: 'Librarian', image: Librarian },
    { id: 5, milestone: 50, title: 'Collector', image: Collector },
    { id: 6, milestone: 100, title: 'Scholar', image: Scholar },
    { id: 7, milestone: 250, title: 'Master Bibliophile', image: MasterBibliophile },
    { id: 8, milestone: 500, title: 'Grand Librarian', image: GrandLibrarian },
    { id: 9, milestone: 1000, title: 'Legendary Bibliophile', image: LegendaryBibliophile },
];
