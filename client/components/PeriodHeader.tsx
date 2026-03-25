import React, { useContext, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AccountingPeriodContext } from '../context/AccountingPeriodContext';
import PeriodSelectorModal from './PeriodSelectorModal';
import { colors } from '../styles/styles';

export default function PeriodHeader() {
  const { headerLabel } = useContext(AccountingPeriodContext);
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
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
    gap: 4,
  },
  label: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
});
