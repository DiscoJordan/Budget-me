import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AccountingPeriodContext } from '../context/AccountingPeriodContext';
import PeriodSelectorModal from './PeriodSelectorModal';
import { colors } from '../styles/styles';

export default function PeriodNavigator() {
  const { t } = useTranslation();
  const { headerLabel, shiftPeriod, canShift } = useContext(AccountingPeriodContext);
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <View style={styles.container}>
        {canShift ? (
          <TouchableOpacity
            onPress={() => shiftPeriod(-1)}
            style={styles.arrow}
            accessibilityLabel={t("period.previousPeriod")}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.primaryGreen} />
          </TouchableOpacity>
        ) : (
          <View style={styles.arrowPlaceholder} />
        )}

        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.labelButton}
          accessibilityLabel={t("period.selectAccountingPeriod")}
        >
          <Text style={styles.label}>{headerLabel}</Text>
          <MaterialCommunityIcons name="chevron-down" size={16} color={colors.primaryGreen} />
        </TouchableOpacity>

        {canShift ? (
          <TouchableOpacity
            onPress={() => shiftPeriod(1)}
            style={styles.arrow}
            accessibilityLabel={t("period.nextPeriod")}
          >
            <MaterialCommunityIcons name="chevron-right" size={28} color={colors.primaryGreen} />
          </TouchableOpacity>
        ) : (
          <View style={styles.arrowPlaceholder} />
        )}
      </View>

      <PeriodSelectorModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 50,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  arrow: {
    padding: 4,
  },
  arrowPlaceholder: {
    width: 36,
  },
  labelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
});
