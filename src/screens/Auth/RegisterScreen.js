import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert } from 'react-native';

import { doCreateUserWithEmailAndPassword } from '../../services/auth'; 

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // To stop double-clicks

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setIsRegistering(true);
    try {
      // THIS IS WHERE THE MAGIC HAPPENS!
      await doCreateUserWithEmailAndPassword(email, password);
      // If it succeeds, your AuthContext automatically sees the new user,
      // and your AppNavigator will instantly switch to your Main Tabs!
      
    } catch (error) {
      // If they type a bad email or the password is too short, Firebase tells us here
      Alert.alert("Registration Failed", error.message);
      setIsRegistering(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      <TextInput 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        style={styles.input} 
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput 
        placeholder="Password" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
        style={styles.input} 
      />
      
      <Button 
        title={isRegistering ? "Creating Account..." : "Register"} 
        onPress={handleRegister} 
        disabled={isRegistering}
      />
      
      <Button 
        title="Already have an account? Log in" 
        onPress={() => navigation.navigate('Login')} 
        color="gray"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginVertical: 10, borderRadius: 8 }
});
