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
  IconButton,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Button,
} from '@mui/material';

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

export const DataTable = ({ tableName }: DataTableProps) => {
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
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <TextField
            label="Search all columns"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button 
            onClick={() => setShowFilters(!showFilters)}
            variant="outlined"
            size="small"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </Stack>

        {showFilters && (
          <Box sx={{ mb: 2 }}>
            {filters.map((filter, index) => (
              <Stack key={index} direction="row" spacing={2} mb={1}>
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
                >
                  ✕
                </Button>
              </Stack>
            ))}
            <Button
              variant="outlined"
              size="small"
              onClick={handleAddFilter}
              sx={{ mt: 1 }}
            >
              Add Filter
            </Button>
          </Box>
        )}
      </Box>

      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column}
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                    whiteSpace: 'nowrap',
                    padding: '16px 8px'
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
                  sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fafafa' } }}
                >
                  {columns.map((column) => (
                    <TableCell 
                      key={`${index}-${column}`}
                      sx={{ 
                        whiteSpace: 'nowrap',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        padding: '8px'
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
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};