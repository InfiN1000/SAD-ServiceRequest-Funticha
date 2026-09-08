// Simple auth helpers using supabaseClient
const auth = window.supabaseClient?.auth;

async function requireAuth() {
  if (!auth) return window.location.href = 'login.html';
  const { data } = await auth.getUser();
  const user = data?.user || null;
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

document.getElementById('logoutBtn')?.addEventListener('click', async ()=>{
  if (!auth) return window.location.href = 'login.html';
  await auth.signOut();
  window.location.href = 'login.html';
});
