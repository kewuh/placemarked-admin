<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { supabase } from '$lib/clients/supabaseClient';
  import bcrypt from 'bcryptjs';
  
  let isAuthenticated = false;
  let username = '';
  let password = '';
  let error = '';
  let loginAttempts = 0;
  let isLocked = false;
  let lockoutTime: number = 0;
  
  // Production security settings
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours
  
  onMount(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    // Check if already authenticated (stored in sessionStorage)
    const auth = sessionStorage.getItem('admin_authenticated');
    const loginTime = sessionStorage.getItem('admin_login_time');
    
    if (auth === 'true' && loginTime) {
      const timeSinceLogin = Date.now() - parseInt(loginTime);
      if (timeSinceLogin < SESSION_TIMEOUT) {
        isAuthenticated = true;
      } else {
        // Session expired
        handleLogout();
      }
    }
    
    // Check for lockout
    const lockoutUntil = sessionStorage.getItem('admin_lockout_until');
    if (lockoutUntil) {
      const currentLockoutTime = parseInt(lockoutUntil);
      if (Date.now() < currentLockoutTime) {
        isLocked = true;
        lockoutTime = currentLockoutTime;
      } else {
        // Lockout expired
        sessionStorage.removeItem('admin_lockout_until');
        sessionStorage.removeItem('admin_login_attempts');
      }
    }
    
    // Get stored login attempts
    const attempts = sessionStorage.getItem('admin_login_attempts');
    if (attempts) {
      loginAttempts = parseInt(attempts);
    }
  });
  
  async function handleLogin() {
    if (isLocked) {
      const remainingTime = Math.ceil((lockoutTime - Date.now()) / 1000 / 60);
      error = `Account locked. Try again in ${remainingTime} minutes.`;
      return;
    }
    
    if (!username.trim() || !password.trim()) {
      error = 'Please enter both username and password';
      return;
    }
    
    try {
      // Check against moderators table
      const { data, error: loginError } = await supabase
        .from('moderators')
        .select('id, username, password')
        .eq('username', username.trim())
        .single();
      
      if (loginError || !data) {
        handleFailedLogin();
        error = 'Invalid username or password';
        return;
      }
      
      // Check password using bcrypt
      const passwordMatch = await bcrypt.compare(password.trim(), data.password || '');
      if (passwordMatch) {
        // Successful login
        isAuthenticated = true;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('admin_authenticated', 'true');
          sessionStorage.setItem('admin_username', data.username || '');
          sessionStorage.setItem('admin_login_time', Date.now().toString());
          
          // Reset login attempts
          sessionStorage.removeItem('admin_login_attempts');
          sessionStorage.removeItem('admin_lockout_until');
        }
        loginAttempts = 0;
        isLocked = false;
        
        error = '';
      } else {
        handleFailedLogin();
        error = 'Invalid username or password';
      }
    } catch (err) {
      handleFailedLogin();
      error = 'Login failed. Please try again.';
    }
  }
  
  function handleFailedLogin() {
    loginAttempts++;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('admin_login_attempts', loginAttempts.toString());
    }
    
    if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      isLocked = true;
      lockoutTime = Date.now() + LOCKOUT_DURATION;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('admin_lockout_until', lockoutTime.toString());
      }
      error = `Too many failed attempts. Account locked for 15 minutes.`;
    }
  }
  
  function handleLogout() {
    isAuthenticated = false;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('admin_authenticated');
      sessionStorage.removeItem('admin_username');
      sessionStorage.removeItem('admin_login_time');
    }
    username = '';
    password = '';
  }
  
  // Auto-logout on inactivity
  let inactivityTimer: ReturnType<typeof setTimeout>;
  
  function resetInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (isAuthenticated) {
      inactivityTimer = setTimeout(() => {
        handleLogout();
      }, 30 * 60 * 1000); // 30 minutes of inactivity
    }
  }
  
  // Reset timer on user activity
  function handleUserActivity() {
    resetInactivityTimer();
  }
  
  // Set up activity listeners (only in browser)
  $: if (isAuthenticated && typeof document !== 'undefined') {
    resetInactivityTimer();
    document.addEventListener('mousemove', handleUserActivity);
    document.addEventListener('keypress', handleUserActivity);
    document.addEventListener('click', handleUserActivity);
  } else if (typeof document !== 'undefined') {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    document.removeEventListener('mousemove', handleUserActivity);
    document.removeEventListener('keypress', handleUserActivity);
    document.removeEventListener('click', handleUserActivity);
  }
</script>

{#if isAuthenticated}
  <div class="admin-layout">
    <div class="admin-header">
      <div class="admin-header-content">
        <h1>UK Queering Map - Admin</h1>
        <div class="admin-nav">
          <a href="/">View Map</a>
          <button on:click={handleLogout}>Logout</button>
        </div>
      </div>
    </div>
    <slot />
  </div>
{:else}
  <div class="login-container">
    <div class="login-form">
      <div class="login-header">
        <h2>Admin Access</h2>
        <p>Enter the admin password to continue</p>
      </div>
      <form on:submit|preventDefault={handleLogin}>
        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            bind:value={username}
            type="text"
            required
            placeholder="Enter username"
          />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            bind:value={password}
            type="password"
            required
            placeholder="Enter password"
          />
        </div>
        
        {#if error}
          <div class="error-message">
            {error}
          </div>
        {/if}
        
        <button type="submit">Sign in</button>
      </form>
      
      <div class="login-footer">
        <a href="/">← Back to Map</a>
      </div>
    </div>
  </div>
{/if}

<style>
  .admin-layout {
    min-height: 100vh;
    background-color: #f5f5f5;
  }

  .admin-header {
    background: white;
    border-bottom: 1px solid #eee;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .admin-header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 15px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .admin-header-content h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #333;
  }

  .admin-nav {
    display: flex;
    gap: 15px;
    align-items: center;
  }

  .admin-nav a {
    color: #0066cc;
    text-decoration: none;
    font-size: 14px;
  }

  .admin-nav a:hover {
    text-decoration: underline;
  }

  .admin-nav button {
    background: none;
    border: none;
    color: #dc3545;
    cursor: pointer;
    font-size: 14px;
    padding: 0;
  }

  .admin-nav button:hover {
    text-decoration: underline;
  }

  .login-container {
    min-height: 100vh;
    background-color: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .login-form {
    background: white;
    padding: 40px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    width: 100%;
    max-width: 400px;
  }

  .login-header {
    text-align: center;
    margin-bottom: 30px;
  }

  .login-header h2 {
    margin: 0 0 10px 0;
    font-size: 28px;
    font-weight: bold;
    color: #333;
  }

  .login-header p {
    margin: 0;
    color: #666;
    font-size: 14px;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #333;
  }

  .form-group input {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    box-sizing: border-box;
  }

  .form-group input:focus {
    outline: none;
    border-color: #0066cc;
    box-shadow: 0 0 0 2px rgba(0,102,204,0.2);
  }

  .error-message {
    color: #dc3545;
    font-size: 14px;
    text-align: center;
    margin-bottom: 20px;
  }

  .login-form button {
    width: 100%;
    padding: 12px;
    background-color: #0066cc;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
  }

  .login-form button:hover {
    background-color: #0052a3;
  }

  .login-footer {
    text-align: center;
    margin-top: 20px;
  }

  .login-footer a {
    color: #0066cc;
    text-decoration: none;
    font-size: 14px;
  }

  .login-footer a:hover {
    text-decoration: underline;
  }
</style>
