import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';

// Import your screens
import Login from './Component/Login';
import Barberprofile from './Component/Barberprofile';
import Home from './Component/Home';
import Barberdashboard from './Component/Dashboard/Barberdashboard';
import Onlinebooking from './Component/Dashboard/Onlinebooking';
import TermsAndConditions from './Component/Dashboard/Term';
import History from './Component/Dashboard/History';
import { AuthProvider } from './Component/firebaseauth';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <AuthProvider>
    <Stack.Navigator
      initialRouteName="Home" // Set your initial route here
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: ({ current }) => ({
          cardStyle: {
            opacity: current.progress.interpolate({
              inputRange: [0, 0.5],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            }),
          },
        }),
        gestureEnabled: false,
        gestureDirection: 'horizontal',
      }}
    >
      {/* List all your screens here */}
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Dashboard" component={Barberdashboard} />
      <Stack.Screen name="Profile" component={Barberprofile} />
      <Stack.Screen name="Term" component={TermsAndConditions} />
      <Stack.Screen name="History" component={History} />
      <Stack.Screen name="Online" component={Onlinebooking} />
    </Stack.Navigator>
    </AuthProvider>
  );
};

const App = () => {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <AppNavigator />
    </NavigationContainer>
  );
};

export default App;
