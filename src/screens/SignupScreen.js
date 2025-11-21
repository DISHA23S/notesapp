// src/screens/SignupScreen.js
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { addUser } from '../storage/localStore';

export default function SignupScreen() {
  const nav = useNavigation();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const onSignup = async () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername || pin.length < 4) {
      setError('Username and 4+ digit PIN required.');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match.');
      return;
    }
    try {
      await addUser(trimmedUsername, pin);
      setError('');
      Alert.alert('User created', 'Account created successfully. You can now switch to this account.', [{ text: 'OK', onPress: () => nav.goBack() }]);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <View style={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        
        <Text style={styles.label}>Username</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          style={[styles.input, styles.inputText]}
          autoCapitalize="none"
          placeholder="Choose a username"
          placeholderTextColor="#666"
          selectionColor="#007AFF"
        />
        
        <Text style={styles.label}>PIN (4+ digits)</Text>
        <TextInput
          value={pin}
          onChangeText={setPin}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={6}
          style={[styles.input, styles.inputText]}
          placeholder="Create PIN"
          placeholderTextColor="#666"
          selectionColor="#007AFF"
        />
        
        <Text style={styles.label}>Confirm PIN</Text>
        <TextInput
          value={confirmPin}
          onChangeText={setConfirmPin}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={6}
          style={[styles.input, styles.inputText]}
          placeholder="Re-enter PIN"
          placeholderTextColor="#666"
          selectionColor="#007AFF"
        />
        
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.hint}>Accounts stay on this device only.</Text>
        
        <TouchableOpacity style={styles.button} onPress={onSignup}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Text style={styles.link}>Cancel</Text>
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
