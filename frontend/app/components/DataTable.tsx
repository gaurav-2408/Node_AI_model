import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  CircularProgress,
  TextField,
  Box,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Card,
  Typography,
  Chip,
  Collapse,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useTheme } from '../theme/ThemeContext';

// PromptSection component
const PromptSection = ({ tableName }: PromptSectionProps) => {
  const { mode } = useTheme();
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const exampleQuestions = [
    "How many records are there in total?",
    "What is the latest entry?",
    "Can you summarize this data?",
    "Show me any interesting patterns",
  ];

  const handleSubmitPrompt = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/prompts/${tableName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      if (!res.ok) throw new Error('Failed to get response');
      
      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      console.error('Error:', error);
      setResponse('Failed to get response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      sx={{ 
        p: 3, 
        mb: 3, 
        backgroundColor: mode === 'dark' ? 'background.paper' : '#f8f9fa',
      }}
    >
      <Typography variant="h5" gutterBottom color="primary">
        Ask AI About Your Data
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Ask any question about the data in {tableName}. Try these examples:
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {exampleQuestions.map((question, index) => (
          <Chip
            key={index}
            label={question}
            onClick={() => setPrompt(question)}
            sx={{ cursor: 'pointer' }}
            color="primary"
            variant="outlined"
          />
        ))}
      </Box>

      <Stack direction="column" spacing={2}>
        <TextField
          fullWidth
          multiline
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type your question here..."
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'white'
            }
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleSubmitPrompt}
            disabled={loading || !prompt.trim()}
            sx={{ minWidth: '150px' }}
          >
            {loading ? 'Thinking...' : 'Ask AI'}
          </Button>
        </Box>
      </Stack>

      {response && (
        <Box 
          sx={{ 
            mt: 3,
            p: 2.5,
            bgcolor: mode === 'dark' ? 'background.default' : 'white',
            borderRadius: 1,
            boxShadow: 1,
            border: `1px solid ${mode === 'dark' ? '#333' : '#e0e0e0'}`
          }}
        >
          <Typography variant="body1">
            {response}
          </Typography>
        </Box>
      )}
    </Card>
  );
};

interface DataItem {
  [key: string]: any;  // Dynamic fields
}

interface Filter {
  column: string;
  value: string;
}

interface DataTableProps {
  tableName: string;
}

interface PromptSectionProps {
  tableName: string;
}

export const DataTable = ({ tableName }: DataTableProps) => {
  const { toggleTheme, mode } = useTheme();
  const [data, setData] = useState<DataItem[]>([]);
  const [filteredData, setFilteredData] = useState<DataItem[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Filter[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (tableName) {
      setLoading(true);
      setError(null);
      setPage(0);
      setSearchTerm('');
      setFilters([]);
      fetchData();
    }
  }, [tableName]);

  useEffect(() => {
    applyFilters();
  }, [data, searchTerm, filters]);

  const fetchData = async () => {
    try {
      console.log(`Fetching data for table: ${tableName}`);
      const response = await fetch(`http://localhost:4000/api/getdata/${tableName}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Received data:', result);
      
      const items = result.Items || [];
      
      // Dynamically get all unique columns from the data
      if (items.length > 0) {
        const allColumns = Array.from(
          new Set(items.flatMap((item: DataItem) => Object.keys(item)))
        ) as string[];
        setColumns(allColumns);
      }
      
      setData(items);
      setFilteredData(items);
    } catch (err) {
      console.error('Error details:', err);
      setError(`Error fetching data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...data];

    // Apply search term
    if (searchTerm) {
      result = result.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply column filters
    filters.forEach(filter => {
      if (filter.value) {
        result = result.filter(item =>
          String(item[filter.column])
            .toLowerCase()
            .includes(filter.value.toLowerCase())
        );
      }
    });

    setFilteredData(result);
    setPage(0);
  };

  const handleAddFilter = () => {
    setFilters([...filters, { column: columns[0], value: '' }]);
  };

  const handleFilterChange = (index: number, field: 'column' | 'value', value: string) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    setFilters(newFilters);
  };

  const handleRemoveFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined || value === ' ' || value === '') {
      return '-';
    }
    // Format dates
    if (typeof value === 'string' && value.includes(':') && value.includes('-')) {
      return new Date(value).toLocaleString();
    }
    return String(value);
  };

  if (!tableName) return null;
  if (loading) return (
    <div className="flex justify-center p-4">
      <CircularProgress />
    </div>
  );
  if (error) return (
    <div className="text-red-500 p-4 border border-red-200 rounded bg-red-50">
      {error}
    </div>
  );
  if (data.length === 0) return (
    <div className="text-gray-500 p-4 border border-gray-200 rounded bg-gray-50">
      No data available for table: {tableName}
    </div>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3 
      }}>
        <Typography variant="h4" color="primary">
          {tableName} Data Explorer
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={mode === 'dark'}
              onChange={toggleTheme}
              color="primary"
            />
          }
          label={mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
        />
      </Box>

      <PromptSection tableName={tableName} />

      <Paper 
        sx={{ 
          width: '100%', 
          overflow: 'hidden', 
          mb: 3,
          bgcolor: mode === 'dark' ? 'background.paper' : 'background.paper',
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              label="Search all columns"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: '250px' }}
            />
            <Button 
              onClick={() => setShowFilters(!showFilters)}
              variant="outlined"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </Stack>

          <Collapse in={showFilters}>
            <Box sx={{ mt: 2 }}>
              {filters.map((filter, index) => (
                <Stack 
                  key={index} 
                  direction="row" 
                  spacing={2} 
                  mb={1} 
                  alignItems="center"
                >
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Column</InputLabel>
                    <Select
                      value={filter.column}
                      label="Column"
                      onChange={(e) => handleFilterChange(index, 'column', e.target.value)}
                    >
                      {columns.map(column => (
                        <MenuItem key={column} value={column}>{column}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    label="Filter value"
                    value={filter.value}
                    onChange={(e) => handleFilterChange(index, 'value', e.target.value)}
                  />
                  <Button 
                    onClick={() => handleRemoveFilter(index)}
                    color="error"
                    size="small"
                    variant="outlined"
                  >
                    Remove
                  </Button>
                </Stack>
              ))}
              <Button
                variant="outlined"
                onClick={handleAddFilter}
                sx={{ mt: 1 }}
              >
                Add Filter
              </Button>
            </Box>
          </Collapse>
        </Box>

        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }} color="text.secondary">
              Loading data...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        ) : (
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell
                      key={column}
                      sx={{
                        fontWeight: 'bold',
                        backgroundColor: mode === 'dark' ? '#333' : '#f5f5f5',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {column}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, index) => (
                    <TableRow 
                      hover 
                      key={index}
                      sx={{ 
                        '&:nth-of-type(odd)': { 
                          backgroundColor: mode === 'dark' ? '#1a1a1a' : '#fafafa' 
                        }
                      }}
                    >
                      {columns.map((column) => (
                        <TableCell 
                          key={`${index}-${column}`}
                          sx={{ 
                            whiteSpace: 'nowrap',
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {formatValue(row[column])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        <TablePagination
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          sx={{ borderTop: '1px solid #e0e0e0' }}
        />
      </Paper>
    </Box>
  );
};