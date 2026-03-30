import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SectionList,
  Switch,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors, font, size } from "../../styles/styles";
import { Account } from "../../src/types";

interface Props {
  visible: boolean;
  onClose: () => void;
  accounts: Account[];
  excludedIds: Set<string>;
  onToggle: (id: string) => void;
}

const TYPE_KEYS: Record<string, string> = {
  income: "accountTypes.income",
  personal: "accountTypes.personal",
  expense: "accountTypes.expense",
  debt: "accountTypes.debt",
};

export default function AccountFilterModal({
  visible,
  onClose,
  accounts,
  excludedIds,
  onToggle,
}: Props) {
  const { t } = useTranslation();
  const sections = ["income", "personal", "expense", "debt"]
    .map((type) => ({
      title: t(TYPE_KEYS[type]),
      data: accounts.filter((a) => a.type === type),
    }))
    .filter((s) => s.data.length > 0);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("report.filterAccounts")}</Text>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <SectionList
          sections={sections}
          keyExtractor={(item) => item._id}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionTitle}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.icon,
                    { backgroundColor: item.icon?.color || colors.darkGray },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={(item.icon?.icon_value || "wallet-outline") as any}
                    size={18}
                    color="white"
                  />
                </View>
                <Text style={styles.name}>{item.name}</Text>
              </View>
              <Switch
                value={!excludedIds.has(item._id)}
                onValueChange={() => onToggle(item._id)}
                trackColor={{ false: colors.darkGray, true: colors.primaryGreen }}
                thumbColor="white"
              />
            </View>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    color: "white",
    fontSize: size.title2,
    fontWeight: font.bold as any,
  },
  sectionTitle: {
    color: colors.gray,
    fontSize: size.footnote,
    fontWeight: font.semibold as any,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    color: "white",
    fontSize: size.body,
    fontWeight: font.semibold as any,
  },
});
