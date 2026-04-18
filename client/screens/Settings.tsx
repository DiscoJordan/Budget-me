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
  ActivityIndicator,
  Switch,
  Alert,
  Linking,
} from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import * as Crypto from "expo-crypto";
import { getAllAccounts, upsertAccount } from "../db/accountsDb";
import { getAllTransactions, upsertTransaction } from "../db/transactionsDb";
import {
  container,
  setting_option,
  subheadline,
  colors,
  font,
  size,
} from "../styles/styles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import GlassInput from "../components/GlassInput";

function Settings() {
  const { t, i18n } = useTranslation();
  const { logout, user } = useContext(UsersContext);
  const {
    currencies,
    rates,
    mainCurrency,
    setMainCurrency,
    loading,
    lastFetchedAt,
    refreshCurrencies,
  } = useContext(CurrencyContext);
  const { accounts, toggleArchiveAccount, deleteAllData } = useContext(AccountsContext);
  const { settings: debtSettings, setEnabled: setDebtEnabled } =
    useContext(DebtsContext);
  const { deleteAllTransactions } = useContext(TransactionsContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [dashboardSettingsOpen, setDashboardSettingsOpen] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"transactions" | "everything">("transactions");
  const [deleteInput, setDeleteInput] = useState("");
  const [exportPassphraseVisible, setExportPassphraseVisible] = useState(false);
  const [importPassphraseVisible, setImportPassphraseVisible] = useState(false);
  const [exportPassphrase, setExportPassphrase] = useState("");
  const [importPassphrase, setImportPassphrase] = useState("");
  const [importFileUri, setImportFileUri] = useState<string | null>(null);

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

  // ─── Export/Import helpers ────────────────────────────────────────────────

  // Simple XOR cipher keyed on SHA-256 digest of passphrase
  const xorEncrypt = async (data: string, passphrase: string): Promise<string> => {
    const keyHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, passphrase);
    const keyBytes = Array.from(keyHash);
    const dataBytes = Array.from(data).map((c) => c.charCodeAt(0));
    const encrypted = dataBytes.map((b, i) => b ^ parseInt(keyBytes[i % keyBytes.length], 16));
    return btoa(String.fromCharCode(...encrypted));
  };

  const xorDecrypt = async (encoded: string, passphrase: string): Promise<string> => {
    const keyHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, passphrase);
    const keyBytes = Array.from(keyHash);
    const encrypted = Array.from(atob(encoded)).map((c) => c.charCodeAt(0));
    const decrypted = encrypted.map((b, i) => b ^ parseInt(keyBytes[i % keyBytes.length], 16));
    return decrypted.map((b) => String.fromCharCode(b)).join("");
  };

  const handleExport = async () => {
    if (!user?.id) return;
    try {
      const [accts, txs] = await Promise.all([
        getAllAccounts(user.id),
        getAllTransactions(user.id),
      ]);
      const payload = JSON.stringify({
        version: 1,
        exportedAt: new Date().toISOString(),
        user: { id: user.id, username: user.username, currency: user.currency },
        accounts: accts,
        transactions: txs,
      });
      const encrypted = await xorEncrypt(payload, exportPassphrase || "budgetme");
      const fileUri = FileSystem.documentDirectory + "budgetme_backup.bme";
      await FileSystem.writeAsStringAsync(fileUri, encrypted, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri, { mimeType: "application/octet-stream", dialogTitle: "Export BudgetMe data" });
    } catch (e) {
      console.log(e);
      Alert.alert(t("common.error"), "Export failed.");
    } finally {
      setExportPassphraseVisible(false);
      setExportPassphrase("");
    }
  };

  const handlePickImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      setImportFileUri(result.assets[0].uri);
      setImportPassphraseVisible(true);
    } catch (e) {
      console.log(e);
    }
  };

  const handleImport = async () => {
    if (!importFileUri || !user?.id) return;
    try {
      const encoded = await FileSystem.readAsStringAsync(importFileUri, { encoding: FileSystem.EncodingType.UTF8 });
      const decrypted = await xorDecrypt(encoded, importPassphrase || "budgetme");
      const parsed = JSON.parse(decrypted);
      for (const acc of parsed.accounts ?? []) {
        await upsertAccount({ ...acc, ownerId: user.id });
      }
      for (const tx of parsed.transactions ?? []) {
        await upsertTransaction({ ...tx, ownerId: user.id });
      }
      Alert.alert(t("common.done"), t("settings.importSuccess"));
    } catch (e) {
      console.log(e);
      Alert.alert(t("common.error"), t("settings.importFailed"));
    } finally {
      setImportPassphraseVisible(false);
      setImportPassphrase("");
      setImportFileUri(null);
    }
  };

  return (
    <View style={{ ...container, paddingBottom: 90, paddingHorizontal: 16, gap: 8 }}>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={setting_option}
      >
        <Text style={styles.label}>{t("settings.mainCurrency")}</Text>
        <View style={styles.currencyRow}>
          <Text style={styles.currencyValue}>
            {mainCurrency} {getCurrencyMeta(mainCurrency).symbol}
          </Text>
          {loading && <ActivityIndicator color="white" size="small" style={{ marginLeft: 6 }} />}
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
          style={{ alignSelf: "center" }}
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
          {t("settings.deleteData")}
        </Text>
        <Feather name="trash-2" size={20} color={colors.red} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          const subject = encodeURIComponent("BudgetMe");
          const body = encodeURIComponent(user?.id ?? "");
          Linking.openURL(
            `mailto:discojordan23@gmail.com?subject=${subject}&body=${body}`,
          );
        }}
        style={setting_option}
      >
        <Text style={styles.label}>{t("settings.contactUs")}</Text>
        <Feather name="mail" size={20} color={colors.gray} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setExportPassphraseVisible(true)} style={setting_option}>
        <Text style={styles.label}>{t("settings.exportData")}</Text>
        <Feather name="upload" size={20} color={colors.gray} />
      </TouchableOpacity>

      <TouchableOpacity onPress={handlePickImport} style={setting_option}>
        <Text style={styles.label}>{t("settings.importData")}</Text>
        <Feather name="download" size={20} color={colors.gray} />
      </TouchableOpacity>

      <TouchableOpacity onPress={logout} style={setting_option}>
        <Text style={subheadline}>{t("settings.logOut")}</Text>
        <Feather name="log-out" size={24} color="white" />
      </TouchableOpacity>

      <Text style={styles.userId} selectable>{user?.id ?? ""}</Text>

      <Modal
        visible={dashboardSettingsOpen}
        animationType="slide"
        onRequestClose={() => setDashboardSettingsOpen(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {t("settings.dashboardSettings")}
            </Text>
            <TouchableOpacity onPress={() => setDashboardSettingsOpen(false)}>
              <Feather name="x" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionLabel}>
            {t("settings.expenseAccounts")}
          </Text>
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
            <Text style={styles.modalTitle}>
              {t("settings.chooseCurrency")}
            </Text>
            <View
              style={{ flexDirection: "row", gap: 16, alignItems: "center" }}
            >
              <TouchableOpacity onPress={refreshCurrencies}>
                <Feather
                  name="refresh-cw"
                  size={20}
                  color={loading ? colors.gray : "white"}
                />
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

          <GlassInput
            containerStyle={styles.searchContainer}
            placeholder={t("common.search")}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="characters"
            leftSlot={<MaterialCommunityIcons name="magnify" size={18} color={colors.gray} />}
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
                    {item !== mainCurrency &&
                      rates[item] &&
                      rates[mainCurrency] && (
                        <Text style={styles.currencyRate}>
                          1 {mainCurrency} ={" "}
                          {(rates[item] / rates[mainCurrency]).toFixed(4)}{" "}
                          {item}
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
            <Text style={styles.deleteTitle}>{t("settings.deleteDataTitle")}</Text>

            {/* Option selector */}
            <View style={styles.deleteOptions}>
              <TouchableOpacity
                style={[styles.deleteOption, deleteMode === "transactions" && styles.deleteOptionActive]}
                onPress={() => setDeleteMode("transactions")}
              >
                <Text style={[styles.deleteOptionTitle, deleteMode === "transactions" && styles.deleteOptionTitleActive]}>
                  {t("settings.deleteTransactionsOption")}
                </Text>
                <Text style={styles.deleteOptionDesc}>{t("settings.deleteTransactionsDesc")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteOption, deleteMode === "everything" && styles.deleteOptionActive]}
                onPress={() => setDeleteMode("everything")}
              >
                <Text style={[styles.deleteOptionTitle, deleteMode === "everything" && styles.deleteOptionTitleActive]}>
                  {t("settings.deleteEverythingOption")}
                </Text>
                <Text style={styles.deleteOptionDesc}>{t("settings.deleteEverythingDesc")}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.deleteDesc}>
              {t("settings.typeToConfirm")}
              <Text style={{ color: colors.red, fontWeight: "700" }}>Delete</Text>
              {t("settings.toConfirm")}
            </Text>
            <GlassInput
              containerStyle={styles.deleteInputContainer}
              value={deleteInput}
              onChangeText={setDeleteInput}
              placeholder="Delete"
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
                style={[styles.deleteConfirmBtn, { opacity: deleteInput === "Delete" ? 1 : 0.4 }]}
                disabled={deleteInput !== "Delete"}
                onPress={async () => {
                  setDeleteConfirmVisible(false);
                  setDeleteInput("");
                  let ok: boolean;
                  if (deleteMode === "everything") {
                    ok = await deleteAllData();
                  } else {
                    ok = await deleteAllTransactions();
                  }
                  Alert.alert(
                    ok ? t("common.done") : t("common.error"),
                    ok ? t("settings.allDeleted") : t("settings.deleteFailed"),
                  );
                }}
              >
                <Text style={styles.deleteConfirmText}>{t("settings.deleteAll")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Export passphrase modal */}
      <Modal
        visible={exportPassphraseVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExportPassphraseVisible(false)}
      >
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteSheet}>
            <Text style={styles.deleteTitle}>{t("settings.exportData")}</Text>
            <Text style={styles.deleteDesc}>{t("settings.exportPassphraseHint")}</Text>
            <GlassInput
              containerStyle={styles.deleteInputContainer}
              value={exportPassphrase}
              onChangeText={setExportPassphrase}
              placeholder={t("settings.passphrase")}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
            <View style={styles.deleteActions}>
              <TouchableOpacity style={styles.deleteCancelBtn} onPress={() => { setExportPassphraseVisible(false); setExportPassphrase(""); }}>
                <Text style={styles.deleteCancelText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.deleteConfirmBtn, { backgroundColor: colors.primaryGreen }]} onPress={handleExport}>
                <Text style={[styles.deleteConfirmText, { color: "#000" }]}>{t("settings.exportData")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Import passphrase modal */}
      <Modal
        visible={importPassphraseVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImportPassphraseVisible(false)}
      >
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteSheet}>
            <Text style={styles.deleteTitle}>{t("settings.importData")}</Text>
            <Text style={styles.deleteDesc}>{t("settings.importPassphraseHint")}</Text>
            <GlassInput
              containerStyle={styles.deleteInputContainer}
              value={importPassphrase}
              onChangeText={setImportPassphrase}
              placeholder={t("settings.passphrase")}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
            <View style={styles.deleteActions}>
              <TouchableOpacity style={styles.deleteCancelBtn} onPress={() => { setImportPassphraseVisible(false); setImportPassphrase(""); }}>
                <Text style={styles.deleteCancelText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.deleteConfirmBtn, { backgroundColor: colors.primaryGreen }]} onPress={handleImport}>
                <Text style={[styles.deleteConfirmText, { color: "#000" }]}>{t("settings.importData")}</Text>
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
                    item.code === i18n.language &&
                      styles.currencyItemTextActive,
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
    backgroundColor: colors.darkBlack,
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
  searchContainer: {
    marginBottom: 12,
  },
  currencyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  currencyItemActive: {
    backgroundColor: colors.surface,
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
    borderBottomColor: "rgba(255,255,255,0.06)",
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
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
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
  deleteInputContainer: {
    marginBottom: 4,
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
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
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
  deleteOptions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  deleteOption: {
    flex: 1,
    backgroundColor: colors.darkBlack,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 4,
  },
  deleteOptionActive: {
    borderColor: colors.red,
    backgroundColor: colors.red + "22",
  },
  deleteOptionTitle: {
    color: "white",
    fontSize: size.body,
    fontWeight: font.semibold,
  },
  deleteOptionTitleActive: {
    color: colors.red,
  },
  deleteOptionDesc: {
    color: colors.gray,
    fontSize: size.footnote,
    lineHeight: 16,
  },
  userId: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 11,
    textAlign: "center",
    marginTop: 8,
    letterSpacing: 0.3,
  },
});

export default Settings;
