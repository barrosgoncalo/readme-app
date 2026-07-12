import { Colors } from '@readme/shared/src/constants/theme';
import { useColorScheme } from '@readme/shared/src/hooks/use-color-scheme';

export function useTheme() {
    const scheme = useColorScheme();
    const theme = scheme === 'unspecified' ? 'light' : scheme;

    return Colors[theme];
}
