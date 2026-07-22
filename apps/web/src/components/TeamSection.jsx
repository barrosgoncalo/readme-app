import styles from './TeamSection.module.css';
import bernardoPhoto from '../assets/team/bernardo-lobao.png';
// import omarPhoto from '../assets/team/omar-hassan.jpg';
// import zaraPhoto from '../assets/team/zara-malik.jpg';
// import bilalPhoto from '../assets/team/bilal-ahmed.jpg';

const TEAM = [
    {
        name: 'Bernardo Lobão',
        role: 'Founder & CEO',
        bio: 'Book lover and entrepreneur passionate about creating meaningful reader experiences.',
        photo: bernardoPhoto,
    },
    {
        name: 'Gonçalo Barros',
        role: 'Head of Operations',
        bio: 'Ensures smooth operations and helps our community grow every day.',
        // photo: omarPhoto,
    },
    {
        name: 'Francisco Campos',
        role: 'Curation Lead',
        bio: 'Curates quality books and brings stories that inspire our readers.',
        // photo: zaraPhoto,
    },
    {
        name: 'Manuel Anão',
        role: 'Tech Lead',
        bio: 'Builds and maintains the platform to deliver a seamless experience.',
        // photo: bilalPhoto,
    },
];

export default function TeamSection() {
    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <div className={styles.divider}>
                    <span className={styles.line} />
                    <span className={styles.diamond} />
                    <span className={styles.line} />
                </div>
                <h2 className={styles.title}>Our Team</h2>
                <p className={styles.subtitle}>
                    A passionate group of book lovers building a trusted space for readers and collectors.
                </p>
            </div>

            <div className={styles.grid}>
                {TEAM.map(member => (
                    <div className={styles.card} key={member.name}>
                        <div className={styles.photoWrap}>
                            <img src={member.photo} alt={member.name} className={styles.photo} />
                        </div>
                        <h3 className={styles.name}>{member.name}</h3>
                        <p className={styles.role}>{member.role}</p>
                        <span className={styles.roleLine} />
                        <p className={styles.bio}>{member.bio}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}