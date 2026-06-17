import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';
import Field from '../../components/Field';
import Button from '../../components/Button';
import styles from './Profile.module.css';

export default function Profile() {
    const { currentUser } = useAuth();

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Profile</h1>

            <div className={styles.card}>
                <div className={styles.header}>
                    {/* Mais tarde podemos adicionar aqui a foto de perfil se o Figma tiver */}
                    <h2 className={styles.name}>
                        {currentUser?.displayName || currentUser?.email || 'Reader'}
                    </h2>
                    <p className={styles.subtext}>Gere a tua informação pessoal e preferências.</p>
                </div>

                <form className={styles.form}>
                    <Field
                        label="Name"
                        name="displayName"
                        defaultValue={currentUser?.displayName || ''}
                        placeholder="Your name"
                    />
                    <Field
                        label="Email"
                        name="email"
                        type="email"
                        defaultValue={currentUser?.email || ''}
                        disabled={true}
                    />

                    {/* Novos campos adicionados: */}
                    <Field
                        label="Address"
                        name="address"
                        defaultValue={currentUser?.address || ''}
                        placeholder="Ex: Lisboa, Portugal"
                    />

                    <Field
                        label="Phone number"
                        name="phone"
                        type="tel"
                        defaultValue={currentUser?.phone || ''}
                        placeholder="Your phone number"
                    />

                    <div className={styles.checkboxGroup}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                name="isPublic"
                                defaultChecked={true} /* Assumimos público por defeito, ou liga ao currentUser.isPublic */
                            />
                            Tornar o meu perfil público
                        </label>
                        <p className={styles.helpText}>
                            If active, other users can see your profile and propose trades.
                        </p>
                    </div>

                    <div className={styles.actions}>
                        <Button type="submit">Guardar Alterações</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}