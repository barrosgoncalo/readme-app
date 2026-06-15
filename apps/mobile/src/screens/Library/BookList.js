import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { doSignOut } from '@readme/shared/src/services/auth'; // Import your sign-out function

export default function BookList() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>My Library</Text>
      
      {/* Temporary Logout Button */}
      <Button title="Temporary Logout" onPress={() => doSignOut()} color="red" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 }
});
