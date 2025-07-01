import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

if(!API_URL) {
  console.error('VITE_API_URL is not set in .env file.')
}
const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('user_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      let anonymousId = localStorage.getItem('anonymous_user_id');

      if (!anonymousId) {
        // create anonymous Id if none exist and save it
        anonymousId = crypto.randomUUID();
        localStorage.setItem('anonymous_user_id', anonymousId)
      }
      // Add anonymous ID to the custom header
      config.headers['X-User-Id'] = anonymousId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ---API Functions ---

// apiService.ts
export const uploadReceipt = async (file: File, token: string) => {
  const formData = new FormData();
  formData.append('receiptFile', file);

  const response = await axios.post('/api/receipts/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const getAllReceipts = async () => {
  try {
    const response = await apiClient.get('/receipts');
    return response.data;
  } catch (error) {
    console.error('Error fetching receipts: ', error);
    throw error;
  }
};