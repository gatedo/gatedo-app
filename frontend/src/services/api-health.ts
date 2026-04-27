export async function checkApiHealth() {
  try {
    const response = await fetch('https://api.gatedo.com/api/health');
    const data = await response.json();
    return data.status === 'online';
  } catch (error) {
    return false;
  }
}