import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminFeeLedgerPage = () => {
  return <Navigate to="/admin/finance?tab=fees" replace />;
};

export default AdminFeeLedgerPage;
