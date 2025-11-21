// src/components/NoteCard.js
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const truncate = (text = '', len = 120) => {
  if (!text) return '';
  return text.length > len ? `${text.slice(0, len)}...` : text;
};

export default function NoteCard({ note, onPress, onDelete }) {
  const preview = truncate(note.body);
  const subtitle = note.updatedAt ? new Date(note.updatedAt).toLocaleString() : 'Draft';
  const initial = (note.title || 'N').slice(0, 1).toUpperCase();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        {/* Avatar/Image */}
        {note.imageUri ? (
          <Image source={{ uri: note.imageUri }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}
        
        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{note.title?.trim() || 'Untitled note'}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          {preview ? <Text style={styles.preview}>{preview}</Text> : null}
        </View>
        
        {/* Delete Button */}
        <TouchableOpacity
          onPress={(e) => {
            e?.stopPropagation?.();
            onDelete();
          }}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  preview: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d11a2a',
  },
});
