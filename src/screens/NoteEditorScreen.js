// src/screens/NoteEditorScreen.js
import * as ImagePicker from 'expo-image-picker';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { AuthContext } from '../navigation/AuthContext';
import { addOrUpdateNote, saveImageFile } from '../storage/localStore';

export default function NoteEditorScreen({ route, navigation }) {
  const { user } = useContext(AuthContext);
  const existing = route.params?.note;
  const [title, setTitle] = useState(existing?.title || '');
  const [body, setBody] = useState(existing?.body || '');
  const [imageUris, setImageUris] = useState(
    existing?.imageUris || (existing?.imageUri ? [existing.imageUri] : [])
  );
  const [saving, setSaving] = useState(false);
  const [viewVisible, setViewVisible] = useState(false);
  const [viewIndex, setViewIndex] = useState(0);

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
    setImageUris((prev) => [...(prev || []), saved]);
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
      // append all selected assets (if multiple) or the first
      for (const asset of result.assets) {
        // persistSelection will update state
        // no await to allow parallel operations
        // but keep sequential for reliability
        // await persistSelection(asset.uri);
        // do sequentially to avoid race with FileSystem
         
        await persistSelection(asset.uri);
      }
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
        imageUris: imageUris && imageUris.length ? imageUris : null,
        updatedAt: Date.now(),
      };
      await addOrUpdateNote(user.username, note);
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        placeholder="Meeting recap, shopping list..."
        placeholderTextColor="#666"
        selectionColor="#007AFF"
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
        placeholderTextColor="#666"
        selectionColor="#007AFF"
      />
      
      <Text style={styles.hint}>Notes are saved offline per account.</Text>
      
      {imageUris && imageUris.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.multiImageRow}>
          {imageUris.map((uri, idx) => (
            <View key={uri + idx} style={styles.imageWrapperThumb}>
              <Image source={{ uri }} style={styles.thumb} />
              <View style={styles.imageOverlayTopRight} pointerEvents="box-none">
                <TouchableOpacity
                  onPress={() => {
                    setViewIndex(idx);
                    setViewVisible(true);
                  }}
                  style={[styles.overlayButton, styles.viewButton]}
                >
                  <Text style={styles.overlayButtonText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setImageUris(prev => prev.filter((p, i) => i !== idx))}
                  style={[styles.overlayButton, styles.removeImageBtn]}
                >
                  <Text style={styles.removeImageText}>x</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
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
    {/* Fullscreen image viewer */}
    <Modal visible={viewVisible} transparent animationType="fade" onRequestClose={() => setViewVisible(false)}>
      <View style={styles.viewerContainer}>
        <TouchableOpacity style={styles.viewerCloseArea} onPress={() => setViewVisible(false)} />
        {imageUris && imageUris.length ? (
          <Image source={{ uri: imageUris[viewIndex] }} style={styles.viewerImage} resizeMode="contain" />
        ) : null}
        {imageUris && imageUris.length > 1 ? (
          <View style={styles.viewerNavRow} pointerEvents="box-none">
            <TouchableOpacity
              onPress={() => setViewIndex(i => Math.max(0, i - 1))}
              style={styles.viewerNavBtn}
            >
              <Text style={styles.viewerNavText}>{'<'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewIndex(i => Math.min(imageUris.length - 1, i + 1))}
              style={styles.viewerNavBtn}
            >
              <Text style={styles.viewerNavText}>{'>'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <TouchableOpacity style={styles.viewerCloseBtn} onPress={() => setViewVisible(false)}>
          <Text style={styles.viewerCloseText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
    </>
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
    color: '#000',
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
    color: '#000',
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
  multiImageRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  imageWrapperThumb: {
    position: 'relative',
    width: 120,
    height: 90,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  imageOverlayTopRight: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlayButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  viewButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginRight: 8,
  },
  overlayButtonText: {
    color: '#000',
    fontWeight: '700',
  },
  removeImageBtn: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  viewerCloseArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  viewerImage: {
    width: '100%',
    height: '80%',
  },
  viewerCloseBtn: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
  },
  viewerCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  viewerNavRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: '50%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewerNavBtn: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
  },
  viewerNavText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
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
