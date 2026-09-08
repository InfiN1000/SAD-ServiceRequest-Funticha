// Main application logic
const tableBody = document.querySelector('#requestsTable tbody');
const modal = document.getElementById('modal');
const form = document.getElementById('requestForm');
const sb = window.supabaseClient;

// redirect if not authenticated
(async ()=>{
  if (!sb) return alert('Supabase client not initialized');
  const { data } = await sb.auth.getUser();
  const user = data?.user || null;
  if (!user) return window.location.href = 'login.html';
})();

async function fetchRequests(){
  const { data, error } = await sb.from('service_requests').select('*').order('id', {ascending:true});
  if (error) { console.error(error); return []; }
  return data;
}

function renderRows(rows){
  tableBody.innerHTML = '';
  rows.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.id}</td>
      <td>${r.requester_name}</td>
      <td>${r.category}</td>
      <td>${r.priority}</td>
      <td>${r.status}</td>
      <td>
        <button data-id="${r.id}" class="editBtn">Edit</button>
        <button data-id="${r.id}" class="delBtn">Delete</button>
      </td>`;
    tableBody.appendChild(tr);
  });
}

async function refresh(){
  const rows = await fetchRequests();
  renderRows(rows);
  updateCounts(rows);
}

function updateCounts(rows){
  document.getElementById('totalCount').textContent = rows.length;
  document.getElementById('pendingCount').textContent = rows.filter(r=>r.status==='Pending').length;
  document.getElementById('inprogressCount').textContent = rows.filter(r=>r.status==='In Progress').length;
  document.getElementById('completedCount').textContent = rows.filter(r=>r.status==='Completed').length;
}

document.getElementById('newRequestBtn').addEventListener('click', ()=>{
  openForm();
});

document.getElementById('cancelBtn').addEventListener('click', ()=>{ closeForm(); });

function openForm(data){
  document.getElementById('formTitle').textContent = data ? 'Edit Request' : 'New Request';
  document.getElementById('requestId').value = data?.id || '';
  document.getElementById('requester').value = data?.requester_name || '';
  document.getElementById('department').value = data?.department || '';
  document.getElementById('category').value = data?.category || 'Computer repair';
  document.getElementById('description').value = data?.description || '';
  document.getElementById('priority').value = data?.priority || 'Low';
  document.getElementById('status').value = data?.status || 'Pending';
  modal.classList.remove('hidden');
}
function closeForm(){ modal.classList.add('hidden'); }

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const id = document.getElementById('requestId').value;
  const payload = {
    requester_name: document.getElementById('requester').value.trim(),
    department: document.getElementById('department').value.trim(),
    category: document.getElementById('category').value,
    description: document.getElementById('description').value.trim(),
    priority: document.getElementById('priority').value,
    status: document.getElementById('status').value,
    user_id: (await sb.auth.getUser())?.data?.user?.id || null
  };
  // Business rules basic validation
  if (!payload.requester_name) return alert('Requester name cannot be empty');
  if (!payload.department) return alert('Department is required');
  if (!payload.category) return alert('Category is required');
  if (!payload.description || payload.description.length < 6) return alert('Description too short');

  if (id){
    const { error } = await sb.from('service_requests').update(payload).eq('id', id);
    if (error) return alert('Update failed');
  } else {
    payload.status = 'Pending';
    const { error } = await sb.from('service_requests').insert([payload]);
    if (error) return alert('Insert failed');
  }
  closeForm();
  await refresh();
});

tableBody.addEventListener('click', async (e)=>{
  const id = e.target.dataset.id;
  if (e.target.classList.contains('editBtn')){
    const { data } = await sb.from('service_requests').select('*').eq('id', id).single();
    openForm(data);
  }
  if (e.target.classList.contains('delBtn')){
    if (!confirm('Are you sure you want to delete this request?')) return;
    const { error } = await sb.from('service_requests').delete().eq('id', id);
    if (error) return alert('Delete failed');
    await refresh();
  }
});

document.getElementById('searchInput').addEventListener('input', async (e)=>{
  const q = e.target.value.trim();
  let builder = sb.from('service_requests').select('*');
  if (q) builder = builder.or(`requester_name.ilike.%${q}%,description.ilike.%${q}%`);
  const { data } = await builder.order('id', {ascending:true});
  renderRows(data || []);
});

document.getElementById('statusFilter').addEventListener('change', async (e)=>{
  const v = e.target.value;
  let builder = sb.from('service_requests').select('*');
  if (v) builder = builder.eq('status', v);
  const { data } = await builder.order('id', {ascending:true});
  renderRows(data || []);
});

document.getElementById('priorityFilter').addEventListener('change', async (e)=>{
  const v = e.target.value;
  let builder = sb.from('service_requests').select('*');
  if (v) builder = builder.eq('priority', v);
  const { data } = await builder.order('id', {ascending:true});
  renderRows(data || []);
});

// initial load
(async ()=>{ await refresh(); })();
