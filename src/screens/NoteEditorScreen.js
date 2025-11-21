// src/screens/NoteEditorScreen.js
import * as ImagePicker from 'expo-image-picker';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { AuthContext } from '../navigation/AuthContext';
import { addOrUpdateNote, saveImageFile } from '../storage/localStore';

export default function NoteEditorScreen({ route, navigation }) {
  const { user } = useContext(AuthContext);
  const existing = route.params?.note;
  const [title, setTitle] = useState(existing?.title || '');
  const [body, setBody] = useState(existing?.body || '');
  const [imageUri, setImageUri] = useState(existing?.imageUri || null);
  const [saving, setSaving] = useState(false);

  const [cameraPermission, requestCameraPermission] = ImagePicker.useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = ImagePicker.useMediaLibraryPermissions();

  useEffect(() => {
    if (!cameraPermission?.granted) {
      requestCameraPermission();
    }
    if (!mediaPermission?.granted) {
      requestMediaPermission();
    }
  }, [cameraPermission?.granted, mediaPermission?.granted, requestCameraPermission, requestMediaPermission]);

  const persistSelection = async (uri) => {
    if (!uri) return;
    const saved = await saveImageFile(uri, `${uuidv4()}.jpg`);
    setImageUri(saved);
  };

  const pickImage = async () => {
    if (!mediaPermission?.granted) {
      const { granted } = await requestMediaPermission();
      if (!granted) {
        Alert.alert('Permission needed', 'Allow photo library access to pick an image.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets?.length) {
      await persistSelection(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    if (!cameraPermission?.granted) {
      const { granted } = await requestCameraPermission();
      if (!granted) {
        Alert.alert('Permission needed', 'Allow camera access to take a picture.');
        return;
      }
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length) {
      await persistSelection(result.assets[0].uri);
    }
  };

  const onSave = async () => {
    if (!title.trim() && !body.trim()) {
      Alert.alert('Add note details', 'Enter at least a title or the body before saving.');
      return;
    }
    setSaving(true);
    try {
      const note = {
        id: existing?.id || uuidv4(),
        title: title.trim(),
        body: body.trim(),
        imageUri: imageUri || null,
        updatedAt: Date.now(),
      };
      await addOrUpdateNote(user.username, note);
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        placeholder="Meeting recap, shopping list..."
      />
      
      <Text style={styles.label}>Body</Text>
      <TextInput
        value={body}
        onChangeText={setBody}
        style={styles.bodyInput}
        multiline
        numberOfLines={8}
        textAlignVertical="top"
        placeholder="Capture all the details here"
      />
      
      <Text style={styles.hint}>Notes are saved offline per account.</Text>
      
      {imageUri ? (
        <View style={styles.imageWrapper}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <TouchableOpacity
            onPress={() => setImageUri(null)}
            style={styles.removeImageBtn}
          >
            <Text style={styles.removeImageText}>X</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
          <Text style={styles.actionButtonText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
          <Text style={styles.actionButtonText}>Camera</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
        onPress={onSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Saving...' : (existing ? 'Update Note' : 'Save Note')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 12,
  },
  bodyInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    minHeight: 180,
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '500',
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  image: {
    width: '100%',
    height: 220,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#999',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
