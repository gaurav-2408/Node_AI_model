import { DataTable } from '../components/DataTable';

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Data Overview</h1>
      <DataTable tableName="BU_SOURCE_1_HOTSPOT_MASTER" />
    </div>
  );
}