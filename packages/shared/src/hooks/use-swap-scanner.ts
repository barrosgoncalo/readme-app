import { useState, useRef } from 'react';
import { Alert } from 'react-native';
import { ChatService } from '../services/chat';
import type { NavigationProp } from '@react-navigation/native';

export function useSwapScanner(
    chatId: string | undefined,
    messageId: string | undefined,
    navigation: NavigationProp<any>
) {
    const [isVerifying, setIsVerifying] = useState<boolean>(false);
    const [scanned, setScanned] = useState<boolean>(false);
    const isProcessingRef = useRef<boolean>(false);

    const handleVerifySuccess = async (scannedCode: string) => {
        setIsVerifying(true);
        try {
            await ChatService.verifySwapCode(chatId, messageId, scannedCode);

            Alert.alert("Sucesso!", "Troca verificada com sucesso! Os livros foram removidos da plataforma.", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (error: unknown) {
            console.error("Erro ao validar o swap:", error);
            Alert.alert(
                "Verificação Falhou",
                "O código lido é inválido ou ocorreu um erro.",
                [{
                    text: "Tentar Novamente",
                    onPress: () => {
                        setScanned(false);
                        isProcessingRef.current = false;
                    }
                }]
            );
        } finally {
            setIsVerifying(false);
        }
    };

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        if (isProcessingRef.current) return;

        isProcessingRef.current = true;
        console.log("QR Code scanned data:", data);

        setScanned(true);
        handleVerifySuccess(data);
    };

    return {
        isVerifying,
        scanned,
        handleBarCodeScanned,
    };
}
