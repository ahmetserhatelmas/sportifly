import { NavigatorScreenParams } from '@react-navigation/native';
import { ListingType, RoleRequestRole } from '../types';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  AnaSayfa: undefined;
  Magaza: undefined;
  Arama: undefined;
  Turnuvalar: undefined;
  Profil: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList>;
  CreateDuel: undefined;
  DuelDetail: { duelId: string };
  DuelChat: { duelId: string; title: string };
  CreatePost: undefined;
  PostDetail: { postId: string };
  SharePost: { postId: string };
  Comments: { postId: string };
  CreateListing: { type: ListingType };
  ListingDetail: { listingId: string };
  Messages: undefined;
  DirectChat: { userId: string; username: string };
  EditProfile: undefined;
  UserProfile: { userId: string };
  Follows: { userId: string; initialTab?: 'followers' | 'following' };
  MyListings: undefined;
  Purchases: undefined;
  Support: undefined;
  RoleRequest: undefined;
  RoleRequestForm: { role: RoleRequestRole };
  AdminRoleRequests: undefined;
  Legal: { title: string };
};
