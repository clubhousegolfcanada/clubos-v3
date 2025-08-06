# Add DATABASE_URL Variable Reference in Railway

1. Go to your Railway dashboard
2. Click on the "clubos-v3" service 
3. Go to the "Variables" tab
4. Click "New Variable"
5. Add a Variable Reference:
   - Click the link icon or "Add a Variable Reference"
   - Select "Postgres-v20Y" as the service
   - Select "DATABASE_URL" as the variable
   - This will create: DATABASE_URL=${{Postgres-v20Y.DATABASE_URL}}

This connects your backend service to the PostgreSQL database automatically.