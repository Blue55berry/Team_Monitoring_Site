import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

import connectDB from './config/database.js';
import typeDefs from './graphql/typeDefs/index.js';
import resolvers from './graphql/resolvers/index.js';
import { authenticate } from './middleware/auth.js';
import setupSocketIO from './sockets/index.js';

dotenv.config();

const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

async function startServer() {
  // Connect to MongoDB
  await connectDB();

  const app = express();
  const httpServer = http.createServer(app);

  // Socket.IO
  const io = new SocketIOServer(httpServer, {
    cors: { origin: CLIENT_URL, methods: ['GET', 'POST'] }
  });
  setupSocketIO(io);

  // Security middleware
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(cors({ origin: CLIENT_URL, credentials: true }));
  app.use(morgan('dev'));

  // Rate limiting
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
  app.use(limiter);

  app.use(express.json({ limit: '10mb' }));

  // Apollo Server
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (error) => {
      console.error('GraphQL Error:', error.message);
      return {
        message: error.message,
        code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
        path: error.path
      };
    }
  });

  await apolloServer.start();

  // GraphQL endpoint
  app.use('/graphql', expressMiddleware(apolloServer, {
    context: async ({ req }) => {
      const user = await authenticate(req);
      return { user, io };
    }
  }));

  // Health check
  app.get('/health', (_, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Start server
  httpServer.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 GraphQL at http://localhost:${PORT}/graphql`);
    console.log(`🔌 Socket.IO ready`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
}

startServer().catch(console.error);
