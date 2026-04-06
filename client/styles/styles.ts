import { Dimensions } from "react-native";

export const windowWidth = Dimensions.get("window").width;
export const windowHeight = Dimensions.get("window").height;

export const colors = {
  primaryGreen: "#46f1c5",
  background: "#070e1a",
  darkBlack: "#04080f",
  darkGray: "#171f2b",
  darkgray: "#171f2b",
  gray: "#bacac2",
  red: "#ffb2be",
  green: "#46f1c5",
  surface: "#0c1420",
  surfaceHigh: "#1c2633",
  border: "rgba(255,255,255,0.08)",
};

export const font = {
  regular: "400" as const,
  semibold: "600" as const,
  bold: "700" as const,
};

export const sizes = {
  navigation: 10,
  caption2: 11,
  caption1: windowWidth * 0.025,
  footnote: 13,
  subheadline: 15,
  callout: 16,
  body: 17,
  headline: 17,
  title1: 28,
  title2: 22,
  title3: 20,
  largeTitle: 34,
};

/** Alias for sizes — kept for backwards compat */
export const size = sizes;

export const caption2 = {
  color: "white" as const,
  fontSize: sizes.caption2,
  fontWeight: font.regular,
};

export const title2 = {
  color: "white" as const,
  fontSize: sizes.title2,
  fontWeight: font.bold,
};

export const largeTitle = {
  color: colors.primaryGreen,
  fontSize: sizes.largeTitle,
  fontWeight: font.bold,
};

export const caption1 = {
  color: "white" as const,
  fontSize: sizes.caption1,
  fontWeight: font.regular,
};

export const subheadline = {
  color: "white" as const,
  fontSize: sizes.subheadline,
  fontWeight: font.bold,
};

export const body = {
  color: "white" as const,
  fontSize: sizes.body,
  fontWeight: font.bold,
};

export const container = {
  color: "#ffffff" as const,
  backgroundColor: colors.background,
  justifyContent: "center" as const,
  gap: 4,
  width: "100%" as const,
};

export const accounts__block = {
  paddingTop: 4,
  paddingBottom: 4,
  gap: 8,
  width: "100%" as const,
};

export const accounts__header = {
  flexDirection: "row" as const,
  justifyContent: "space-between" as const,
};

export const accounts__body = {
  width: "100%" as const,
};

export const accounts__add = {
  height: (windowWidth - 40 - 10 * 10) / 5,
  margin: 10,
  aspectRatio: 1 / 1,
  borderRadius: 16,
  justifyContent: "center" as const,
  alignItems: "center" as const,
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.08)" as const,
};

export const account = {
  flexDirection: "column" as const,
  alignItems: "center" as const,
  width: (windowWidth - 40) / 5,
};

export const green_line = {
  width: "100%" as const,
  height: 1,
  backgroundColor: colors.primaryGreen,
};

export const setting_option = {
  backgroundColor: colors.surface,
  width: "100%" as const,
  height: 60,
  justifyContent: "space-between" as const,
  flexDirection: "row" as const,
  alignItems: "center" as const,
  paddingLeft: 20,
  paddingRight: 20,
  borderRadius: 12,
  color: "white" as const,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.07)" as const,
};

export const input = {
  backgroundColor: colors.darkBlack,
  color: "white" as const,
  fontSize: 16,
  width: windowWidth - 40,
  padding: 16,
  borderRadius: 20,
};

export const h1 = {
  color: "#ffffff" as const,
  fontSize: 30,
};

export const submit_button = {
  backgroundColor: "#46f1c5" as const,
  width: windowWidth - 40,
  alignItems: "center" as const,
  padding: 16,
  borderRadius: 20,
  position: "absolute" as const,
  bottom: 30,
};

export const submit_button_text = {
  color: "#00382f" as const,
  fontSize: 16,
  fontWeight: "700" as const,
};

/** Alias kept for backwards compat (some screens imported `blue` but it was never defined) */
export const blue = {};
