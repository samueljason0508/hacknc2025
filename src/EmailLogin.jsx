import { useState } from 'react'
import { supabase } from './lib/supabaseClient'

export default function EmailLogin() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) setMessage(`Error: ${error.message}`)
    else setMessage('Check your email for the login link!')
  }

  return (
    <div className="email-login">
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={handleLogin}>Send Magic Link</button>
      {message && <p>{message}</p>}
    </div>
  )
}
