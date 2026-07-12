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
    { id: 1, milestone: 0, title: RankTitles.NOVICE }, 
    { id: 2, milestone: 5, title: RankTitles.PAGE_TURNER },
    { id: 3, milestone: 10, title: RankTitles.AVID_READER },
    { id: 4, milestone: 25, title: RankTitles.LIBRARIAN },
    { id: 5, milestone: 50, title: RankTitles.COLLECTOR },
    { id: 6, milestone: 100, title: RankTitles.SCHOLAR },
    { id: 7, milestone: 250, title: RankTitles.MASTER_BIBLIOPHILE },
    { id: 8, milestone: 500, title: RankTitles.GRAND_LIBRARIAN },
    { id: 9, milestone: 1000, title: RankTitles.LEGENDARY_BIBLIOPHILE },
];
