// Labib - mobile v3.1 (warm redesign with a face and a name).
// Onboarding on first launch, then four tabs; Practice is a full-screen flow.
import React, { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, ScrollView, Appearance } from 'react-native';
import * as Updates from 'expo-updates';
import { NavigationContainer, createNavigationContainerRef, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { getConfig } from './src/api';
import { rehydrateReminders } from './src/notifs';
import { colors, scheme } from './src/theme';
import TodayScreen from './src/screens/TodayScreen';
import PracticeScreen from './src/screens/PracticeScreen';
import CoursesScreen from './src/screens/CoursesScreen';
import CourseScreen from './src/screens/CourseScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

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
            The app hit an error - screenshot this
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
const RootStack = createNativeStackNavigator();
const CoursesStack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

const headerStyle = {
  headerStyle: { backgroundColor: colors.bg },
  headerShadowVisible: false,
  headerTitleStyle: { fontWeight: '800', color: colors.ink },
};

function CoursesNavigator() {
  return (
    <CoursesStack.Navigator screenOptions={headerStyle}>
      <CoursesStack.Screen name="CoursesHome" component={CoursesScreen} options={{ title: 'Courses' }} />
      <CoursesStack.Screen name="Course" component={CourseScreen}
        options={({ route }) => ({ title: route.params?.title || 'Course' })} />
    </CoursesStack.Navigator>
  );
}

const TAB_ICONS = { Today: '🏠', Courses: '📚', Progress: '📈', Settings: '⚙️' };

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...headerStyle,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
        tabBarStyle: {
          backgroundColor: colors.card, borderTopWidth: 0, height: 62, paddingBottom: 8, paddingTop: 6,
          shadowColor: '#000', shadowOpacity: scheme === 'dark' ? 0.4 : 0.08,
          shadowRadius: 12, shadowOffset: { width: 0, height: -3 }, elevation: 12,
        },
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{TAB_ICONS[route.name]}</Text>
        ),
      })}
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Courses" component={CoursesNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const navTheme = {
  ...(scheme === 'dark' ? DarkTheme : DefaultTheme),
  colors: {
    ...(scheme === 'dark' ? DarkTheme : DefaultTheme).colors,
    background: colors.bg, card: colors.bg, text: colors.ink, primary: colors.primary,
  },
};

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    (async () => {
      const { url } = await getConfig();
      setInitialRoute(url ? 'Main' : 'Onboarding');
    })();
  }, []);

  // Re-apply the phone's scheduled reminders on launch (self-heals if the OS
  // cleared them after an update), and open a question when one is tapped.
  useEffect(() => {
    rehydrateReminders();
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const data = resp.notification.request.content.data || {};
      if (data.practice && navigationRef.isReady()) {
        navigationRef.navigate('Practice', {});
      }
    });
    return () => sub.remove();
  }, []);

  // The palette is baked into StyleSheets at bundle load (see theme.js), so a
  // mid-session system theme flip needs a JS reload to take effect.
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      const next = colorScheme === 'dark' ? 'dark' : 'light';
      if (next !== scheme) Updates.reloadAsync().catch(() => {});
    });
    return () => sub.remove();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <NavigationContainer ref={navigationRef} theme={navTheme}>
        <RootStack.Navigator initialRouteName={initialRoute} screenOptions={headerStyle}>
          <RootStack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
          <RootStack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <RootStack.Screen name="Practice" component={PracticeScreen}
            options={{ title: 'Practice', presentation: 'modal' }} />
        </RootStack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}
