// jest.setup-int.js

// Set environment variables for integration tests
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '3306';
process.env.DB_USER = 'testuser';
process.env.DB_PASSWORD = 'testpassword';
process.env.DB_NAME = 'payment_db_test';

process.env.AWS_ACCESS_KEY_ID = 'test';
process.env.AWS_SECRET_ACCESS_KEY = 'test';
process.env.SQS_ENDPOINT_URL = 'http://localhost:4566';
process.env.SQS_QUEUE_URL = 'http://localhost:4566/000000000000/my-test-queue'; // Example queue

process.env.SLACK_WEBHOOK_URL = 'http://localhost:8080/slack'; // Mocked slack

// You can add any other global setup here if needed
