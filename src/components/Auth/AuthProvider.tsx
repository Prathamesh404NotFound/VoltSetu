import { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider, database } from "@/lib/firebase-services";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = "chargepush_cached_user";

function loadCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      createdAt: parsed.createdAt ? new Date(parsed.createdAt) : new Date(),
      lastLoginAt: parsed.lastLoginAt ? new Date(parsed.lastLoginAt) : new Date(),
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(loadCachedUser);
  const [loading, setLoading] = useState(!loadCachedUser());

  const saveUserToCache = (userData: User | null) => {
    setUser(userData);
    if (userData) {
      try {
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(userData));
      } catch (err) {
        console.warn("Failed to cache user profile in localStorage:", err);
      }
    } else {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    }
  };

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
            saveUserToCache({
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
            saveUserToCache({
              id: firebaseUser.uid,
              ...newUserData,
              createdAt: new Date(newUserData.createdAt),
              lastLoginAt: new Date(newUserData.lastLoginAt),
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to basic user data
          saveUserToCache({
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
        saveUserToCache(null);
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

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || password.length < 6) {
      throw new Error("Enter a valid email and a password with at least 6 characters.");
    }
    try {
      await signInWithEmailAndPassword(auth, normalizedEmail, password);
    } catch (error: any) {
      throw new Error(error?.code === "auth/invalid-credential" ? "Email or password is incorrect." : error?.message || "Sign-in failed. Please try again.");
    }
  };

  const signup = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || password.length < 6) {
      throw new Error("Enter a valid email and a password with at least 6 characters.");
    }
    try {
      await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    } catch (error: any) {
      throw new Error(error?.code === "auth/email-already-in-use" ? "An account with this email already exists." : error?.message || "Account creation failed. Please try again.");
    }
  };

  const logout = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await FirebaseAuthentication.signOut();
      }
      await signOut(auth);
      saveUserToCache(null);
    } catch (error) {
      throw new Error("Logout failed.");
    }
  };


  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, login, signup, logout }}>
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
