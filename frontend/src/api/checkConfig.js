import { baseURI } from './config';

console.log('Backend URL:', baseURI);

// Test if the URL is accessible
fetch(`${baseURI}/api/test`)
  .then(response => response.json())
  .then(data => console.log('Server test response:', data))
  .catch(error => console.error('Server test error:', error)); 