import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Pressable } from 'react-native';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <TextInput 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        style={styles.input} 
        autoCapitalize="none"
      />
      <TextInput 
        placeholder="Password" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
        style={styles.input} 
      />
      <Button title="Log In" onPress={() => console.log('Login pressed')} />

      <Pressable 
      style={styles.forgotPasswordContainer} 
      onPress={() => Alert.alert("Reset Password", "Redirect to reset screen")}
      >
      {({ pressed, hovered }) => (
          <Text style={[
              styles.forgotPasswordText, 
              (pressed || hovered) && styles.forgotPasswordTextDark
          ]}>
          Forgot password?
          </Text>
      )}
      </Pressable>      
      
      <Button 
        title="Don't have an account? Register" 
        onPress={() => navigation.navigate('Register')} 
        color="gray"
      />
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginVertical: 10, borderRadius: 8 },
    forgotPasswordContainer: {
        alignSelf: 'flex-start',
        marginTop: -5,
        marginBottom: 20,
        paddingVertical: 5, 
    },
    forgotPasswordText: {
        color: '#9CA3AF', // Cinzento claro base
        fontSize: 13,
        fontWeight: '500',
    },
    forgotPasswordTextDark: {
        color: '#374151', // Apenas um tom mais escuro, SEM sublinhado
    },
});
