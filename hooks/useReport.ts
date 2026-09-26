import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAppData } from '@/hooks/useAppData';
import { generateReportHTML } from '@/services/reportService';

export function useReport() {
  const [isGenerating, setIsGenerating] = useState(false);
  const appData = useAppData();

  const exportReport = useCallback(async () => {
    setIsGenerating(true);
    try {
      const html = generateReportHTML({
        supplies: appData.supplies,
        pixTransactions: appData.pixTransactions,
        families: appData.families,
        familiesAttended: appData.familiesAttended,
      });

      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartilhar Relatório SOS Jampa',
          UTI: 'com.adobe.pdf',
        });
      } else {
        // Fallback: open print dialog (web/desktop)
        await Print.printAsync({ html });
      }
    } catch (err: any) {
      Alert.alert(
        'Erro ao gerar relatório',
        err?.message ?? 'Não foi possível gerar o PDF. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGenerating(false);
    }
  }, [appData]);

  const printReport = useCallback(async () => {
    setIsGenerating(true);
    try {
      const html = generateReportHTML({
        supplies: appData.supplies,
        pixTransactions: appData.pixTransactions,
        families: appData.families,
        familiesAttended: appData.familiesAttended,
      });

      await Print.printAsync({ html });
    } catch (err: any) {
      Alert.alert(
        'Erro ao imprimir',
        err?.message ?? 'Não foi possível abrir o diálogo de impressão.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGenerating(false);
    }
  }, [appData]);

  return { exportReport, printReport, isGenerating };
}
