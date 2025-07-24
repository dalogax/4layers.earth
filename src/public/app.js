// Fetch message from backend API and display it
document.addEventListener('DOMContentLoaded', async () => {
  const apiMessageElem = document.getElementById('api-message');
  try {
    const res = await fetch('/api/hello');
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    apiMessageElem.textContent = data.message;
  } catch (err) {
    apiMessageElem.textContent = 'Failed to fetch API message.';
  }
});
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}
