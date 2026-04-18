import React, { useContext } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AccountingPeriodContext } from '../context/AccountingPeriodContext';
import { colors } from '../styles/styles';

export default function PeriodHeader() {
  const { headerLabel, openSelector } = useContext(AccountingPeriodContext);

  return (
    <TouchableOpacity
      onPress={openSelector}
      style={styles.container}
      activeOpacity={0.7}
    >
      <Text style={styles.label}>{headerLabel}</Text>
      <MaterialCommunityIcons
        name="chevron-down"
        size={18}
        color={colors.primaryGreen}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
});
