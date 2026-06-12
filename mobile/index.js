// Custom entry: install a global error trap BEFORE the app's modules load,
// so ANY failure - module evaluation, native bridge, render - shows readable
// text instead of a crash or a blank screen. App.js's ErrorBoundary covers
// render errors; this covers everything earlier and everything fatal.
import 'react-native-gesture-handler';  // must be first for gesture support
import React from 'react';
import { registerRootComponent } from 'expo';
import { ScrollView, Text } from 'react-native';

let App = null;
let bootError = null;
try {
  App = require('./App').default;
} catch (e) {
  bootError = e;
}

function ErrorScreen({ error }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ padding: 24, paddingTop: 64 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#b00020' }}>
        The app hit an error - screenshot this
      </Text>
      <Text selectable style={{ marginTop: 12, color: '#333' }}>
        {String((error && error.message) || error)}
      </Text>
      <Text selectable style={{ marginTop: 12, fontSize: 11, color: '#777' }}>
        {String((error && error.stack) || '')}
      </Text>
    </ScrollView>
  );
}

function Root() {
  const [err, setErr] = React.useState(bootError);
  React.useEffect(() => {
    if (global.ErrorUtils && global.ErrorUtils.setGlobalHandler) {
      // Swallow instead of crashing: keep the screen alive to display the error.
      global.ErrorUtils.setGlobalHandler((e) => setErr(e));
    }
  }, []);
  if (err) return <ErrorScreen error={err} />;
  if (!App) return <ErrorScreen error={new Error('App failed to load (no export)')} />;
  return <App />;
}

registerRootComponent(Root);
