import React from "react";
import { StyleSheet, Text, View } from "react-native";

const footer = () => {
  return (
    <View style={styles.footer}>
      <Text>
        By continuing, you agree to our <View style={{color:"blue"}}> T&C </View>
        and  
        <View style={{color:"blue"}}> Privacy Policy </View>
      </Text>
    </View>
  );
};

export default footer;
const styles = StyleSheet.create({
  footer: {
    width: "100%",
    height: 50,
    fontSize: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});