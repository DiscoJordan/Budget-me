import React, { useContext, useState } from "react";
import { UsersContext } from "../context/UsersContext";
import { AccountsContext } from "../context/AccountsContext";
import { CurrencyContext } from "../context/CurrencyContext";
import { getCurrencyMeta, formatCurrencyLabel } from "../utils/currencyInfo";
import { Feather } from "@expo/vector-icons";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
  Switch,
  SectionList,
} from "react-native";
import {
  container,
  setting_option,
  subheadline,
  colors,
  font,
  size,
} from "../styles/styles";
import { MaterialCommunityIcons } from "@expo/vector-icons";

function Settings() {
  const { logout } = useContext(UsersContext);
  const { currencies, mainCurrency, setMainCurrency, loading, lastFetchedAt } =
    useContext(CurrencyContext);
  const { accounts, toggleArchiveAccount } = useContext(AccountsContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [dashboardSettingsOpen, setDashboardSettingsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const expenseAccounts = accounts.filter((a) => a.type === "expense");

  const filtered = currencies.filter((c) => {
    const label = formatCurrencyLabel(c).toLowerCase();
    return (
      label.includes(search.toLowerCase()) ||
      c.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleSelect = async (currency: string) => {
    await setMainCurrency(currency);
    setModalVisible(false);
    setSearch("");
  };

  return (
    <View style={container}>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={setting_option}
      >
        <Text style={styles.label}>Main currency</Text>
        <View style={styles.currencyRow}>
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.currencyValue}>
              {mainCurrency} {getCurrencyMeta(mainCurrency).symbol}
            </Text>
          )}
          <Feather
            name="chevron-right"
            size={20}
            color={colors.gray}
            style={{ marginLeft: 8 }}
          />
        </View>
      </TouchableOpacity>

      <View style={setting_option}>
        <Text style={styles.label}>Currency rates last updated</Text>
        <Text style={styles.currencyValue}>
          {lastFetchedAt ? new Date(lastFetchedAt).toLocaleString() : 'Never'}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => setDashboardSettingsOpen(true)}
        style={setting_option}
      >
        <Text style={styles.label}>Dashboard settings</Text>
        <Feather name="chevron-right" size={20} color={colors.gray} />
      </TouchableOpacity>

      <TouchableOpacity onPress={logout} style={setting_option}>
        <Text style={subheadline}>Log out</Text>
        <Feather name="log-out" size={24} color="white" />
      </TouchableOpacity>

      <Modal
        visible={dashboardSettingsOpen}
        animationType="slide"
        onRequestClose={() => setDashboardSettingsOpen(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Dashboard settings</Text>
            <TouchableOpacity onPress={() => setDashboardSettingsOpen(false)}>
              <Feather name="x" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionLabel}>Expense accounts</Text>
          <FlatList
            data={expenseAccounts}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.archiveRow}>
                <View style={styles.archiveLeft}>
                  <View
                    style={[
                      styles.archiveIcon,
                      { backgroundColor: item.icon?.color || colors.darkGray },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={(item.icon?.icon_value || "wallet-outline") as any}
                      size={20}
                      color="white"
                    />
                  </View>
                  <Text style={styles.archiveName}>{item.name}</Text>
                </View>
                <Switch
                  value={!item.archived}
                  onValueChange={(val) => toggleArchiveAccount(item._id, !val)}
                  trackColor={{
                    false: colors.darkGray,
                    true: colors.primaryGreen,
                  }}
                  thumbColor="white"
                />
              </View>
            )}
          />
        </View>
      </Modal>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose currency</Text>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                setSearch("");
              }}
            >
              <Feather name="x" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.search}
            placeholder="Search..."
            placeholderTextColor={colors.gray}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="characters"
          />

          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const meta = getCurrencyMeta(item);
              return (
                <TouchableOpacity
                  style={[
                    styles.currencyItem,
                    item === mainCurrency && styles.currencyItemActive,
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <View style={styles.currencyItemLeft}>
                    <Text
                      style={[
                        styles.currencyCode,
                        item === mainCurrency && styles.currencyItemTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                    <Text style={styles.currencyName}>{meta.name}</Text>
                  </View>
                  <View style={styles.currencyItemRight}>
                    <Text
                      style={[
                        styles.currencySymbol,
                        item === mainCurrency && styles.currencyItemTextActive,
                      ]}
                    >
                      {meta.symbol}
                    </Text>
                    {item === mainCurrency && (
                      <Feather
                        name="check"
                        size={18}
                        color={colors.primaryGreen}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: "white",
    fontSize: size.subheadline,
    fontWeight: font.regular,
  },
  currencyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencyValue: {
    color: colors.gray,
    fontSize: size.subheadline,
    fontWeight: font.semibold,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 56,
    paddingHorizontal: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: "white",
    fontSize: size.title3,
    fontWeight: font.bold,
  },
  search: {
    backgroundColor: colors.darkGray,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "white",
    fontSize: size.body,
    marginBottom: 12,
  },
  currencyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  currencyItemActive: {
    backgroundColor: colors.darkGray,
    borderRadius: 8,
  },
  currencyItemLeft: {
    flex: 1,
    gap: 2,
  },
  currencyItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  currencyCode: {
    color: "white",
    fontSize: size.body,
    fontWeight: font.semibold,
  },
  currencyName: {
    color: colors.gray,
    fontSize: size.footnote,
  },
  currencySymbol: {
    color: colors.gray,
    fontSize: size.body,
    fontWeight: font.semibold,
    minWidth: 24,
    textAlign: "right",
  },
  currencyItemTextActive: {
    color: colors.primaryGreen,
    fontWeight: font.semibold,
  },
  sectionLabel: {
    color: colors.gray,
    fontSize: size.footnote,
    fontWeight: font.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  archiveRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  archiveLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  archiveIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  archiveName: {
    color: "white",
    fontSize: size.body,
  },
});

export default Settings;
