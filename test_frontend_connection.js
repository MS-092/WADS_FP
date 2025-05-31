// Test frontend-backend connectivity
const testConnection = async () => {
  try {
    console.log('Testing backend connection...');
    
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:8000/health');
    console.log('Health check status:', healthResponse.status);
    const healthData = await healthResponse.json();
    console.log('Health data:', healthData);
    
    // Test login endpoint
    const loginResponse = await fetch('http://localhost:8000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@helpdesk.com',
        password: 'admin123'
      })
    });
    
    console.log('Login status:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('Login data:', loginData);
    
    if (loginData.user) {
      console.log('User role:', loginData.user.role);
    }
    
  } catch (error) {
    console.error('Connection test failed:', error);
  }
};

testConnection(); 