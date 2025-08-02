const request = require('supertest');
const express = require('express');
const { validate, getValidator } = require('../../../src/middleware/validation');
const Joi = require('joi');

describe('Validation Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('validate function', () => {
    it('should pass valid data', async () => {
      const schema = {
        body: Joi.object({
          name: Joi.string().required(),
          age: Joi.number().min(0).max(120).required()
        })
      };

      app.post('/test', validate(schema), (req, res) => {
        res.json({ success: true, data: req.body });
      });

      const response = await request(app)
        .post('/test')
        .send({ name: 'John', age: 30 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({ name: 'John', age: 30 });
    });

    it('should reject invalid data with detailed errors', async () => {
      const schema = {
        body: Joi.object({
          name: Joi.string().required(),
          age: Joi.number().min(0).max(120).required()
        })
      };

      app.post('/test', validate(schema), (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/test')
        .send({ age: -5 }) // Missing name, invalid age
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.errors).toHaveLength(2);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'body.name',
          type: 'any.required'
        })
      );
    });

    it('should strip unknown fields', async () => {
      const schema = {
        body: Joi.object({
          name: Joi.string().required()
        })
      };

      app.post('/test', validate(schema), (req, res) => {
        res.json({ success: true, data: req.body });
      });

      const response = await request(app)
        .post('/test')
        .send({ name: 'John', unknown: 'field' })
        .expect(200);

      expect(response.body.data).toEqual({ name: 'John' });
      expect(response.body.data.unknown).toBeUndefined();
    });

    it('should validate query parameters', async () => {
      const schema = {
        query: Joi.object({
          page: Joi.number().min(1).default(1),
          limit: Joi.number().min(1).max(100).default(20)
        })
      };

      app.get('/test', validate(schema), (req, res) => {
        res.json({ query: req.query });
      });

      const response = await request(app)
        .get('/test?page=2&limit=50')
        .expect(200);

      expect(response.body.query).toEqual({ page: 2, limit: 50 });
    });
  });

  describe('getValidator for messages', () => {
    it('should validate message creation', async () => {
      app.post('/messages', getValidator('messages', 'create'), (req, res) => {
        res.json({ success: true });
      });

      // Valid request
      await request(app)
        .post('/messages')
        .send({
          customer_id: 123,
          content: 'Help me with my booking'
        })
        .expect(200);

      // Invalid request - missing required field
      const response = await request(app)
        .post('/messages')
        .send({
          content: 'Help me'
        })
        .expect(400);

      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'body.customer_id'
        })
      );
    });

    it('should validate content length', async () => {
      app.post('/messages', getValidator('messages', 'create'), (req, res) => {
        res.json({ success: true });
      });

      const longContent = 'a'.repeat(5001); // Exceeds 5000 char limit

      const response = await request(app)
        .post('/messages')
        .send({
          customer_id: 123,
          content: longContent
        })
        .expect(400);

      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'body.content',
          type: 'string.max'
        })
      );
    });
  });

  describe('getValidator for auth', () => {
    it('should validate login credentials', async () => {
      app.post('/auth/login', getValidator('auth', 'login'), (req, res) => {
        res.json({ success: true });
      });

      // Valid credentials
      await request(app)
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'securepass123'
        })
        .expect(200);

      // Invalid - short password
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'short'
        })
        .expect(400);

      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'body.password',
          type: 'string.min'
        })
      );
    });

    it('should validate email format in registration', async () => {
      app.post('/auth/register', getValidator('auth', 'register'), (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'not-an-email',
          password: 'securepass123'
        })
        .expect(400);

      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'body.email',
          type: 'string.email'
        })
      );
    });
  });
});