import { Dimensions } from "react-native";
const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
const colors = {
  primaryGreen: "#009F9C",
  background: "#1E1E1E",
  darkBlack: "#0F0F0F",
  darkGray: "#434343",
  gray: "#919191",
  red: "#FF5959",
  green: "#44FFBC",
};
const font = {
  regular: 400,
  semibold: 600,
  bold: 700,
};
const sizes = {
  navigation: 10,
  caption2: 11,
  caption1: 12,
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
const caption2 = {
  color: "white",
  fontSize: sizes.caption2,
  fontWeight: font.regular,
};
const caption1 = {
  color: "white",
  fontSize: sizes.caption1,
  fontWeight: font.regular,
};
const subheadline = {
  color: "white",
  fontSize: sizes.subheadline,
  fontWeight: font.bold,
};
const body = {
  color: "white",
  fontSize: sizes.body,
  fontWeight: font.bold,
};
const container = {
  color: "#ffffff",
  backgroundColor: colors.background,
  margin: "20px",
  alignItems: "center",
  justifyContent: "center",
  gap: "30px",
  width:"100%"
};
const accounts__block = {
  paddingTop: 8,
  paddingBottom: 8,
  gap: 20,
  width: "90%",
};
const accounts__header = {
  flexDirection: "row",
  justifyContent: "space-between",
};
const accounts__body = {
  width: "100%",
};
const accounts__add = {
  height: (windowWidth - 40 - 10 * 10) / 5, //40(container padding, 4*10(margins of buttons))
  margin: 10,
  aspectRatio: 1 / 1,
  borderRadius: 20,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: colors.darkGray,
};
const account = {

  flexDirection: "column",
  alignItems: "center",
};
const green_line = {
  width: "100%",
  height: 1,
  backgroundColor: colors.primaryGreen,
};

const setting_option = {
  backgroundColor: colors.darkGray,
  width: "100%",
  height: 60,
  justifyContent: "space-between",
  flexDirection: "row",
  alignItems: "center",
  paddingLeft: 20,
  paddingRight: 20,
  color: "white",
};
const input = {
  backgroundColor: colors.darkBlack,
  color: "white",
  fontSize: "16px",
  width: "80%",
  padding: 16,
  borderRadius: 20,
};

const h1 = {
  color: "#ffffff",
  fontSize: "30px",
};
const submit_button = {
  backgroundColor: "#009F9C",
  width: "80%",
  alignItems: "center",
  padding: 16,
  borderRadius: 20,
  position: "absolute",
  bottom: 30,
  width: "80%",
};
const submit_button_text = {
  color: "white",
  fontSize: "16px",
};

module.exports = {
  container,
  h1,
  input,
  submit_button,
  submit_button_text,
  colors,
  font,
  sizes,
  caption2,
  caption1,
  setting_option,
  subheadline,
  green_line,
  accounts__block,
  accounts__header,
  accounts__body,
  accounts__add,
  body,
  account,
  windowWidth,
};
