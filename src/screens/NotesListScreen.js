// src/screens/NotesListScreen.js
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import NoteCard from '../components/NoteCard';
import { AuthContext } from '../navigation/AuthContext';
import { deleteNote, getNotes, getUsers } from '../storage/localStore';

export default function NotesListScreen({ navigation }) {
  const { user, signOut, signIn } = useContext(AuthContext);
  const [notes, setNotes] = useState([]);
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState({ type: 'updatedAt', dir: 'desc' });
  const [menuVisible, setMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [switchVisible, setSwitchVisible] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [switchPin, setSwitchPin] = useState('');
  const [switchError, setSwitchError] = useState('');
  const [switchLoading, setSwitchLoading] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUris, setViewerUris] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  const loadNotes = useCallback(async () => {
    setRefreshing(true);
    try {
      const all = await getNotes(user.username);
      setNotes(all || []);
    } finally {
      setRefreshing(false);
    }
  }, [user.username]);

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [loadNotes])
  );

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = notes.filter((n) => (`${n.title ?? ''} ${n.body ?? ''}`).toLowerCase().includes(q));
    return items.sort((a, b) => {
      if (sortMode.type === 'updatedAt') {
        const aVal = a.updatedAt || 0;
        const bVal = b.updatedAt || 0;
        return sortMode.dir === 'desc' ? bVal - aVal : aVal - bVal;
      }
      const aTitle = a.title?.toLowerCase() || '';
      const bTitle = b.title?.toLowerCase() || '';
      if (aTitle === bTitle) return 0;
      return sortMode.dir === 'asc' ? aTitle.localeCompare(bTitle) : bTitle.localeCompare(aTitle);
    });
  }, [notes, query, sortMode]);

  const confirmDelete = (note) => {
    Alert.alert('Delete note?', `This will permanently remove "${note.title || 'Untitled'}"`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteNote(user.username, note.id);
          loadNotes();
        },
      },
    ]);
  };

  const openSwitchModal = async () => {
    try {
      const all = await getUsers();
      setUsers(all || []);
      setSelectedUser(null);
      setSwitchPin('');
      setSwitchError('');
      setSwitchVisible(true);
    } catch (e) {
      console.log('openSwitchModal error', e);
    }
  };

  const doSwitch = async () => {
    if (!selectedUser) {
      setSwitchError('Choose a user');
      return;
    }
    setSwitchLoading(true);
    try {
      const found = users.find(u => u.username === selectedUser);
      if (!found) {
        setSwitchError('User not found');
        return;
      }
      if (found.pin !== switchPin.trim()) {
        setSwitchError('Incorrect PIN');
        return;
      }
      // successful switch
      setSwitchVisible(false);
      setSwitchPin('');
      setSwitchError('');
      // sign in as the selected user
      signIn({ username: selectedUser });
    } finally {
      setSwitchLoading(false);
    }
  };


  const sortOptions = [
    { type: 'updatedAt', dir: 'desc', label: 'Last Updated (New -> Old)' },
    { type: 'updatedAt', dir: 'asc', label: 'Last Updated (Old -> New)' },
    { type: 'title', dir: 'asc', label: 'Title (A -> Z)' },
    { type: 'title', dir: 'desc', label: 'Title (Z -> A)' },
  ];

  const currentSortLabel = sortOptions.find(o => o.type === sortMode.type && o.dir === sortMode.dir)?.label || 'Sort';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{user.username + "'s Notes"}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={openSwitchModal} style={styles.switchButton}>
            <Text style={styles.switchText}>Switch</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => signOut()} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <TextInput
        placeholder="Search by title or body"
        value={query}
        onChangeText={setQuery}
        style={styles.searchInput}
      />

      {/* Sort Info */}
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort: </Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.sortButton}>
          <Text style={styles.sortText}>{currentSortLabel}</Text>
        </TouchableOpacity>
      </View>

      {/* Notes List */}
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadNotes} />}
        contentContainerStyle={filteredNotes.length ? undefined : styles.emptyList}
        renderItem={({item}) => (
          <NoteCard 
            note={item} 
            onPress={() => navigation.navigate('Editor', { note: item })} 
            onDelete={() => confirmDelete(item)} 
            onView={() => {
              const uris = item.imageUris && item.imageUris.length ? item.imageUris : (item.imageUri ? [item.imageUri] : []);
              if (uris.length) {
                setViewerUris(uris);
                setViewerIndex(0);
                setViewerVisible(true);
              }
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No notes yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to create your first note</Text>
          </View>
        }
      />

      {/* Add Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('Editor')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Sort Options</Text>
            {sortOptions.map((option) => {
              const selected = sortMode.type === option.type && sortMode.dir === option.dir;
              return (
                <TouchableOpacity
                  key={`${option.type}-${option.dir}`}
                  style={[styles.menuItem, selected && styles.menuItemSelected]}
                  onPress={() => {
                    setSortMode({ type: option.type, dir: option.dir });
                    setMenuVisible(false);
                  }}
                >
                  <Text style={[styles.menuItemText, selected && styles.menuItemTextSelected]}>
                    {selected ? '✓ ' : ''}{option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <View style={styles.menuDivider} />
            {/* Logout moved to header actions */}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Switch Account Modal */}
      <Modal
        visible={switchVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSwitchVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSwitchVisible(false)}>
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Switch Account</Text>
            {users && users.length ? (
              users.filter(u => u.username !== user.username).map((u) => (
                <TouchableOpacity
                  key={u.username}
                  style={[styles.menuItem, selectedUser === u.username && styles.menuItemSelected]}
                  onPress={() => { setSelectedUser(u.username); setSwitchError(''); }}
                >
                  <Text style={[styles.menuItemText, selectedUser === u.username && styles.menuItemTextSelected]}>{u.username}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptySubtext}>No other users found.</Text>
            )}

            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setSwitchVisible(false);
                navigation.navigate('Signup');
              }}
            >
              <Text style={[styles.menuItemText, { color: '#007AFF', textAlign: 'center' }]}>Create New Account</Text>
            </TouchableOpacity>

            {selectedUser ? (
              <View style={{ padding: 8 }}>
                <Text style={{ marginBottom: 6 }}>Enter PIN for {selectedUser}</Text>
                <TextInput
                  placeholder="PIN"
                  value={switchPin}
                  onChangeText={setSwitchPin}
                  secureTextEntry
                  keyboardType="number-pad"
                  style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6, marginBottom: 8 }}
                />
                {switchError ? <Text style={{ color: 'red', marginBottom: 8 }}>{switchError}</Text> : null}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity onPress={() => { setSelectedUser(null); setSwitchPin(''); setSwitchError(''); }} style={[styles.menuItem, { flex: 1, marginRight: 6 }]}>
                    <Text style={[styles.menuItemText]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={doSwitch} style={[styles.menuItem, { flex: 1, marginLeft: 6 }]}>
                    <Text style={[styles.menuItemText, { color: '#007AFF', textAlign: 'center' }]}>{switchLoading ? 'Checking...' : 'Confirm'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal visible={viewerVisible} transparent animationType="fade" onRequestClose={() => setViewerVisible(false)}>
        <TouchableOpacity style={styles.viewerOverlay} activeOpacity={1} onPress={() => setViewerVisible(false)}>
          <View style={styles.viewerContainer}>
            {viewerUris && viewerUris.length ? (
              <View style={styles.viewerInner}>
                <Image source={{ uri: viewerUris[viewerIndex] }} style={styles.viewerImage} resizeMode="contain" />
              </View>
            ) : null}
            {viewerUris && viewerUris.length > 1 ? (
              <View style={styles.viewerControls} pointerEvents="box-none">
                <TouchableOpacity onPress={() => setViewerIndex(i => Math.max(0, i - 1))} style={styles.viewerNavBtn}>
                  <Text style={styles.viewerNavText}>{'<'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setViewerIndex(i => Math.min(viewerUris.length - 1, i + 1))} style={styles.viewerNavBtn}>
                  <Text style={styles.viewerNavText}>{'>'}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#007AFF',
    paddingTop: 50,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchButton: {
    marginRight: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  switchText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  logoutButton: {
    marginRight: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.12)'
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  menuButton: { padding: 4 },
  menuDots: { fontSize: 24, color: '#fff', fontWeight: 'bold' },
  searchInput: {
    margin: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  sortLabel: { fontSize: 14, color: '#666' },
  sortButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sortText: { fontSize: 13, color: '#007AFF' },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  emptyContainer: { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#999', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#bbb', textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: { fontSize: 32, color: '#fff', fontWeight: '300' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    width: '80%',
    maxWidth: 300,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 12,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItem: {
    padding: 14,
    borderRadius: 8,
  },
  menuItemSelected: {
    backgroundColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 15,
    color: '#333',
  },
  menuItemTextSelected: {
    fontWeight: '600',
    color: '#007AFF',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  viewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
  viewerControls: {
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
});
