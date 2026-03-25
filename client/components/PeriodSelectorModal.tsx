import React, { useContext, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  AccountingPeriodContext,
  PeriodType,
} from "../context/AccountingPeriodContext";
import { colors } from "../styles/styles";

interface Props {
  visible: boolean;
  onClose: () => void;
}

const PERIODS: { type: PeriodType; label: string }[] = [
  { type: "week", label: "Week (last 7 days)" },
  { type: "month", label: "Month" },
  { type: "quarter", label: "Quarter" },
  { type: "half-year", label: "Half a year" },
  { type: "year", label: "Year" },
  { type: "all", label: "All period" },
  { type: "custom", label: "Select period" },
];

export default function PeriodSelectorModal({ visible, onClose }: Props) {
  const { periodType, setPeriodType, setCustomRange, customFrom, customTo } =
    useContext(AccountingPeriodContext);

  const [showCustom, setShowCustom] = useState(false);
  const [localFrom, setLocalFrom] = useState<Date>(customFrom ?? new Date());
  const [localTo, setLocalTo] = useState<Date>(customTo ?? new Date());

  // Android: control whether the picker dialog is shown
  const [androidPickerTarget, setAndroidPickerTarget] = useState<
    "from" | "to" | null
  >(null);

  const handleSelectPeriod = (type: PeriodType) => {
    if (type === "custom") {
      setLocalFrom(customFrom ?? new Date());
      setLocalTo(customTo ?? new Date());
      setShowCustom(true);
    } else {
      setPeriodType(type);
      onClose();
    }
  };

  const handleApplyCustom = () => {
    setCustomRange(localFrom, localTo);
    setShowCustom(false);
    onClose();
  };

  const handleClose = () => {
    setShowCustom(false);
    onClose();
  };

  const MIN_DATE = new Date(2000, 0, 1);

  const onDateChange = (
    event: DateTimePickerEvent,
    date: Date | undefined,
    target: "from" | "to",
  ) => {
    if (Platform.OS === "android") setAndroidPickerTarget(null);
    if (event.type !== "set" || !date) return;
    if (target === "from") {
      setLocalFrom(date);
      // push "to" forward if it became earlier than "from"
      if (date > localTo) setLocalTo(date);
    } else {
      setLocalTo(date);
    }
  };

  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleClose}
      />

      <View style={styles.sheet}>
        {!showCustom ? (
          <>
            <Text style={styles.title}>Accounting period</Text>
            {PERIODS.map(({ type, label }) => {
              const isActive = periodType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.option, isActive && styles.optionActive]}
                  onPress={() => handleSelectPeriod(type)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isActive && styles.optionTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                  {isActive && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </>
        ) : (
          <>
            <Text style={styles.title}>Select period</Text>

            <View style={styles.dateRow}>
              <TouchableOpacity
                style={styles.dateTile}
                onPress={() =>
                  Platform.OS === "android"
                    ? setAndroidPickerTarget("from")
                    : undefined
                }
              >
                <Text style={styles.dateTileLabel}>From</Text>
                <Text style={styles.dateTileValue}>{fmtDate(localFrom)}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateTile}
                onPress={() =>
                  Platform.OS === "android"
                    ? setAndroidPickerTarget("to")
                    : undefined
                }
              >
                <Text style={styles.dateTileLabel}>To</Text>
                <Text style={styles.dateTileValue}>{fmtDate(localTo)}</Text>
              </TouchableOpacity>
            </View>

            {/* iOS: always-visible spinners */}
            {Platform.OS === "ios" && (
              <>
                <Text style={styles.pickerLabel}>From</Text>
                <DateTimePicker
                  value={localFrom}
                  mode="date"
                  display="spinner"
                  themeVariant="dark"
                  minimumDate={MIN_DATE}
                  maximumDate={new Date()}
                  onChange={(e, d) => onDateChange(e, d, "from")}
                  style={styles.picker}
                />
                <Text style={styles.pickerLabel}>To</Text>
                <DateTimePicker
                  value={localTo}
                  mode="date"
                  display="spinner"
                  themeVariant="dark"
                  minimumDate={localFrom}
                  maximumDate={new Date()}
                  onChange={(e, d) => onDateChange(e, d, "to")}
                  style={styles.picker}
                />
              </>
            )}

            {/* Android: dialog pickers shown on demand */}
            {Platform.OS === "android" && androidPickerTarget === "from" && (
              <DateTimePicker
                value={localFrom}
                mode="date"
                display="default"
                minimumDate={MIN_DATE}
                maximumDate={new Date()}
                onChange={(e, d) => onDateChange(e, d, "from")}
              />
            )}
            {Platform.OS === "android" && androidPickerTarget === "to" && (
              <DateTimePicker
                value={localTo}
                mode="date"
                display="default"
                minimumDate={localFrom}
                maximumDate={new Date()}
                onChange={(e, d) => onDateChange(e, d, "to")}
              />
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={() => setShowCustom(false)}
                style={styles.backBtn}
              >
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleApplyCustom}
                style={styles.applyBtn}
              >
                <Text style={styles.applyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    backgroundColor: colors.darkBlack,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 4,
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.darkGray,
    marginBottom: 4,
  },
  optionActive: {
    backgroundColor: colors.primaryGreen + "33",
    borderWidth: 1,
    borderColor: colors.primaryGreen,
  },
  optionText: {
    color: "white",
    fontSize: 16,
  },
  optionTextActive: {
    color: colors.primaryGreen,
    fontWeight: "600",
  },
  check: {
    color: colors.primaryGreen,
    fontSize: 16,
    fontWeight: "700",
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  dateTile: {
    flex: 1,
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  dateTileLabel: {
    color: colors.gray,
    fontSize: 12,
  },
  dateTileValue: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  pickerLabel: {
    color: colors.gray,
    fontSize: 13,
    marginTop: 8,
    marginBottom: 2,
    paddingLeft: 4,
  },
  picker: {
    width: "100%",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  backBtn: {
    flex: 1,
    backgroundColor: colors.darkGray,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
  backText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  applyBtn: {
    flex: 2,
    backgroundColor: colors.primaryGreen,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
  applyText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});
