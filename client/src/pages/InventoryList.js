
import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Alert, Spinner, Badge } from 'react-bootstrap';
import $ from 'jquery';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';
import 'datatables.net-responsive-bs5';
import { getInventory, getLowStockItems } from '../services/apiService';
import { toast } from 'react-toastify';

const InventoryList = () => {
  const [inventory, setInventory] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const tableRef = useRef(null);
  const dataTableRef = useRef(null);

  // Fetch inventory data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [inventoryData, lowStockData] = await Promise.all([
          getInventory(),
          getLowStockItems()
        ]);

        setInventory(inventoryData);
        setLowStockItems(lowStockData);

        // Initialize DataTable
        setTimeout(() => {
          if (tableRef.current) {
            if (dataTableRef.current) {
              dataTableRef.current.destroy();
            }

            dataTableRef.current = $(tableRef.current).DataTable({
              responsive: true,
              language: {
                url: '//cdn.datatables.net/plug-ins/1.13.4/i18n/tr.json',
              }
            });
          }
          setLoading(false);
        }, 0);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        setError('Envanter yüklenirken bir hata oluştu.');
        toast.error('Envanter yüklenirken bir hata oluştu.');
        setLoading(false);
      }
    };

    fetchData();

    // Cleanup DataTable when component unmounts
    return () => {
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
        dataTableRef.current = null;
      }
    };
  }, []);

  // Group inventory by aircraft type and part type
  const getGroupedInventory = () => {
    const grouped = {};

    inventory.forEach(item => {
      const aircraftType = item.ucak_tipi ? item.ucak_tipi.name : 'Bilinmeyen';
      const partType = item.parca_tipi ? item.parca_tipi.name : 'Bilinmeyen';

      if (!grouped[aircraftType]) {
        grouped[aircraftType] = {};
      }

      if (!grouped[aircraftType][partType]) {
        grouped[aircraftType][partType] = 0;
      }

      grouped[aircraftType][partType] += item.miktar;
    });

    return grouped;
  };

  // Check if all parts needed for an aircraft are available
  const checkAircraftCompleteness = (aircraftType, parts) => {
    const requiredParts = ['Kanat', 'Gövde', 'Kuyruk', 'Aviyonik'];
    const missingParts = [];

    requiredParts.forEach(part => {
      if (!parts[part] || parts[part] < 1) {
        missingParts.push(part);
      }
    });

    return {
      complete: missingParts.length === 0,
      missingParts
    };
  };

  // Get status badge color
  const getStatusBadge = (quantity) => {
    if (quantity === 0) return 'danger';
    if (quantity < 3) return 'warning';
    return 'success';
  };

  const groupedInventory = getGroupedInventory();

  return (
    <Container className="inventory-container">
      <h2 className="mb-4">Envanter Durumu</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Low Stock Warning */}
      {lowStockItems.length > 0 && (
        <Alert variant="warning" className="mb-4">
          <h5>Düşük Stok Uyarısı</h5>
          <p>Aşağıdaki parçaların stok seviyesi kritik seviyenin altında:</p>
          <ul className="mb-0">
            {lowStockItems.map((item, index) => (
              <li key={index}>
                {item.ucak_tipi.name} - {item.parca_tipi.name}: {item.miktar} adet
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Aircraft Status Summary */}
      <Card className="mb-4">
        <Card.Header>Uçak Montaj Durumları</Card.Header>
        <Card.Body>
          <div className="row">
            {Object.entries(groupedInventory).map(([aircraftType, parts]) => {
              const { complete, missingParts } = checkAircraftCompleteness(aircraftType, parts);
              return (
                <div key={aircraftType} className="col-md-6 col-lg-3 mb-3">
                  <Card className="h-100">
                    <Card.Header className={complete ? 'bg-success text-white' : 'bg-warning'}>
                      {aircraftType}
                    </Card.Header>
                    <Card.Body>
                      {complete ? (
                        <Alert variant="success" className="mb-0">
                          Tüm parçalar mevcut! Montaja hazır.
                        </Alert>
                      ) : (
                        <Alert variant="warning" className="mb-0">
                          <div>Eksik Parçalar:</div>
                          <ul className="mb-0 ps-3">
                            {missingParts.map(part => (
                              <li key={part}>{part}</li>
                            ))}
                          </ul>
                        </Alert>
                      )}
                    </Card.Body>
                  </Card>
                </div>
              );
            })}
          </div>
        </Card.Body>
      </Card>

      {/* Detailed Inventory Table */}
      <Card>
        <Card.Header>Parça Envanteri</Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Yükleniyor...</span>
              </Spinner>
            </div>
          ) : (
            <div className="table-responsive">
              <table ref={tableRef} className="table table-striped table-bordered dt-responsive nowrap">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Parça Tipi</th>
                    <th>Uçak Tipi</th>
                    <th>Miktar</th>
                    <th>Durum</th>
                    <th>Üretim Takımı</th>
                    <th>Son Güncelleme</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.length > 0 ? (
                    inventory.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.parca_tipi ? item.parca_tipi.name : '-'}</td>
                        <td>{item.ucak_tipi ? item.ucak_tipi.name : '-'}</td>
                        <td>{item.miktar}</td>
                        <td>
                          <Badge bg={getStatusBadge(item.miktar)}>
                            {item.miktar === 0 ? 'Stokta Yok' : item.miktar < 3 ? 'Az Stok' : 'Yeterli'}
                          </Badge>
                        </td>
                        <td>{item.takim ? item.takim.name : '-'}</td>
                        <td>{new Date(item.updated_at).toLocaleString('tr-TR')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center">
                        Henüz envanter kaydı bulunmamaktadır.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default InventoryList;