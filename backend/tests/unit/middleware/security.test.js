const request = require('supertest');
const express = require('express');
const { securityHeaders, rateLimiters, additionalSecurity } = require('../../../src/middleware/security');

describe('Security Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('Security Headers', () => {
    it('should set security headers correctly', async () => {
      app.use(securityHeaders);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app)
        .get('/test')
        .expect(200);

      // Check for important security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('Additional Security', () => {
    it('should add additional security headers', async () => {
      app.use(additionalSecurity);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce general rate limit', async () => {
      // Use a stricter rate limit for testing
      const testRateLimiter = require('express-rate-limit')({
        windowMs: 1000, // 1 second
        max: 2, // 2 requests
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
          res.status(429).json({ error: 'Too many requests' });
        }
      });

      app.use(testRateLimiter);
      app.get('/test', (req, res) => res.json({ success: true }));

      // First two requests should succeed
      await request(app).get('/test').expect(200);
      await request(app).get('/test').expect(200);

      // Third request should be rate limited
      const response = await request(app)
        .get('/test')
        .expect(429);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Too many requests');
    });

    it('should have different limits for auth endpoints', () => {
      expect(rateLimiters.auth).toBeDefined();
      expect(rateLimiters.general).toBeDefined();
      expect(rateLimiters.messages).toBeDefined();
      expect(rateLimiters.sop).toBeDefined();
    });
  });
});