// @ts-ignore
import Novice from '../assets/badges/Novice.png';
// @ts-ignore
import PageTurner from '../assets/badges/PageTurner.png';
// @ts-ignore
import AvidReader from '../assets/badges/AvidReader.png';
// @ts-ignore
import Librarian from '../assets/badges/Librarian.png';
// @ts-ignore
import Collector from '../assets/badges/Collector.png';
// @ts-ignore
import Scholar from '../assets/badges/Scholar.png';
// @ts-ignore
import MasterBibliophile from '../assets/badges/MasterBibliophile.png';
// @ts-ignore
import GrandLibrarian from '../assets/badges/GrandLibrarian.png';
// @ts-ignore
import LegendaryBibliophile from '../assets/badges/LegendaryBibliophile.png';

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
