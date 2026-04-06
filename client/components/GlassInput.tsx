import React, { memo, useCallback } from "react";
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  StyleProp,
  ViewStyle,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import { colors } from "../styles/styles";

interface GlassInputProps extends TextInputProps {
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  variant?: "default" | "disabled";
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

const GlassInput = memo(({
  style,
  containerStyle,
  variant = "default",
  leftSlot,
  rightSlot,
  onFocus,
  onBlur,
  editable,
  ...textInputProps
}: GlassInputProps) => {
  const isDisabled = variant === "disabled" || editable === false;
  const focused = useSharedValue(0);

  const animatedBorder = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focused.value, [0, 1], [
      "rgba(255,255,255,0.12)",
      "rgba(255,255,255,0.28)",
    ]),
  }));

  const handleFocus = useCallback((e: any) => {
    focused.value = withTiming(1, { duration: 200 });
    onFocus?.(e);
  }, [onFocus]);

  const handleBlur = useCallback((e: any) => {
    focused.value = withTiming(0, { duration: 200 });
    onBlur?.(e);
  }, [onBlur]);

  return (
    <Animated.View style={[styles.border, animatedBorder, containerStyle]}>
      <View style={[styles.row, isDisabled && styles.disabled]}>
        {leftSlot && <View style={styles.slotLeft}>{leftSlot}</View>}
        <TextInput
          {...textInputProps}
          editable={!isDisabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            leftSlot && styles.inputWithLeft,
            rightSlot && styles.inputWithRight,
            style,
          ]}
          placeholderTextColor="rgba(255,255,255,0.35)"
          selectionColor={colors.primaryGreen}
          cursorColor={colors.primaryGreen}
        />
        {rightSlot && <View style={styles.slotRight}>{rightSlot}</View>}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  border: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "white",
  },
  inputWithLeft: {
    marginLeft: 10,
  },
  inputWithRight: {
    marginRight: 10,
  },
  slotLeft: {
    justifyContent: "center",
  },
  slotRight: {
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.4,
  },
});

export default GlassInput;
