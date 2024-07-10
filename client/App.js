import React from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
} from "react-native";
import { UsersProvider } from "./context/UsersContext";
import { AccountsProvider } from "./context/AccountsContext";
import { TransactionsProvider } from "./context/TransactionsContext";

const App = () => {
  return (
    // <AccountsProvider>
    //   <TransactionsProvider>
    //     <UsersProvider>
          <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
            <View style={styles.container}>
              <Text style={[styles.textBody, styles.text]}>
                A scrollable list bel
              </Text>

              <Text style={[styles.textBody, styles.text]}>
                And some content after
              </Text>
            </View>
          </SafeAreaView>
    //     </UsersProvider>
    //   </TransactionsProvider>
    // </AccountsProvider>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    backgroundColor: "pink",
    marginHorizontal: 20,
    flex: 0.5,
  },
  text: {
    fontSize: 30,
    textAlign: "center",
  },
  textBody: {
    flex: 0.1,
  },
});
