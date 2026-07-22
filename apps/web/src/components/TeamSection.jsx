import styles from './TeamSection.module.css';
import bernardoPhoto from '../assets/team/bernardo-lobao.png';
// import goncaloPhoto from '../assets/team/goncalo-barros.jpg';
// import franciscoPhoto from '../assets/team/francisco-campos.jpg';
// import manuelPhoto from '../assets/team/manuel-anao.jpg';

const TEAM = [
    {
        name: 'Bernardo Lobão',
        role: 'Mobile Lead',
        bio: 'Builds and maintains the mobile app, focused on a smooth experience for readers on the go.',
        photo: bernardoPhoto,
    },
    {
        name: 'Gonçalo Barros',
        role: 'Mobile Developer',
        bio: 'Works across the mobile app, shipping features that keep the community connected.',
        // photo: goncaloPhoto,
    },
    {
        name: 'Francisco Campos',
        role: 'Web Developer',
        bio: 'Builds and maintains the web platform, bringing the readme experience to the browser.',
        // photo: franciscoPhoto,
    },
    {
        name: 'Manuel Anão',
        role: 'Web Developer',
        bio: 'Works across the web app, delivering a seamless experience for readers and sellers alike.',
        // photo: manuelPhoto,
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