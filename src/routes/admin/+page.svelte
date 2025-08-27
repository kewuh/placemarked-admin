<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/clients/supabaseClient';
  import type { Database } from '$lib/clients/database.types';
  
  type Moment = Database['public']['Tables']['moments']['Row'];
  
  let moments: Moment[] = [];
  let loading = true;
  let error = '';
  let editingMoment: Moment | null = null;
  let editingDescription = '';
  let editingStatus = '';
  let editingLanguage = '';
  
  // Status options for the dropdown
  const statusOptions = ['pending', 'approved', 'rejected'];
  
  onMount(async () => {
    await loadMoments();
  });
  
  async function loadMoments() {
    try {
      loading = true;
      const { data, error: fetchError } = await supabase
        .from('moments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      moments = data || [];
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load moments';
    } finally {
      loading = false;
    }
  }
  
  function startEdit(moment: Moment) {
    editingMoment = moment;
    editingDescription = moment.description || '';
    editingStatus = moment.status || 'pending';
    editingLanguage = moment.language || '';
  }
  
  function cancelEdit() {
    editingMoment = null;
    editingDescription = '';
    editingStatus = '';
    editingLanguage = '';
  }
  
  async function saveEdit() {
    if (!editingMoment) return;
    
    // Validate language field - must be exactly 2 lowercase letters or null
          let validatedLanguage: string | null = editingLanguage;
      if (editingLanguage && editingLanguage.trim() !== '') {
        validatedLanguage = editingLanguage.toLowerCase().trim();
        if (!/^[a-z]{2}$/.test(validatedLanguage)) {
          error = 'Language must be exactly 2 lowercase letters (e.g., "en", "es")';
          return;
        }
      } else {
        validatedLanguage = null;
      }
    
    try {
      console.log('Updating moment:', editingMoment.id);
      console.log('Update data:', {
        description: editingDescription,
        status: editingStatus,
        language: validatedLanguage
      });
      
      const updateData: any = {
        description: editingDescription,
        status: editingStatus
      };
      
      if (validatedLanguage !== null) {
        updateData.language = validatedLanguage;
      }
      
      const { data, error: updateError } = await supabase
        .from('moments')
        .update(updateData)
        .eq('id', editingMoment.id)
        .select();
      
      console.log('Update response:', { data, error: updateError });
      
      if (updateError) throw updateError;
      
      // Update the local state
      const index = moments.findIndex(m => m.id === editingMoment!.id);
      if (index !== -1) {
        moments[index] = {
          ...moments[index],
          description: editingDescription,
          status: editingStatus,
          language: editingLanguage
        };
      }
      
      cancelEdit();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to update moment';
    }
  }
  
  async function deleteMoment(id: string) {
    if (!confirm('Are you sure you want to delete this moment? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { error: deleteError } = await supabase
        .from('moments')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
      // Remove from local state
      moments = moments.filter(m => m.id !== id);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete moment';
    }
  }
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }
  

</script>

<svelte:head>
  <title>Admin - UK Queering Map</title>
</svelte:head>

<div class="admin-container">
  <div class="admin-content">
    <div class="admin-header-section">
      <h1>Admin Panel</h1>
      <div class="admin-links">
        <a href="/admin/users">Manage Users</a>
        <a href="/">← Back to Map</a>
      </div>
    </div>
    
    {#if error}
      <div class="error-alert">
        {error}
      </div>
    {/if}
    
    {#if loading}
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading moments...</p>
      </div>
    {:else}
      <div class="table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Description</th>
              <th>Status</th>
              <th>Language</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each moments as moment (moment.id)}
              <tr>
                <td>{moment.short_id}</td>
                <td class="description-cell">
                  {#if editingMoment?.id === moment.id}
                    <textarea
                      bind:value={editingDescription}
                      rows="3"
                      placeholder="Enter description..."
                    ></textarea>
                  {:else}
                    <div class="description-text" title={moment.description || ''}>
                      {moment.description || 'No description'}
                    </div>
                  {/if}
                </td>
                <td>
                  {#if editingMoment?.id === moment.id}
                    <select bind:value={editingStatus}>
                      {#each statusOptions as status}
                        <option value={status}>{status}</option>
                      {/each}
                    </select>
                  {:else}
                    <span class="status-badge status-{moment.status || 'pending'}">
                      {moment.status || 'pending'}
                    </span>
                  {/if}
                </td>
                <td>
                  {#if editingMoment?.id === moment.id}
                    <input
                      bind:value={editingLanguage}
                      placeholder="Language code (e.g., en, es)"
                    />
                  {:else}
                    {moment.language || 'Not specified'}
                  {/if}
                </td>
                <td>{formatDate(moment.created_at)}</td>
                <td class="actions-cell">
                  {#if editingMoment?.id === moment.id}
                    <button on:click={saveEdit} class="btn btn-save">Save</button>
                    <button on:click={cancelEdit} class="btn btn-cancel">Cancel</button>
                  {:else}
                    <button on:click={() => startEdit(moment)} class="btn btn-edit">Edit</button>
                    <button on:click={() => deleteMoment(moment.id)} class="btn btn-delete">Delete</button>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      
      {#if moments.length === 0}
        <div class="empty-state">
          No moments found in the database.
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

  .admin-links {
    display: flex;
    gap: 15px;
    align-items: center;
  }

  .error-alert {
    background-color: #fee;
    border: 1px solid #fcc;
    color: #c33;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 20px;
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

  .description-cell {
    max-width: 300px;
  }

  .description-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 280px;
  }

  .status-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
  }

  .status-approved {
    background-color: #d4edda;
    color: #155724;
  }

  .status-rejected {
    background-color: #f8d7da;
    color: #721c24;
  }

  .status-pending {
    background-color: #fff3cd;
    color: #856404;
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

  textarea, input, select {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }

  textarea:focus, input:focus, select:focus {
    outline: none;
    border-color: #0066cc;
    box-shadow: 0 0 0 2px rgba(0,102,204,0.2);
  }
</style>
