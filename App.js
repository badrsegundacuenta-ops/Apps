import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform,
  SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { supabase, isSupabaseConfigured } from './src/lib/supabase';

const PURPLE = '#A879FF';
const BG = '#100D19';
const PANEL = '#211B2B';
const MUTED = '#B9A8D8';

function PrimaryButton({ title, onPress, secondary = false, disabled = false }) {
  return <TouchableOpacity disabled={disabled} onPress={onPress}
    style={[styles.button, secondary && styles.secondaryButton, disabled && { opacity: 0.5 }]}>
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [draft, setDraft] = useState('');
  const [tab, setTab] = useState('tasks');

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) loadTasks();
    else setTasks([]);
  }, [session?.user?.id]);

  async function loadTasks() {
    const { data, error } = await supabase.from('tasks')
      .select('id,title,completed,created_at')
      .order('created_at', { ascending: false });
    if (error) Alert.alert('No se pudieron cargar las tareas', error.message);
    else setTasks(data || []);
  }

  async function authenticate() {
    if (!email.trim() || password.length < 6) {
      Alert.alert('Revisa tus datos', 'Escribe un correo válido y una contraseña de al menos 6 caracteres.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { data: { display_name: name.trim() } }
        });
        if (error) throw error;
        if (!data.session) Alert.alert('Revisa tu correo', 'Te hemos enviado un enlace para confirmar la cuenta.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (e) { Alert.alert('No se pudo continuar', e.message); }
    finally { setBusy(false); }
  }

  async function addTask() {
    const title = draft.trim();
    if (!title) return;
    const { data, error } = await supabase.from('tasks')
      .insert({ title, user_id: session.user.id })
      .select('id,title,completed,created_at').single();
    if (error) Alert.alert('Error', error.message);
    else { setTasks(current => [data, ...current]); setDraft(''); }
  }

  async function toggleTask(task) {
    const { error } = await supabase.from('tasks')
      .update({ completed: !task.completed }).eq('id', task.id);
    if (error) Alert.alert('Error', error.message);
    else setTasks(current => current.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
  }

  async function deleteTask(id) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) Alert.alert('Error', error.message);
    else setTasks(current => current.filter(t => t.id !== id));
  }

  if (loading) return <Screen><ActivityIndicator color={PURPLE} size="large" /></Screen>;

  if (!isSupabaseConfigured) return <Screen>
    <Brand />
    <Text style={styles.heading}>Conecta tu base de datos</Text>
    <Text style={styles.muted}>Copia .env.example a .env y añade la URL y la clave pública de tu proyecto Supabase. Consulta README.md para configurarlo.</Text>
  </Screen>;

  if (!session) return <Screen>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
      <Brand />
      <Text style={styles.heading}>{mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}</Text>
      <Text style={styles.muted}>Organiza. Completa. Sube de nivel.</Text>
      {mode === 'signup' && <TextInput value={name} onChangeText={setName} placeholder="Tu nombre (opcional)" placeholderTextColor="#8E7D9F" style={styles.input} />}
      <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Correo electrónico" placeholderTextColor="#8E7D9F" style={styles.input} />
      <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Contraseña (mínimo 6 caracteres)" placeholderTextColor="#8E7D9F" style={styles.input} />
      <PrimaryButton title={busy ? 'Un momento…' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'} onPress={authenticate} disabled={busy} />
      <PrimaryButton secondary title={mode === 'login' ? 'No tengo cuenta · Registrarme' : 'Ya tengo cuenta · Iniciar sesión'} onPress={() => setMode(mode === 'login' ? 'signup' : 'login')} />
    </KeyboardAvoidingView>
  </Screen>;

  const completed = tasks.filter(t => t.completed).length;
  const points = completed * 50;
  const level = Math.floor(points / 200) + 1;

  return <Screen>
    <View style={styles.topRow}>
      <Brand compact />
      <TouchableOpacity onPress={() => supabase.auth.signOut()}><Text style={styles.link}>Cerrar sesión</Text></TouchableOpacity>
    </View>
    <View style={styles.hero}>
      <Text style={styles.kicker}>TU PROGRESO</Text>
      <Text style={styles.heroTitle}>¡Vas genial! ✨</Text>
      <View style={styles.statsRow}>
        <View><Text style={styles.stat}>{points}</Text><Text style={styles.muted}>Puntos</Text></View>
        <View><Text style={styles.stat}>Nivel {level}</Text><Text style={styles.muted}>{completed}/{tasks.length} tareas</Text></View>
      </View>
      <View style={styles.progress}><View style={[styles.progressFill, { width: `${(points % 200) / 2}%` }]} /></View>
      <Text style={styles.muted}>{200 - (points % 200)} puntos para el siguiente nivel</Text>
    </View>
    <View style={styles.tabs}>
      <TouchableOpacity onPress={() => setTab('tasks')}><Text style={[styles.tab, tab === 'tasks' && styles.activeTab]}>Mis tareas</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => setTab('achievements')}><Text style={[styles.tab, tab === 'achievements' && styles.activeTab]}>Logros</Text></TouchableOpacity>
    </View>
    {tab === 'tasks' ? <>
      <View style={styles.addRow}>
        <TextInput value={draft} onChangeText={setDraft} placeholder="Añade una tarea…" placeholderTextColor="#8E7D9F" style={[styles.input, { flex: 1, marginBottom: 0 }]} />
        <TouchableOpacity onPress={addTask} style={styles.addButton}><Text style={styles.addText}>+</Text></TouchableOpacity>
      </View>
      <FlatList data={tasks} keyExtractor={item => String(item.id)}
        ListEmptyComponent={<Text style={styles.muted}>Todavía no tienes tareas. ¡Añade la primera!</Text>}
        renderItem={({ item }) => <View style={styles.task}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => toggleTask(item)}>
            <Text style={[styles.taskTitle, item.completed && styles.done]}>{item.completed ? '✓  ' : '○  '}{item.title}</Text>
            <Text style={styles.muted}>{item.completed ? 'Completada · +50 XP' : 'Toca para completar · 50 XP'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteTask(item.id)}><Text style={styles.delete}>Eliminar</Text></TouchableOpacity>
        </View>} />
    </> : <View style={styles.hero}>
      <Text style={styles.heroTitle}>🏆 Tus logros</Text>
      <Text style={styles.taskTitle}>{completed >= 1 ? '✓ Primeros pasos desbloqueado' : '○ Primeros pasos · Completa una tarea'}</Text>
      <Text style={styles.taskTitle}>{completed >= 5 ? '✓ Máquina de tareas desbloqueado' : '○ Máquina de tareas · Completa 5 tareas'}</Text>
      <Text style={styles.taskTitle}>{level >= 2 ? '✓ Nivel 2 desbloqueado' : '○ Nivel 2 · Consigue 200 puntos'}</Text>
    </View>}
    <Text style={styles.footer}>PLANIFY · Tu progreso, a tu manera.</Text>
  </Screen>;
}

function Brand({ compact = false }) {
  return <View style={styles.brand}>
    <View style={styles.logo}><Text style={styles.logoText}>ϟ</Text></View>
    <View><Text style={styles.brandName}>PLANIFY</Text>{!compact && <Text style={styles.kicker}>YOUR LIFE. YOUR LEVEL.</Text>}</View>
  </View>;
}
function Screen({ children }) {
  return <SafeAreaView style={styles.screen}><ExpoStatusBar style="light" /><StatusBar barStyle="light-content" />{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG, paddingHorizontal: 20, paddingTop: 24 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 },
  logo: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#7544D9', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: 'white', fontSize: 29, fontWeight: '900' },
  brandName: { color: 'white', fontSize: 22, fontWeight: '900', letterSpacing: 1.4 },
  kicker: { color: MUTED, fontSize: 11, letterSpacing: 1.2, marginBottom: 6 },
  heading: { color: 'white', fontSize: 27, fontWeight: '800', marginBottom: 8 },
  muted: { color: MUTED, fontSize: 13, lineHeight: 20 },
  input: { backgroundColor: PANEL, color: 'white', borderRadius: 13, padding: 15, marginTop: 18, marginBottom: 12, borderWidth: 1, borderColor: '#49385C' },
  button: { backgroundColor: '#7544D9', borderRadius: 13, padding: 16, alignItems: 'center', marginTop: 12 },
  secondaryButton: { backgroundColor: PANEL, borderWidth: 1, borderColor: '#49385C' },
  buttonText: { color: 'white', fontWeight: '800' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { color: '#C5A3FF', fontWeight: '700' },
  hero: { backgroundColor: '#211833', padding: 20, borderRadius: 22, marginBottom: 20 },
  heroTitle: { color: 'white', fontSize: 25, fontWeight: '800', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  stat: { color: '#C5A3FF', fontSize: 25, fontWeight: '900' },
  progress: { height: 8, backgroundColor: '#49385C', borderRadius: 9, overflow: 'hidden', marginBottom: 9 },
  progressFill: { height: 8, backgroundColor: PURPLE, borderRadius: 9 },
  tabs: { flexDirection: 'row', gap: 24, marginBottom: 14 },
  tab: { color: '#9B8BAA', fontWeight: '700', fontSize: 16, paddingBottom: 8 },
  activeTab: { color: '#C5A3FF', borderBottomWidth: 2, borderBottomColor: PURPLE },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 },
  addButton: { backgroundColor: '#7544D9', borderRadius: 13, width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  addText: { color: 'white', fontSize: 28, fontWeight: '700' },
  task: { flexDirection: 'row', alignItems: 'center', backgroundColor: PANEL, borderRadius: 14, padding: 15, marginBottom: 10, gap: 8 },
  taskTitle: { color: 'white', fontSize: 15, fontWeight: '700', marginBottom: 5 },
  done: { color: '#9B8EAA', textDecorationLine: 'line-through' },
  delete: { color: '#D49BFF', fontSize: 12, fontWeight: '700' },
  footer: { color: '#877991', textAlign: 'center', fontSize: 11, paddingVertical: 15 }
});