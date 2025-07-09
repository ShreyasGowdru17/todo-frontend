const API_BASE_URL='todo-backend-production-09f0.up.railway.app';
const TOKEN_KEY='jwt_token';

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (token && token.split('.').length === 3) {
    localStorage.setItem('jwt_token', token);
    console.log('Token saved to localStorage:', token);
    window.history.replaceState({}, document.title, "dashboard.html"); 
  }
});

function setToken(token) {
    if (token && token !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, token);
    }
}

function getToken() {
    const token = localStorage.getItem(TOKEN_KEY);
    return (token && token !== 'undefined' && token !== 'null') ? token : null;
}

function removeToken(){
  localStorage.removeItem(TOKEN_KEY);
}

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  if (token && token.split('.').length === 3) {
    localStorage.setItem('jwt_token', token);
    window.history.replaceState({}, document.title, "dashboard.html");
  }
});

function getAuthHeaders(){

  const token = getToken();
  if (token && token !== 'undefined' && token.split('.').length === 3) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}
function isPublicRoute(url) {
  return url.startsWith('/auth/resetPassword') || 
         url.startsWith('/auth/savePassword') ||
         url.startsWith('/auth/register') || 
         url.startsWith('/auth/login') ||
         url.startsWith('/auth/verifyRegistration');
}

async function apiCall(url,options={}){

  const config={
    ...options,
    headers:{
      'Content-Type':'application/json',
      ...(isPublicRoute(url) ? {} : getAuthHeaders()),
      ...(options.headers || {})
    },
 
  };

  try{
    const response=await fetch(`${API_BASE_URL}${url}`,config);

    if(!response.ok){
      const errorText=await response.text();
      throw new Error(errorText || `HTTP error ! status:${response.status}`);
    }
    const contentType=response.headers.get('content-type');
    if(contentType && contentType.includes('application/json')){
      return await response.json();
    }
    return await response.text();
  }
  catch(error){
    console.error('API call failed:',error);
    throw error;
  }
}

async function login(email,password){
  return await apiCall('/auth/login',{
    method:'POST',
    body:JSON.stringify({userName:email,password:password})
  });
}

async function register(email,password){
  return await apiCall('/auth/register',{
    method:'POST',
    body:JSON.stringify({userName:email,password:password})
  });
}

async function resetPassword(email) {
  return await fetch(`${API_BASE_URL}/auth/resetPassword`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: email })
  }).then(async res => {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return await res.text();
  });
}
async function savePassword(token,password){
  return await apiCall(`/auth/savePassword?token=${token}`,{
    method:'POST',
    body:JSON.stringify({password:password})
  });
}

async function addTask(task) {
  return await apiCall('/todo/addTask', {
    method: 'POST',
    body: JSON.stringify({ task: task }) 
  });
}

async function getAllTasks(){
  return await apiCall('/todo/allTask');
}

async function deleteTask(id) {
    return await apiCall(`/todo/deleteTask/${id}`,{
      method: 'DELETE'
    });
}

async function toggleTask(id){
  return await apiCall(`/todo/toggleTask/${id}`,{
    method:'PUT'
  });
}
if(document.getElementById('login-form')){
  document.getElementById('login-form').addEventListener('submit',async (e) =>{
    e.preventDefault();

    const email=document.querySelector('.login-email').value;
    const password=document.querySelector('.login-password').value;
    const submitBtn=document.querySelector('button[type="submit"]');

    try{
      submitBtn.disabled=true;
      submitBtn.innerHTML=`<span class="loading"></span> Logging in...`;

      const tokenResponse=await login(email,password);
      const token = tokenResponse.token || tokenResponse.response || tokenResponse.jwt;
      if (!token) {
        alert('No token received from server');
        return;
      }
setToken(token);
      window.location.href='dashboard.html';
    }
    catch(error){
      alert('Login failed:'+error.message);
    }
    finally{
      submitBtn.disabled=false;
      submitBtn.innerHTML='Submit';
    }
  });

  const urlParams=new URLSearchParams(window.location.search);
  const token=urlParams.get('token');
  if(token){
    setToken(token)
    window.location.href='dashboard.html';
  }

  const passwordReset=urlParams.get('passwordReset');
  if(passwordReset=='true'){
    alert('Password reset successful! Please login with your new password');
  }
}

if(document.getElementById('register-form')){

  document.getElementById('register-form').addEventListener('submit',async(e)=>{
    e.preventDefault(); 

    const email=document.querySelector('.registration-email').value;
    const password=document.querySelector('.registration-password').value;
    const submitBtn=document.querySelector('button[type="submit"]');

    try{

      submitBtn.disabled=true;
      submitBtn.innerHTML='<span class="loading"></span> Registering..';

      const result=await register(email,password);

      const successMessage=document.querySelector('.email-verification');
      if(successMessage){
        successMessage.classList.add('show');
        successMessage.textContent=result;
      }
      else{
        alert('Registration successful! Please check email for verification.');
      }
      document.getElementById('register-form').reset();
    }
    catch(error){
      alert('Registration failed:'+error.message);
    }
    finally{
      submitBtn.disabled=false;
      submitBtn.innerHTML='Submit';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if(document.getElementById('forgot-password-form')){
    document.getElementById('forgot-password-form').addEventListener('submit',async(e)=>{e.preventDefault();

    const email=document.querySelector('.forgot-email').value;
    const submitBtn=document.querySelector('button[type="submit"]');

    try{

      submitBtn.disabled=true;
      submitBtn.innerHTML='<span class="loading"></span> Sending..';

      await resetPassword(email);

      const resetMessage=document.querySelector('.reset-message');
      if(resetMessage){
        resetMessage.classList.add('show');
      }
      else{
        alert('Password reset link sent !Please check your email');
      }

      document.getElementById('forgot-password-form').reset();
    }catch(error){
      alert('Password reset failed:'+error.message);
    }
    finally{
      submitBtn.disabled=false;
      submitBtn.innerHTML='Send Password Reset Link';
    }
  });
  }
});

if(document.getElementById('password-reset-form')){

  document.getElementById('password-reset-form').addEventListener('submit',async(e)=>{
    e.preventDefault();

    const urlParams=new URLSearchParams(window.location.search);
    const token=urlParams.get('token');
    const password=document.querySelector('.new-password').value;
    const confirmPassword=document.querySelector('.confirm-password').value;
    const submitBtn=document.querySelector('button[type="submit"]');

    if(password!==confirmPassword){
      alert('Passwords do not match');
      return;
    }
    
    try{
      submitBtn.disabled=true;
      submitBtn.innerHTML='<span class="loading"></span>Resetting..';

      await savePassword(token,password);
      alert('Password reset successful ! Redirecting to login');
      window.location.href='index.html?passwordReset=true';
    }
    catch(error){
      alert('Failed to reset password:'+error.message);
    }
    finally{
      submitBtn.disabled=false;
      submitBtn.innerHTML='Reset Password';
    }
  })
}

if(document.querySelector('.input-form')){

  document.addEventListener('DOMContentLoaded', () => {
  const token = getToken();
  if (!token || token.split('.').length !== 3) {
    alert('Session expired or invalid token. Please login again.');
    removeToken();
    window.location.href = 'index.html';
  } else {
    loadTasks(); 
  }
  });


  document.querySelector('.input-form button').addEventListener('click',async(e)=>{

    const input=document.querySelector('.input-form .input');
    const task=input.value.trim();

    if(!task){
      alert('Please enter a task');
      return;
    }

    try{

      const button=e.target;
      button.disabled=true;
      button.innerHTML='<span class="loading"></span>';

      const newTask=await addTask(task);
      tasks.push(newTask);
      renderTasks();

      input.value='';
    }catch(error){
      if(error.message.includes('401') || error.message.includes('403')){
        alert('Session expired.Please login again');
        removeToken();
        window.location.href='index.html';
      }
      else{
        alert('Failed to add task:'+error.message);
      }
    }
    finally{
      const button=e.target;
      button.disabled=false;
      button.innerHTML='Add';
    }
  });

  document.querySelector('.input-form .input').addEventListener('keypress',(e)=>{
    if(e.key==='Enter'){
      document.querySelector('.input-form button').click();
    }
  });

  async function loadTasks(){

    try{
      tasks=await getAllTasks();
      renderTasks();
    }catch(error){
      if(error.message.includes('401') || error.message.includes('403')){
        alert('Session expired.Please login again');
        removeToken();
        window.location.href='index.html';
    }
    else{
      console.error('Failed to load tasks:',error);
      alert('Failed to load tasks:'+error.message)
      }
    }
  }

  function renderTasks(){

    const listContainer=document.querySelector('.List');

    if(tasks.length===0){
      listContainer.innerHTML='<p class="text-center">No tasks yet.Add your first task above</p>';
      return;
    }
    listContainer.innerHTML=tasks.map(task=>`
      <div class="item js-item-${task.taskId} ${task.taskCompleted ? 'removed':''}">
      
      <span class="mark js-mark-${task.taskId}" data-mark-id="${task.taskId}">
        <img src="images/${task.taskCompleted ? 'checked' :'unchecked'}.png" alt="${task.taskCompleted ? 'Completed':'Pending'}">
        </span>
        <div class="task-name">${escapeHtml(task.taskName)}</div>
        <span class="remove" data-task-id="${task.taskId}">&#10005;</span>
        </div>
        `).join('');
      
      document.querySelectorAll('.remove').forEach(remove=>{
        remove.addEventListener('click',async(e)=>{
          const taskId=e.target.dataset.taskId;
          await removeTask(taskId);
        });
      });

      document.querySelectorAll('.mark').forEach(mark=>{
        mark.addEventListener('click',async(e)=>{
          const taskId=e.target.closest('.mark')?.dataset.markId;
          await toggleTaskStatus(taskId);
        });
      });
  }
  async function toggleTaskStatus(taskId){

    try{
      const result=await toggleTask(taskId);
      console.log(result);
      const task=tasks.find(t=> t.taskId==taskId);

      if(task){
        task.taskCompleted=!task.taskCompleted;
        renderTasks();
      }
    }catch(error){
      if(error.message.includes('401') || error.message.includes('403')){
        alert('Session expired.Please login again');
        removeToken();
        window.location.href='index.html';
      }
      else{
        alert('Failed to update task:'+error.message);
      }
    }
  }

  async function removeTask(taskId){
    if(!confirm('Are you sure you want to delete this task?'))return;

    try{
      const result=await deleteTask(taskId);
      console.log(result);

      tasks=tasks.filter(t=>t.taskId!=taskId);
      renderTasks();
    }
    catch(error){
      if(error.message.includes('401') || error.message.includes('403')){
        alert('Session expired.Please login again');
        removeToken();
        window.location.href='index.html';
    }
    else{
      alert('Failed to delete task:'+ error.message);
      }
    }
  }

  function escapeHtml(text){

    const div=document.createElement('div');
    div.textContent=text;
    return div.innerHTML;
  }

  const logoutBtn=document.querySelector('.logout-btn');
  if(logoutBtn){
    logoutBtn.addEventListener('click',()=>{
      removeToken();
      window.location.href='index.html';
    });
  }
}

if(window.location.pathname.includes('verify')){
  const urlParams=new URLSearchParams(window.location.search);

  const token=urlParams.get('token');

  if(token){
    verifyEmail(token);
  }

  async function verifyEmail(token){

    try{
      const result=await apiCall(`/auth/verifyRegistration?token=${token}`);

      document.body.innerHTML=`
      <div class="verify-success">
        <h2>Email verified successfully!</h2>
        <p>${result}</p>
        <a href="index.html">Go to Login</a>
        </div>`;
    }
    catch(error){
      document.body.innerHTML=`
      <div class="verify-container">
      <h2> verification failed</h2>
      <p>Error:${error.message}</p>
      <a href="index.html">Go to login</a>
      </div>`;
    }
  }
}
if(window.location.pathname.includes('oauth-success')){

  const urlParams=new URLSearchParams(window.location.search);
  const token=urlParams.get('token');

  if(token){
    setToken(token);
    document.body.innerHTML=`<div class="oauth-contianer">
    <h2>Login successful</h2>
    <p> You have logged in successfully.Redirecting to your tasks</p>
    </div>`;

    setTimeout(()=>{
      window.location.href='dashboard.html';
    },2000);
  }
  else{
    document.body.innerHTML=`<div class="verify-container">
    <h2>Login failed</h2>
    <p>OAuth login failed.Please try again</p>
    <a href="index.html">Go to Login</a>
    </div>`;
  }
}

window.addEventListener('unhandledrejection',(event)=>{
    console.error('Unhandled promise rejection:',event.reason);
    if(event.reason.message && event.reason.message.includes('401')){
      removeToken();
      window.location.href='index.html';
    }
});

if(!window.location.pathname.includes('index.html')&&
!window.location.pathname.includes('register.html')&&
!window.location.pathname.includes('forgot-password.html')&& !window.location.pathname.includes('verify')&&
!window.location.pathname.includes('oauth-success') && (document.querySelector('.container'))){

  const token=getToken();
  if(token){

    getAllTasks().catch(()=>{
      removeToken();
      window.location.href='index.html';
    });
  }

}

