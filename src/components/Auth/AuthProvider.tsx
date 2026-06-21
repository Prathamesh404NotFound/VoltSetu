import { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider, database } from "@/lib/firebase-services";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { ref, get, update } from "firebase/database";
import { User } from "@/types";
import { Capacitor } from "@capacitor/core";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserRole: (role: User['role']) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data from database when Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user data from database
          const userRef = ref(database, `users/${firebaseUser.uid}`);
          const snapshot = await get(userRef);

          if (snapshot.exists()) {
            const userData = snapshot.val();
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || userData.displayName || '',
              photoURL: firebaseUser.photoURL || userData.photoURL,
              phone: userData.phone || firebaseUser.phoneNumber,
              role: userData.role || 'user',
              isVerified: userData.isVerified || false,
              createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
              lastLoginAt: new Date(),
              preferences: userData.preferences || {
                theme: 'light' as const,
                notifications: {
                  email: true,
                  push: true,
                  sms: false,
                  newSpots: true,
                  requestUpdates: true,
                  promotions: false,
                },
                location: {
                  enabled: false,
                },
              },
              stats: userData.stats || {
                watts: 0,
                level: 1,
                requestsCompleted: 0,
                reviewsGiven: 0,
                favoritesCount: 0,
                referralCount: 0,
                joinDate: new Date(),
              },
            });
          } else {
            // Create user in database if doesn't exist
            const newUserData = {
              displayName: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
              phone: firebaseUser.phoneNumber || '',
              role: 'user' as const,
              isVerified: false,
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              preferences: {
                theme: 'light' as const,
                notifications: {
                  email: true,
                  push: true,
                  sms: false,
                  newSpots: true,
                  requestUpdates: true,
                  promotions: false,
                },
                location: {
                  enabled: false,
                },
              },
              stats: {
                watts: 0,
                level: 1,
                requestsCompleted: 0,
                reviewsGiven: 0,
                favoritesCount: 0,
                referralCount: 0,
                joinDate: new Date(),
              },
            };

            await update(userRef, newUserData);
            setUser({
              id: firebaseUser.uid,
              ...newUserData,
              createdAt: new Date(newUserData.createdAt),
              lastLoginAt: new Date(newUserData.lastLoginAt),
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to basic user data
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            phone: firebaseUser.phoneNumber || '',
            role: 'user',
            isVerified: false,
            createdAt: new Date(),
            lastLoginAt: new Date(),
            preferences: {
              theme: 'light',
              notifications: {
                email: true,
                push: true,
                sms: false,
                newSpots: true,
                requestUpdates: true,
                promotions: false,
              },
              location: {
                enabled: false,
              },
            },
            stats: {
              watts: 0,
              level: 1,
              requestsCompleted: 0,
              reviewsGiven: 0,
              favoritesCount: 0,
              referralCount: 0,
              joinDate: new Date(),
            },
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await FirebaseAuthentication.signInWithGoogle();
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (error: any) {
      console.error("Sign-in error:", error);
      throw new Error(error.message || "Google sign-in failed. Please try again.");
    }
  };

  const logout = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await FirebaseAuthentication.signOut();
      }
      await signOut(auth);
    } catch (error) {
      throw new Error("Logout failed.");
    }
  };

  const updateUserRole = async (role: User['role']) => {
    if (!user) {
      throw new Error("User not logged in");
    }

    try {
      const userRef = ref(database, `users/${user.id}`);
      await update(userRef, { role });

      setUser(prev => prev ? { ...prev, role } : null);
    } catch (error) {
      throw new Error("Failed to update user role");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, updateUserRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
