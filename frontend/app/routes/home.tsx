import { useState, useEffect } from 'react';
import { DataTable } from '../components/DataTable';
import { 
  TextField, 
  Button, 
  Paper, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText,
  Grid,
  Typography,
  CircularProgress
} from '@mui/material';

export default function Home() {
  const [tables, setTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTable, setActiveTable] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:4000/api/tables');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTables(data.TableNames || []);
    } catch (err) {
      console.error('Error fetching tables:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  };

  const filteredTables = tables.filter(table => 
    table.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <Grid container spacing={3}>
        {/* Left sidebar with table list */}
        <Grid item xs={12} md={3}>
          <Paper className="p-4">
            <Typography variant="h6" className="mb-4">
              Available Tables
            </Typography>
            
            <TextField
              fullWidth
              size="small"
              label="Search tables"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-3"
            />

            {loading ? (
              <div className="flex justify-center p-4">
                <CircularProgress size={24} />
              </div>
            ) : error ? (
              <div className="text-red-500 p-2">
                {error}
              </div>
            ) : (
              <List className="max-h-[calc(100vh-250px)] overflow-auto">
                {filteredTables.map((table) => (
                  <ListItem 
                    key={table} 
                    disablePadding
                    className="border-b"
                  >
                    <ListItemButton
                      selected={activeTable === table}
                      onClick={() => setActiveTable(table)}
                      className="hover:bg-gray-100"
                    >
                      <ListItemText 
                        primary={table}
                        primaryTypographyProps={{
                          className: activeTable === table ? 'font-bold' : ''
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
                {filteredTables.length === 0 && (
                  <div className="text-gray-500 p-2 text-center">
                    No tables found
                  </div>
                )}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Main content area */}
        <Grid item xs={12} md={9}>
          {activeTable ? (
            <>
              <Typography variant="h5" className="mb-4">
                Table: {activeTable}
              </Typography>
              <DataTable tableName={activeTable} />
            </>
          ) : (
            <Paper className="p-8 text-center text-gray-500">
              Select a table from the list to view its data
            </Paper>
          )}
        </Grid>
      </Grid>
    </div>
  );
}