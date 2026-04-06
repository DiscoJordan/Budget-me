import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../styles/styles";

interface Props {
  iconName: string;
  iconColor: string;
  name?: string;
  balance?: string;
  size?: number;
  onPress?: () => void;
}

export default function LiquidAccountTile({
  iconName,
  iconColor,
  name,
  balance,
  size = 72,
  onPress,
}: Props) {
  const borderRadius = size * 0.22;
  const iconSize = size * 0.33;
  const iconWrapSize = size * 0.5;

  const content = (
    <BlurView
      intensity={28}
      tint="dark"
      style={[
        styles.tile,
        { width: size, height: size, borderRadius, overflow: "hidden", borderWidth: 1, borderColor: iconColor + "44" },
      ]}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: iconColor + "18" }]} />
      <View
        style={[
          styles.iconWrap,
          {
            width: iconWrapSize,
            height: iconWrapSize,
            borderRadius: iconWrapSize * 0.3,
            backgroundColor: iconColor + "55",
            shadowColor: iconColor,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={iconName as any}
          size={iconSize}
          color="white"
        />
      </View>
      {name && (
        <Text numberOfLines={1} style={[styles.name, { maxWidth: size - 8 }]}>
          {name}
        </Text>
      )}
      {balance && (
        <Text numberOfLines={1} style={[styles.balance, { maxWidth: size - 8 }]}>
          {balance}
        </Text>
      )}
    </BlurView>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.75} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  tile: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  name: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
  },
  balance: {
    color: "white",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },
});
