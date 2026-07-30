const { parse, stringify } = require('qs');

function fetchService(baseURL) {

  // ===== Validate baseURL =====
  if (!baseURL || typeof baseURL !== 'string' || baseURL.trim() === '') {
    throw new Error(`[fetchCustom] baseURL empty`);
  }

  const trimmedURL = baseURL.trim();
  if (!/^https?:\/\//i.test(trimmedURL)) {
    throw new Error(`[fetchCustom] baseURL http://... or https://..."`);
  }

  const defaultHeaders = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': true,
    crossorigin: true,
  };

  /**
   * @param {string} url - đường dẫn tương đối hoặc tuyệt đối
   * @param {RequestInit & { params?: object }} options
   */
  async function request(url, options = {}) {
    const { params, headers = {}, body, ...rest } = options;

    // Xử lý query params bằng qs
    let finalUrl = url.startsWith('http') ? url : `${baseURL}${url}`;
    if (params && Object.keys(params).length > 0) {
      const query = stringify(params);
      finalUrl += (finalUrl.includes('?') ? '&' : '?') + query;
    }

    const config = {
      ...rest,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
    };

    // Tự động stringify body nếu là object
    if (body && typeof body === 'object' && !(body instanceof FormData)) {
      config.body = JSON.stringify(body);
    } else if (body) {
      config.body = body;
    }

    try {
      const response = await fetch(finalUrl, config);

      // Giống interceptor response của axios: trả về response hoặc reject
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.response = response;
        error.status = response.status;
        throw error;
      }

      return response;
    } catch (error) {
      // Giống interceptor request/response error
      return Promise.reject(error);
    }
  }

  // Các method tiện dụng giống axios
  return {
    get: (url, options = {}) => request(url, { ...options, method: 'GET' }),
    post: (url, body, options = {}) => request(url, { ...options, method: 'POST', body }),
    put: (url, body, options = {}) => request(url, { ...options, method: 'PUT', body }),
    patch: (url, body, options = {}) => request(url, { ...options, method: 'PATCH', body }),
    delete: (url, options = {}) => request(url, { ...options, method: 'DELETE' }),
    request, // nếu cần gọi trực tiếp
  };
}

const getApiElyBy = function() {
  const api = fetchService('https://authserver.ely.by')
  return {
    authenticate: async function (login, password) {
      const res = await api.post('/auth/authenticate', 
      {
        agent: { name: 'Minecraft', version: 1 },
        username: login,
        password: password,
        requestUser: true,
      });
      return res;
    }
  }
}

module.exports = { getApiElyBy };