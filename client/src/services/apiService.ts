import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_BASE_URL;

if (!API_URL) {
  console.error('VITE_BACKEND_BASE_URL is not set in .env file.');
}

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('user_token');

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      let anonymousId = localStorage.getItem('anonymous_user_id');

      if (!anonymousId) {
        anonymousId = crypto.randomUUID();
        localStorage.setItem('anonymous_user_id', anonymousId);
      }
      config.headers = config.headers ?? {};
      config.headers['X-User-Id'] = anonymousId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ---API Functions---

export const uploadReceipt = async (file: File) => {
  const formData = new FormData();
  formData.append('receiptFile', file);

  try {
    const response = await apiClient.post('/receipts/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading receipt: ', error);
    throw error;
  }
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
