import React from 'react'
import { StyleSheet, Text, View, TextInput,TouchableOpacity } from "react-native";
function Report({navigation}) {
  return (
    <Text onPress={()=>navigation.navigate("Settings")}>Report</Text>
    
  )
}

export default Report