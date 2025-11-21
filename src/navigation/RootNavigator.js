// src/navigation/RootNavigator.js
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import LoginScreen from '../screens/LoginScreen';
import NoteEditorScreen from '../screens/NoteEditorScreen';
import NotesListScreen from '../screens/NotesListScreen';
import SignupScreen from '../screens/SignupScreen';
import { AuthContext } from './AuthContext';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const [user, setUser] = useState(null);
  const auth = {
    user,
    signIn: (userObj) => setUser(userObj),
    signOut: () => setUser(null),
  };

  return (
    <AuthContext.Provider value={auth}>
      <Stack.Navigator>
        {user == null ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Notes" component={NotesListScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="Editor"
              component={NoteEditorScreen}
              options={({ route }) => ({
                title: route.params?.note ? 'Edit Note' : 'Create Note',
                headerBackTitle: 'Back',
              })}
            />
          </>
        )}
      </Stack.Navigator>
    </AuthContext.Provider>
  );
}
