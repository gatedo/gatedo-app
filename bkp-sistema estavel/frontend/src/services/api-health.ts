export async function checkApiHealth() {
  try {
    const response = await fetch('https://app.gatedo.com/api/health');
    const data = await response.json();
    
    // Simplificado: se o status for 'ok', o banner some.
    return data.status === 'ok'; 
  } catch (error) {
    // Se der erro de conexão (API fora), retorna false e o banner aparece.
    return false;
  }
}