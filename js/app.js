// Main application logic
const tableBody = document.querySelector('#requestsTable tbody');
const modal = document.getElementById('modal');
const form = document.getElementById('requestForm');
const sb = window.supabaseClient;
let requestRows = [];
let searchQuery = '';
let selectedStatus = '';
let selectedPriority = '';

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

function slug(str){
  return String(str || '').toLowerCase().replace(/\s+/g, '-');
}

function formatDate(value){
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

function filteredRows(){
  const query = searchQuery.toLowerCase();

  return requestRows.filter(row => {
    const searchableText = [
      row.requester_name,
      row.description,
      row.category,
      row.priority,
      row.status,
      row.created_at,
      formatDate(row.created_at)
    ].join(' ').toLowerCase();

    return (!query || searchableText.includes(query))
      && (!selectedStatus || row.status === selectedStatus)
      && (!selectedPriority || row.priority === selectedPriority);
  });
}

function renderRows(rows){
  tableBody.innerHTML = '';

  if (!rows || rows.length === 0){
    const tr = document.createElement('tr');
    tr.className = 'empty-row';
    tr.innerHTML = `<td colspan="7">No requests match. Try a different search or filter, or create a new request.</td>`;
    tableBody.appendChild(tr);
    return;
  }

  rows.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="ID">${r.id}</td>
      <td data-label="Requester">${r.requester_name}</td>
      <td data-label="Category">${r.category}</td>
      <td data-label="Priority"><span class="badge badge-priority-${slug(r.priority)}">${r.priority}</span></td>
      <td data-label="Status"><span class="badge badge-status-${slug(r.status)}">${r.status}</span></td>
      <td data-label="Date">${formatDate(r.created_at)}</td>
      <td data-label="Action">
        <button data-id="${r.id}" class="editBtn">Edit</button>
        <button data-id="${r.id}" class="delBtn">Delete</button>
      </td>`;
    tableBody.appendChild(tr);
  });
}

async function refresh(){
  requestRows = await fetchRequests();
  renderRows(filteredRows());
  updateCounts(requestRows);
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
  searchQuery = e.target.value.trim();
  renderRows(filteredRows());
});

document.getElementById('statusFilter').addEventListener('change', async (e)=>{
  selectedStatus = e.target.value;
  renderRows(filteredRows());
});

document.getElementById('priorityFilter').addEventListener('change', async (e)=>{
  selectedPriority = e.target.value;
  renderRows(filteredRows());
});

// initial load
(async ()=>{ await refresh(); })();
