import express from 'express';
import cors from 'cors';
import userRoutes from './routes/user.routes.js';
import roadmapRoutes from './routes/roadmap.routes.js';
import nodeRoutes from './routes/node.routes.js';
import resourceRoutes from './routes/resource.routes.js';
import { NodeController } from './controllers/node.controller.js';

const app = express();
const nodeController = new NodeController();

app.use(cors());
app.use(express.json());

// Bind routes
app.use('/api/users', userRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/resources', resourceRoutes);

// Explicitly bind the requested PATCH /progress/:id route
app.patch('/api/progress/:id', nodeController.updateProgress);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the AI Learning Roadmap Platform API', status: 'active' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default app;
