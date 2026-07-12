import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Track current user to prevent unmounting app on tab switch
  const userIdRef = useRef(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        userIdRef.current = session.user.id;
        setLoading(true);
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        if (userIdRef.current !== session.user.id) {
          // New user or fresh login
          userIdRef.current = session.user.id;
          setLoading(true);
          fetchProfile(session.user.id);
        } else {
          // Same user, e.g. returning to tab (event === 'SIGNED_IN' or 'TOKEN_REFRESHED')
          // We can refresh the profile in the background without unmounting the app
          if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
            fetchProfile(session.user.id);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        userIdRef.current = null;
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (usernameOrEmail, password) => {
    // If no '@', treat as username → construct fake email
    const email = usernameOrEmail.includes('@')
      ? usernameOrEmail
      : `${usernameOrEmail.toLowerCase()}@ic3fighter.local`;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    profile,
    loading,
    login,
    logout,
    isStudent:      profile?.role === 'student',
    isTeacher:      profile?.role === 'teacher',
    isAdminCreated: profile?.account_source === 'ADMIN' || profile?.role === 'teacher',
    isSelfRegistered: profile?.account_source === 'SELF',
    accountSource:  profile?.account_source ?? 'ADMIN',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components -- hook is intentionally co-located with AuthProvider
export const useAuth = () => {
  return useContext(AuthContext);
};
