// src/screens/LoginScreen.js
import { useNavigation } from '@react-navigation/native';
import React, { useContext, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../navigation/AuthContext';
import { getUsers } from '../storage/localStore';

export default function LoginScreen() {
  const nav = useNavigation();
  const { signIn } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const onLogin = async () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !pin.trim()) {
      setError('Enter both username and PIN');
      return;
    }
    const users = await getUsers();
    const normalized = trimmedUsername.toLowerCase();
    const found = users.find(u => u.username.toLowerCase() === normalized && u.pin === pin.trim());
    if (!found) {
      setError('Invalid username or PIN');
      return;
    }
    setError('');
    signIn({ username: found.username });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome Back</Text>
        
        <Text style={styles.label}>Username</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          style={[styles.input, styles.inputText]}
          autoCapitalize="none"
          placeholder="Enter username"
          placeholderTextColor="#666"
          selectionColor="#007AFF"
        />
        
        <Text style={styles.label}>PIN</Text>
        <TextInput
          value={pin}
          onChangeText={setPin}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={6}
          style={[styles.input, styles.inputText]}
          placeholder="Enter PIN"
          placeholderTextColor="#666"
          selectionColor="#007AFF"
        />
        
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.hint}>PIN stays on device only. Minimum 4 digits.</Text>
        
        <TouchableOpacity style={styles.button} onPress={onLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => nav.navigate('Signup')}>
          <Text style={styles.link}>Create an account</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 10 },
  input: { 
    borderWidth: 1, 
    borderColor: '#ccc', 
    padding: 12, 
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9'
  },
  // ensure text color is explicit so bullets/placeholders are visible in release builds
  inputText: {
    color: '#000'
  },
  hint: { fontSize: 12, color: '#666', marginTop: 8, marginBottom: 20 },
  error: { fontSize: 12, color: 'red', marginTop: 8 },
  button: { 
    backgroundColor: '#007AFF', 
    padding: 14, 
    borderRadius: 8, 
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { color: '#007AFF', textAlign: 'center', marginTop: 20, fontSize: 14 },
});
