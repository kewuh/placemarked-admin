<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  
  onMount(() => {
    // Redirect to admin interface
    goto("/admin");
  });
</script>

<svelte:head>
  <title>Placemarked - Admin Tool</title>
</svelte:head>

<div class="loading-container">
  <div class="loading-spinner"></div>
  <p>Redirecting to admin interface...</p>
</div>

<style>
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background-color: #f5f5f5;
  }
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #0066cc;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  p {
    color: #666;
    font-size: 16px;
  }
</style>
