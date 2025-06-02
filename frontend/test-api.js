// Simple script to test the admin API call
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:8000/api';

async function testAdminUsersAPI() {
  try {
    console.log('Testing admin users API...');
    
    // First, let's try to login as admin to get a token
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@helpdesk.com',
        password: 'admin123' // Assuming this is the admin password
      })
    });
    
    if (!loginResponse.ok) {
      console.error('Login failed:', loginResponse.status, await loginResponse.text());
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('Login successful, token received');
    
    // Now test the admin users endpoint
    const usersResponse = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.access_token}`
      }
    });
    
    if (!usersResponse.ok) {
      console.error('Users API failed:', usersResponse.status, await usersResponse.text());
      return;
    }
    
    const usersData = await usersResponse.json();
    console.log('Users API response structure:', Object.keys(usersData));
    console.log('Is array?', Array.isArray(usersData));
    
    if (Array.isArray(usersData)) {
      console.log('Total users:', usersData.length);
      usersData.forEach((user, index) => {
        console.log(`\nUser ${index + 1}:`);
        console.log('- ID:', user.id);
        console.log('- Email:', user.email);
        console.log('- Full Name:', user.full_name);
        console.log('- Username:', user.username);
        console.log('- Role:', user.role);
        console.log('- Status:', user.status);
      });
    } else {
      console.log('Response is not an array:', usersData);
    }
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testAdminUsersAPI(); 