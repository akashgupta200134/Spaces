import adminRoutes from './routes/admin';

// Ensure this line is present before starting your server
app.use('/api/admin', adminRoutes);