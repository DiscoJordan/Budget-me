// Ambient module declarations for packages that don't ship their own types
// but are available at runtime via Expo/Metro bundler.

declare module "@expo/vector-icons" {
  import React from "react";
  import { TextProps } from "react-native";

  interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
    style?: any;
  }

  export class MaterialCommunityIcons extends React.Component<IconProps> {}
  export class AntDesign extends React.Component<IconProps> {}
  export class Ionicons extends React.Component<IconProps> {}
  export class FontAwesome5 extends React.Component<IconProps> {}
  export class EvilIcons extends React.Component<IconProps> {}
  export class Feather extends React.Component<IconProps> {}
}
