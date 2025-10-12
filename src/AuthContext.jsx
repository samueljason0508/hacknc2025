import { useState, useEffect, useContext, createContext } from 'react'
import { supabase } from './lib/supabaseClient' // Uses your client setup

const AuthContext = createContext({ user: null, loading: true, signOut: () => {} })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 2. Listener for auth state changes (login, logout, magic link click)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe() // Cleanup
  }, [])

  const value = {
    user,
    loading,
    signOut: () => supabase.auth.signOut(), 
  }

  // Render children only when the initial check is complete
  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}

export const useAuth = () => {
  return useContext(AuthContext)
}