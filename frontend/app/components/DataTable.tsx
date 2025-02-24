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
} from '@mui/material';

interface DataItem {
  SF_EXECUTION_ID: string;
  TMF_SO_SERVICEORDERITEMID: string;
  ROOTSERVICE_ID: string;
  HOTSPOT_TETHERING_VALUE: string;
  SUPI: string;
  SUBSCRIBER_ID: string;
  CREATEDDATE: string;
  GPSI: string;
  ORDER_ID: string;
  SERVICEINVENTORY_ID: string;
  STATUS: string;
  ICCID: string;
  CORRELATION_ID: string;
  ID: string;
  CUSTOMER_ID: string;
  TMF_STATE: string;
  LASTMODIFIEDDATE: string;
}

// Updated column configuration with better ordering and formatting
const columnConfig = [
  { id: 'ORDER_ID', label: 'Order ID' },
  { id: 'CUSTOMER_ID', label: 'Customer ID' },
  { id: 'SUBSCRIBER_ID', label: 'Subscriber ID' },
  { id: 'STATUS', label: 'Status' },
  { id: 'TMF_STATE', label: 'TMF State' },
  { id: 'ICCID', label: 'ICCID' },
  { id: 'SUPI', label: 'SUPI' },
  { id: 'GPSI', label: 'GPSI' },
  { id: 'ROOTSERVICE_ID', label: 'Root Service ID' },
  { id: 'TMF_SO_SERVICEORDERITEMID', label: 'Service Order Item ID' },
  { id: 'CREATEDDATE', label: 'Created Date' },
  { id: 'LASTMODIFIEDDATE', label: 'Last Modified' }
];

interface DataTableProps {
  tableName: string;
}

export const DataTable = ({ tableName }: DataTableProps) => {
  const [data, setData] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchData();
  }, [tableName]);

  const fetchData = async () => {
    try {
      console.log(`Fetching data for table: ${tableName}`);
      const response = await fetch(`http://localhost:4000/api/getdata/${tableName}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log('Received data:', result);
      
      setData(result.Items || []);
      setLoading(false);
    } catch (err) {
      console.error('Error details:', err);
      setError(`Error fetching data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
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
    if (value.includes(':') && value.includes('-')) {
      return new Date(value).toLocaleString();
    }
    return value;
  };

  if (loading) return <CircularProgress />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (data.length === 0) return <div>No data available</div>;

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columnConfig.map((column) => (
                <TableCell
                  key={column.id}
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                    whiteSpace: 'nowrap',
                    padding: '16px 8px'
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => (
                <TableRow 
                  hover 
                  key={row.ID || index}
                  sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fafafa' } }}
                >
                  {columnConfig.map((column) => (
                    <TableCell 
                      key={`${row.ID || index}-${column.id}`}
                      sx={{ 
                        whiteSpace: 'nowrap',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        padding: '8px'
                      }}
                    >
                      {formatValue(row[column.id as keyof DataItem])}
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
        count={data.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};