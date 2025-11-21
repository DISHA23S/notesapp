// src/components/NoteCard.js
import React from 'react';
import { Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const truncate = (text = '', len = 120) => {
  if (!text) return '';
  return text.length > len ? `${text.slice(0, len)}...` : text;
};

export default function NoteCard({ note, onPress, onDelete, onView }) {
  const preview = truncate(note.body);
  const subtitle = note.updatedAt ? new Date(note.updatedAt).toLocaleString() : 'Draft';
  const initial = (note.title || 'N').slice(0, 1).toUpperCase();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        {/* Avatar/Image */}
        {(note.imageUris && note.imageUris.length) || note.imageUri ? (
          <View style={styles.avatarWrap}>
            <Pressable
              onPress={() => onView && onView(note)}
              style={styles.avatarTouchable}
            >
              <Image source={{ uri: (note.imageUris && note.imageUris.length) ? note.imageUris[0] : note.imageUri }} style={styles.avatar} />
            </Pressable>
            {(note.imageUris && note.imageUris.length > 1) && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{note.imageUris.length}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}
        
        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{note.title?.trim() || 'Untitled note'}</Text>
          {/* <Text style={styles.subtitle}>{subtitle}</Text> */}
          {preview ? <Text style={styles.preview}>{preview}</Text> : null}
        </View>
        
        {/* Delete Button */}
        <TouchableOpacity
          onPress={() => onDelete && onDelete()}
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
  avatarWrap: {
    width: 50,
    height: 50,
    marginRight: 12,
    position: 'relative',
  },
  avatarTouchable: {
    width: 50,
    height: 50,
  },
  viewButton: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
    zIndex: 10,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  countBadge: {
    position: 'absolute',
    left: -8,
    top: -8,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    paddingHorizontal: 4,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
    zIndex: 10,
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
