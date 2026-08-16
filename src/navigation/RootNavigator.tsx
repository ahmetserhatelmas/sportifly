import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { AuthStackParamList, MainTabParamList, RootStackParamList } from './types';

import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { CommentsScreen } from '../screens/home/CommentsScreen';
import { CreatePostScreen } from '../screens/home/CreatePostScreen';
import { FeedScreen } from '../screens/home/FeedScreen';
import { PostDetailScreen } from '../screens/home/PostDetailScreen';
import { SharePostScreen } from '../screens/home/SharePostScreen';
import { DirectChatScreen } from '../screens/messages/DirectChatScreen';
import { MessagesScreen } from '../screens/messages/MessagesScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { FollowsScreen } from '../screens/profile/FollowsScreen';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';
import { LegalScreen } from '../screens/profile/LegalScreen';
import { MyListingsScreen } from '../screens/profile/MyListingsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { PurchasesScreen } from '../screens/profile/PurchasesScreen';
import { AdminRoleRequestsScreen } from '../screens/admin/AdminRoleRequestsScreen';
import { RoleRequestFormScreen } from '../screens/profile/RoleRequestFormScreen';
import { RoleRequestScreen } from '../screens/profile/RoleRequestScreen';
import { SupportScreen } from '../screens/profile/SupportScreen';
import { CreateDuelScreen } from '../screens/search/CreateDuelScreen';
import { DuelChatScreen } from '../screens/search/DuelChatScreen';
import { DuelDetailScreen } from '../screens/search/DuelDetailScreen';
import { SearchScreen } from '../screens/search/SearchScreen';
import { CreateListingScreen } from '../screens/store/CreateListingScreen';
import { ListingDetailScreen } from '../screens/store/ListingDetailScreen';
import { StoreScreen } from '../screens/store/StoreScreen';
import { TournamentsScreen } from '../screens/tournaments/TournamentsScreen';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  AnaSayfa: 'home',
  Magaza: 'storefront',
  Arama: 'search',
  Turnuvalar: 'trophy',
  Profil: 'person',
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, focused, size }) => {
          const base = TAB_ICONS[route.name];
          return (
            <Ionicons
              name={focused ? base : (`${String(base)}-outline` as typeof base)}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="AnaSayfa" component={FeedScreen} options={{ title: 'Ana Sayfa' }} />
      <Tab.Screen name="Magaza" component={StoreScreen} options={{ title: 'Mağaza' }} />
      <Tab.Screen name="Arama" component={SearchScreen} options={{ title: 'Arama' }} />
      <Tab.Screen name="Turnuvalar" component={TournamentsScreen} options={{ title: 'Turnuvalar' }} />
      <Tab.Screen name="Profil" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}

function AuthFlow() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

export function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? (
        <RootStack.Navigator
          screenOptions={{
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '700' },
            headerBackTitle: 'Geri',
          }}
        >
          <RootStack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <RootStack.Screen
            name="CreateDuel"
            component={CreateDuelScreen}
            options={{ presentation: 'modal', headerShown: false }}
          />
          <RootStack.Screen
            name="DuelDetail"
            component={DuelDetailScreen}
            options={{ title: 'Düello Detayı' }}
          />
          <RootStack.Screen
            name="DuelChat"
            component={DuelChatScreen}
            options={({ route }) => ({ title: route.params.title })}
          />
          <RootStack.Screen
            name="CreatePost"
            component={CreatePostScreen}
            options={{ title: 'Yeni Gönderi', presentation: 'modal' }}
          />
          <RootStack.Screen
            name="PostDetail"
            component={PostDetailScreen}
            options={{ title: 'Gönderi' }}
          />
          <RootStack.Screen
            name="SharePost"
            component={SharePostScreen}
            options={{ title: 'Arkadaşına gönder', presentation: 'modal' }}
          />
          <RootStack.Screen name="Comments" component={CommentsScreen} options={{ title: 'Yorumlar' }} />
          <RootStack.Screen
            name="CreateListing"
            component={CreateListingScreen}
            options={({ route }) => ({
              title: route.params.type === 'field' ? 'Yeni Saha İlanı' : 'Yeni Ders İlanı',
              presentation: 'modal',
            })}
          />
          <RootStack.Screen
            name="ListingDetail"
            component={ListingDetailScreen}
            options={{ title: 'İlan Detayı' }}
          />
          <RootStack.Screen
            name="RoleRequest"
            component={RoleRequestScreen}
            options={{ title: 'Saha / Eğitmen Başvurusu' }}
          />
          <RootStack.Screen
            name="RoleRequestForm"
            component={RoleRequestFormScreen}
            options={({ route }) => ({
              title:
                route.params.role === 'field_owner'
                  ? 'Saha Sahibi Başvurusu'
                  : 'Eğitmen Başvurusu',
            })}
          />
          <RootStack.Screen
            name="AdminRoleRequests"
            component={AdminRoleRequestsScreen}
            options={{ title: 'Başvuru Yönetimi' }}
          />
          <RootStack.Screen name="Messages" component={MessagesScreen} options={{ title: 'Mesajlar' }} />
          <RootStack.Screen
            name="DirectChat"
            component={DirectChatScreen}
            options={({ route }) => ({ title: route.params.username })}
          />
          <RootStack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ title: 'Profili Düzenle' }}
          />
          <RootStack.Screen
            name="UserProfile"
            component={UserProfileScreen}
            options={{ title: 'Profil' }}
          />
          <RootStack.Screen
            name="Follows"
            component={FollowsScreen}
            options={{ title: 'Takip' }}
          />
          <RootStack.Screen
            name="MyListings"
            component={MyListingsScreen}
            options={{ title: 'İlanlarım' }}
          />
          <RootStack.Screen
            name="Purchases"
            component={PurchasesScreen}
            options={{ title: 'Satın Alınanlar' }}
          />
          <RootStack.Screen name="Support" component={SupportScreen} options={{ title: 'Destek Ekibi' }} />
          <RootStack.Screen
            name="Legal"
            component={LegalScreen}
            options={({ route }) => ({ title: route.params.title })}
          />
        </RootStack.Navigator>
      ) : (
        <AuthFlow />
      )}
    </NavigationContainer>
  );
}
