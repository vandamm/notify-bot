// Mock global objects for Cloudflare Workers environment
global.Request = class MockRequest {
  constructor(url, options = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this.headers = options.headers || {};
    this.body = options.body || null;
  }
  
  async json() {
    return JSON.parse(this.body || '{}');
  }

  async text() {
    if (typeof this.body === 'string') {
      return this.body;
    }
    if (this.body == null) {
      return '';
    }
    return String(this.body);
  }
};

global.URL = class MockURL {
  constructor(url) {
    if (url.startsWith('http')) {
      const parsed = new (require('url').URL)(url);
      this.protocol = parsed.protocol;
      this.host = parsed.host;
      this.pathname = parsed.pathname;
      this.search = parsed.search;
      this.searchParams = parsed.searchParams;
    } else {
      // Fallback for invalid URLs
      this.protocol = 'https:';
      this.host = 'test.com';
      this.pathname = url;
      this.search = '';
      this.searchParams = new URLSearchParams();
    }
  }
};

global.Response = class MockResponse {
  constructor(body, options = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.headers = options.headers || {};
  }
  
  async text() {
    return this.body || '';
  }
};



global.ExecutionContext = class MockExecutionContext {};

// Mock process.env for tests that still need it
if (!global.process) {
  global.process = { env: {} };
} 

// Mock console.log to suppress output during tests
jest.spyOn(console, 'log').mockImplementation(() => {}); 
jest.spyOn(console, 'error').mockImplementation(() => {}); 
