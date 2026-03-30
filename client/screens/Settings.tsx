import React, { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGES, setLanguage } from "../i18n";
import { getLocale } from "../utils/formatDate";
import { UsersContext } from "../context/UsersContext";
import { AccountsContext } from "../context/AccountsContext";
import { CurrencyContext } from "../context/CurrencyContext";
import { DebtsContext } from "../context/DebtsContext";
import { TransactionsContext } from "../context/TransactionsContext";
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
  Alert,
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
  const { t, i18n } = useTranslation();
  const { logout } = useContext(UsersContext);
  const { currencies, rates, mainCurrency, setMainCurrency, loading, lastFetchedAt, refreshCurrencies } =
    useContext(CurrencyContext);
  const { accounts, toggleArchiveAccount } = useContext(AccountsContext);
  const { settings: debtSettings, setEnabled: setDebtEnabled } =
    useContext(DebtsContext);
  const { deleteAllTransactions } = useContext(TransactionsContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [dashboardSettingsOpen, setDashboardSettingsOpen] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  const currentLanguageLabel =
    LANGUAGES.find((l) => l.code === i18n.language)?.label ?? i18n.language;

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
    <View style={{ ...container, paddingBottom: 90 }}>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={setting_option}
      >
        <Text style={styles.label}>{t("settings.mainCurrency")}</Text>
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
        <Text style={styles.label}>{t("settings.currencyRatesUpdated")}</Text>
        <Text style={styles.currencyValue}>
          {lastFetchedAt
            ? new Date(lastFetchedAt).toLocaleString(getLocale())
            : t("common.never")}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => setDashboardSettingsOpen(true)}
        style={setting_option}
      >
        <Text style={styles.label}>{t("settings.dashboardSettings")}</Text>
        <Feather name="chevron-right" size={20} color={colors.gray} />
      </TouchableOpacity>

      <View style={setting_option}>
        <Text style={styles.label}>{t("settings.enableDebts")}</Text>
        <Switch
          value={debtSettings.enabled}
          onValueChange={setDebtEnabled}
          trackColor={{ false: colors.darkGray, true: colors.primaryGreen }}
          thumbColor="white"
        />
      </View>

      <TouchableOpacity
        onPress={() => setLanguageModalVisible(true)}
        style={setting_option}
      >
        <Text style={styles.label}>{t("settings.language")}</Text>
        <View style={styles.currencyRow}>
          <Text style={styles.currencyValue}>{currentLanguageLabel}</Text>
          <Feather
            name="chevron-right"
            size={20}
            color={colors.gray}
            style={{ marginLeft: 8 }}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          setDeleteInput("");
          setDeleteConfirmVisible(true);
        }}
        style={setting_option}
      >
        <Text style={{ ...styles.label, color: colors.red }}>
          {t("settings.resetAllTransactions")}
        </Text>
        <Feather name="trash-2" size={20} color={colors.red} />
      </TouchableOpacity>

      <TouchableOpacity onPress={logout} style={setting_option}>
        <Text style={subheadline}>{t("settings.logOut")}</Text>
        <Feather name="log-out" size={24} color="white" />
      </TouchableOpacity>

      <Modal
        visible={dashboardSettingsOpen}
        animationType="slide"
        onRequestClose={() => setDashboardSettingsOpen(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("settings.dashboardSettings")}</Text>
            <TouchableOpacity onPress={() => setDashboardSettingsOpen(false)}>
              <Feather name="x" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionLabel}>{t("settings.expenseAccounts")}</Text>
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
            <Text style={styles.modalTitle}>{t("settings.chooseCurrency")}</Text>
            <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
              <TouchableOpacity onPress={refreshCurrencies}>
                <Feather name="refresh-cw" size={20} color={loading ? colors.gray : "white"} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setSearch("");
                }}
              >
                <Feather name="x" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <TextInput
            style={styles.search}
            placeholder={t("common.search")}
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
                    {item !== mainCurrency && rates[item] && rates[mainCurrency] && (
                      <Text style={styles.currencyRate}>
                        1 {mainCurrency} = {(rates[item] / rates[mainCurrency]).toFixed(4)} {item}
                      </Text>
                    )}
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

      <Modal
        visible={deleteConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteSheet}>
            <Text style={styles.deleteTitle}>{t("settings.resetTitle")}</Text>
            <Text style={styles.deleteDesc}>
              {t("settings.resetDescription")}
            </Text>
            <Text style={styles.deleteDesc}>
              {t("settings.typeToConfirm")}
              <Text style={{ color: colors.red, fontWeight: "700" }}>
                Delete
              </Text>
              {t("settings.toConfirm")}
            </Text>
            <TextInput
              style={styles.deleteInput}
              value={deleteInput}
              onChangeText={setDeleteInput}
              placeholder="Delete"
              placeholderTextColor={colors.darkGray}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={styles.deleteCancelBtn}
                onPress={() => setDeleteConfirmVisible(false)}
              >
                <Text style={styles.deleteCancelText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deleteConfirmBtn,
                  { opacity: deleteInput === "Delete" ? 1 : 0.4 },
                ]}
                disabled={deleteInput !== "Delete"}
                onPress={async () => {
                  setDeleteConfirmVisible(false);
                  const ok = await deleteAllTransactions();
                  Alert.alert(
                    ok ? t("common.done") : t("common.error"),
                    ok
                      ? t("settings.allDeleted")
                      : t("settings.deleteFailed"),
                  );
                }}
              >
                <Text style={styles.deleteConfirmText}>{t("settings.deleteAll")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={languageModalVisible}
        animationType="slide"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("settings.language")}</Text>
            <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
              <Feather name="x" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={LANGUAGES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.currencyItem,
                  item.code === i18n.language && styles.currencyItemActive,
                ]}
                onPress={() => {
                  setLanguage(item.code);
                  setLanguageModalVisible(false);
                }}
                accessibilityLabel={item.label}
              >
                <Text
                  style={[
                    styles.currencyCode,
                    item.code === i18n.language && styles.currencyItemTextActive,
                  ]}
                >
                  {item.label}
                </Text>
                {item.code === i18n.language && (
                  <Feather name="check" size={18} color={colors.primaryGreen} />
                )}
              </TouchableOpacity>
            )}
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
  currencyRate: {
    color: colors.primaryGreen,
    fontSize: size.footnote,
    marginTop: 2,
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
  deleteOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  deleteSheet: {
    backgroundColor: colors.darkBlack,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    gap: 12,
  },
  deleteTitle: {
    color: "white",
    fontSize: size.title3,
    fontWeight: font.bold,
  },
  deleteDesc: {
    color: colors.gray,
    fontSize: size.body,
    lineHeight: 20,
  },
  deleteInput: {
    backgroundColor: colors.darkGray,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "white",
    fontSize: size.body,
  },
  deleteActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  deleteCancelBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.darkGray,
  },
  deleteCancelText: {
    color: "white",
    fontSize: size.body,
    fontWeight: font.semibold,
  },
  deleteConfirmBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.red,
  },
  deleteConfirmText: {
    color: "white",
    fontSize: size.body,
    fontWeight: font.bold,
  },
});

export default Settings;
