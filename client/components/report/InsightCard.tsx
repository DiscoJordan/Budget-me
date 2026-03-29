import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { colors, font, size } from "../../styles/styles";

interface Props {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
  hint?: string;
}

export default function InsightCard({ icon, label, value, valueColor, hint }: Props) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name={icon as any}
        size={20}
        color={colors.primaryGreen}
      />
      <View style={styles.textBlock}>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        <View style={styles.rightBlock}>
          <Text style={[styles.value, valueColor ? { color: valueColor } : undefined]} numberOfLines={1}>
            {value}
          </Text>
          {hint && (
            <TouchableOpacity
              onPress={() => Alert.alert(label, hint)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="info" size={14} color={colors.gray} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.darkBlack,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textBlock: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  rightBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    color: colors.gray,
    fontSize: size.footnote,
    fontWeight: font.semibold as any,
    flexShrink: 1,
  },
  value: {
    color: "white",
    fontSize: size.footnote,
    fontWeight: font.bold as any,
  },
});
