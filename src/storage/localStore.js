// src/storage/localStore.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const USERS_KEY = 'USERS';

export async function getUsers() {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveUsers(users) {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function addUser(username, pin) {
  const users = await getUsers();
  if (users.find(u => u.username === username)) throw new Error('Username taken');
  users.push({ username, pin }); // For demo store plain pin; for real, hash it
  await saveUsers(users);
}

export function notesKey(username) {
  return `NOTES_${username}`;
}

export async function getNotes(username) {
  const raw = await AsyncStorage.getItem(notesKey(username));
  return raw ? JSON.parse(raw) : [];
}

export async function saveNotes(username, notes) {
  await AsyncStorage.setItem(notesKey(username), JSON.stringify(notes));
}

export async function addOrUpdateNote(username, note) {
  const notes = await getNotes(username);
  const idx = notes.findIndex(n => n.id === note.id);
  note.updatedAt = Date.now();
  if (idx === -1) notes.unshift(note);
  else notes[idx] = note;
  await saveNotes(username, notes);
  return note;
}

export async function deleteNote(username, noteId) {
  let notes = await getNotes(username);
  notes = notes.filter(n => n.id !== noteId);
  await saveNotes(username, notes);
}

// Save image to permanent file and return fileUri
export async function saveImageFile(uri, filename = null) {
  try {
    if (!filename) filename = `${uuidv4()}.jpg`;
    const dest = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch (e) {
    console.log('saveImageFile error', e);
    throw e;
  }
}
