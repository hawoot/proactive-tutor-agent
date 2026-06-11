// Proactive Tutor - mobile v2.
// Four tabs: Today (practice) / Library (content management) / Progress / Settings.
import React from 'react';
import { Text, ScrollView } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from './src/theme';
import TodayScreen from './src/screens/TodayScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import ProgramScreen from './src/screens/ProgramScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Release builds have no red error box - without this, a render crash is an
// unreadable blank screen. This shows the actual error so it can be reported.
class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 24, paddingTop: 64 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#b00020' }}>
            The app hit an error
          </Text>
          <Text selectable style={{ marginTop: 12, color: '#333' }}>
            {String(this.state.error?.message || this.state.error)}
          </Text>
          <Text selectable style={{ marginTop: 12, fontSize: 11, color: '#777' }}>
            {String(this.state.error?.stack || '')}
          </Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const Tab = createBottomTabNavigator();
const LibraryStack = createNativeStackNavigator();

function LibraryNavigator() {
  return (
    <LibraryStack.Navigator
      screenOptions={{ headerStyle: { backgroundColor: colors.bg }, headerShadowVisible: false }}
    >
      <LibraryStack.Screen name="LibraryHome" component={LibraryScreen} options={{ title: 'Library' }} />
      <LibraryStack.Screen
        name="Program" component={ProgramScreen}
        options={({ route }) => ({ title: route.params?.title || 'Program' })}
      />
    </LibraryStack.Navigator>
  );
}

const ICONS = { Today: '✏️', Library: '📚', Progress: '📈', Settings: '⚙️' };

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.bg, text: colors.ink },
};

export default function App() {
  return (
    <NavigationContainer theme={theme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          tabBarActiveTintColor: colors.ink,
          tabBarInactiveTintColor: '#999',
          tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.line },
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>{ICONS[route.name]}</Text>,
        })}
      >
        <Tab.Screen name="Today" component={TodayScreen} />
        <Tab.Screen name="Library" component={LibraryNavigator} options={{ headerShown: false }} />
        <Tab.Screen name="Progress" component={ProgressScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
