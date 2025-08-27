<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/clients/supabaseClient';
  import type { Database } from '$lib/clients/database.types';
  import bcrypt from 'bcryptjs';
  
  type Moderator = Database['public']['Tables']['moderators']['Row'];
  
  let moderators: Moderator[] = [];
  let loading = true;
  let error = '';
  let newUsername = '';
  let newPassword = '';
  let editingModerator: Moderator | null = null;
  let editingUsername = '';
  let editingPassword = '';
  
  onMount(async () => {
    await loadModerators();
  });
  
  async function loadModerators() {
    try {
      loading = true;
      console.log('Loading moderators...');
      
      const { data, error: fetchError } = await supabase
        .from('moderators')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('Load response:', { data, error: fetchError });
      
      if (fetchError) throw fetchError;
      moderators = data || [];
    } catch (err) {
      console.error('Error loading moderators:', err);
      error = err instanceof Error ? err.message : 'Failed to load moderators';
    } finally {
      loading = false;
    }
  }
  
  async function addModerator() {
    if (!newUsername.trim()) {
      error = 'Username cannot be empty';
      return;
    }
    
    if (!newPassword.trim()) {
      error = 'Password cannot be empty';
      return;
    }
    
    try {
      console.log('Adding moderator:', newUsername.trim());
      
      // Hash the password securely using bcrypt
      const saltRounds = 12; // Higher number = more secure but slower
      const hashedPassword = await bcrypt.hash(newPassword.trim(), saltRounds);
      
      const { data, error: insertError } = await supabase
        .from('moderators')
        .insert([{ 
          username: newUsername.trim(),
          password: hashedPassword
        }])
        .select();
      
      console.log('Insert response:', { data, error: insertError });
      
      if (insertError) throw insertError;
      
      newUsername = '';
      newPassword = '';
      await loadModerators();
    } catch (err) {
      console.error('Error adding moderator:', err);
      error = err instanceof Error ? err.message : 'Failed to add moderator';
    }
  }
  
  function startEdit(moderator: Moderator) {
    editingModerator = moderator;
    editingUsername = moderator.username || '';
    editingPassword = ''; // Clear password field for security
  }
  
  function cancelEdit() {
    editingModerator = null;
    editingUsername = '';
    editingPassword = '';
  }
  
  async function saveEdit() {
    if (!editingModerator) return;
    
    try {
      const updateData: any = { username: editingUsername.trim() };
      
      // Only update password if a new one is provided
      if (editingPassword.trim()) {
        const saltRounds = 12;
        updateData.password = await bcrypt.hash(editingPassword.trim(), saltRounds);
      }
      
      const { error: updateError } = await supabase
        .from('moderators')
        .update(updateData)
        .eq('id', editingModerator.id);
      
      if (updateError) throw updateError;
      
      await loadModerators();
      cancelEdit();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to update moderator';
    }
  }
  
  async function deleteModerator(id: string) {
    if (!confirm('Are you sure you want to delete this moderator? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { error: deleteError } = await supabase
        .from('moderators')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
      await loadModerators();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete moderator';
    }
  }
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }
</script>

<svelte:head>
  <title>User Management - Placemarked Admin</title>
</svelte:head>

<div class="admin-container">
  <div class="admin-content">
    <div class="admin-header-section">
      <h1>User Management</h1>
      <a href="/admin">← Back to Admin Panel</a>
    </div>
    
    {#if error}
      <div class="error-alert">
        {error}
      </div>
    {/if}
    
    <!-- Add New Moderator -->
    <div class="add-user-section">
      <h2>Add New Moderator</h2>
      <div class="add-user-form">
        <input
          bind:value={newUsername}
          placeholder="Enter username"
        />
        <input
          bind:value={newPassword}
          type="password"
          placeholder="Enter password"
          on:keydown={(e) => e.key === 'Enter' && addModerator()}
        />
        <button on:click={addModerator} class="btn btn-primary">Add Moderator</button>
      </div>
    </div>
    
    {#if loading}
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading moderators...</p>
      </div>
    {:else}
      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Password</th>
              <th>ID</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each moderators as moderator (moderator.id)}
              <tr>
                <td>
                  {#if editingModerator?.id === moderator.id}
                    <input
                      bind:value={editingUsername}
                      placeholder="Username"
                    />
                  {:else}
                    {moderator.username || 'No username'}
                  {/if}
                </td>
                <td>
                  {#if editingModerator?.id === moderator.id}
                    <input
                      bind:value={editingPassword}
                      type="password"
                      placeholder="New password (leave blank to keep current)"
                    />
                  {:else}
                    {moderator.password ? '••••••••' : 'No password'}
                  {/if}
                </td>
                <td class="id-cell">{moderator.id}</td>
                <td>{formatDate(moderator.created_at)}</td>
                <td class="actions-cell">
                  {#if editingModerator?.id === moderator.id}
                    <button on:click={saveEdit} class="btn btn-save">Save</button>
                    <button on:click={cancelEdit} class="btn btn-cancel">Cancel</button>
                  {:else}
                    <button on:click={() => startEdit(moderator)} class="btn btn-edit">Edit</button>
                    <button on:click={() => deleteModerator(moderator.id)} class="btn btn-delete">Delete</button>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      
      {#if moderators.length === 0}
        <div class="empty-state">
          No moderators found. Add your first moderator above.
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .admin-container {
    padding: 20px;
    background-color: #f5f5f5;
    min-height: 100vh;
  }

  .admin-content {
    max-width: 1200px;
    margin: 0 auto;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    padding: 20px;
  }

  .admin-header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #eee;
  }

  .admin-header-section h1 {
    margin: 0;
    font-size: 24px;
    font-weight: bold;
    color: #333;
  }

  .admin-header-section a {
    color: #0066cc;
    text-decoration: none;
  }

  .admin-header-section a:hover {
    text-decoration: underline;
  }

  .error-alert {
    background-color: #fee;
    border: 1px solid #fcc;
    color: #c33;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 20px;
  }

  .add-user-section {
    margin-bottom: 30px;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;
  }

  .add-user-section h2 {
    margin: 0 0 15px 0;
    font-size: 18px;
    color: #333;
  }

  .add-user-form {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .add-user-form input {
    flex: 1;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }

  .loading-container {
    text-align: center;
    padding: 40px;
  }

  .loading-spinner {
    display: inline-block;
    width: 30px;
    height: 30px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #0066cc;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 10px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .table-container {
    overflow-x: auto;
  }

  .admin-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }

  .admin-table th,
  .admin-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }

  .admin-table th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #555;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .admin-table tr:hover {
    background-color: #f8f9fa;
  }

  .id-cell {
    font-family: monospace;
    font-size: 12px;
    color: #666;
  }

  .actions-cell {
    white-space: nowrap;
  }

  .btn {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    margin-right: 5px;
    text-decoration: none;
    display: inline-block;
  }

  .btn-primary {
    background-color: #0066cc;
    color: white;
  }

  .btn-primary:hover {
    background-color: #0052a3;
  }

  .btn-edit {
    background-color: #0066cc;
    color: white;
  }

  .btn-edit:hover {
    background-color: #0052a3;
  }

  .btn-delete {
    background-color: #dc3545;
    color: white;
  }

  .btn-delete:hover {
    background-color: #c82333;
  }

  .btn-save {
    background-color: #28a745;
    color: white;
  }

  .btn-save:hover {
    background-color: #218838;
  }

  .btn-cancel {
    background-color: #6c757d;
    color: white;
  }

  .btn-cancel:hover {
    background-color: #5a6268;
  }

  .empty-state {
    text-align: center;
    padding: 40px;
    color: #666;
  }

  input {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }

  input:focus {
    outline: none;
    border-color: #0066cc;
    box-shadow: 0 0 0 2px rgba(0,102,204,0.2);
  }
</style>
