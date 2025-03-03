import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Alert, Spinner, Badge, Button, Modal, Form } from 'react-bootstrap';
import $ from 'jquery';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';
import 'datatables.net-responsive-bs5';
import inventoryService from '../services/inventoryService';
import { toast } from 'react-toastify';

const InventoryList = () => {
  const [inventory, setInventory] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const tableRef = useRef(null);
  const dataTableRef = useRef(null);

  // States for delete operation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // States for edit operation
  const [showEditModal, setShowEditModal] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    mevcut_adet: 0,
    minimum_esik: 0
  });

  // Fetch inventory data
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all inventory data
      const response = await inventoryService.getInventory();
      // Make sure we're setting an array, even if the API returns something else
      const inventoryData = Array.isArray(response.results) ? response.results :
                           (Array.isArray(response) ? response : []);
      setInventory(inventoryData);

      console.log('Inventory data:', inventoryData); // Debug log

      // Get low stock items directly from API
      const lowStockResponse = await inventoryService.getLowStockItems();
      const lowStockData = Array.isArray(lowStockResponse.results) ? lowStockResponse.results :
                          (Array.isArray(lowStockResponse) ? lowStockResponse : []);
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

  useEffect(() => {
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

    // Safety check to ensure inventory is an array before using forEach
    if (!Array.isArray(inventory)) {
      console.error('Inventory is not an array:', inventory);
      return grouped;
    }

    inventory.forEach(item => {
      // Use correct API response fields
      const aircraftType = item.ucak_tipi_adi || item.ucak_tipi_kodu || 'Bilinmeyen';
      const partType = item.parca_tipi_adi || 'Bilinmeyen';

      if (!grouped[aircraftType]) {
        grouped[aircraftType] = {};
      }

      if (!grouped[aircraftType][partType]) {
        grouped[aircraftType][partType] = 0;
      }

      grouped[aircraftType][partType] += item.mevcut_adet;
    });

    return grouped;
  };

  // Check if all parts needed for an aircraft are available
  const checkAircraftCompleteness = (aircraftType, parts) => {
    const requiredParts = ['KANAT', 'GÖVDE', 'KUYRUK', 'AVIYONIK'];
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
  const getStatusBadge = (quantity, threshold) => {
    if (quantity === 0) return 'danger';
    if (quantity < threshold) return 'warning';
    return 'success';
  };

  // Handle delete button click
  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  // Handle edit button click
  const handleEditClick = (item) => {
    setItemToEdit(item);
    setEditFormData({
      mevcut_adet: item.mevcut_adet,
      minimum_esik: item.minimum_esik
    });
    setShowEditModal(true);
  };

  // Confirm delete action
  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setLoading(true);
      await inventoryService.deleteInventoryItem(itemToDelete.id);
      setShowDeleteModal(false);
      setItemToDelete(null);
      toast.success('Parça başarıyla silindi');

      // Refresh data after delete
      fetchData();
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      toast.error('Parça silinirken bir hata oluştu');
      setLoading(false);
    }
  };

  // Handle edit form changes
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: name === 'mevcut_adet' || name === 'minimum_esik' ? parseInt(value, 10) || 0 : value
    });
  };

  // Confirm edit action
  const confirmEdit = async (e) => {
    e.preventDefault();
    if (!itemToEdit) return;

    try {
      setLoading(true);
      await inventoryService.updateInventoryItem(itemToEdit.id, editFormData);
      setShowEditModal(false);
      setItemToEdit(null);
      toast.success('Parça başarıyla güncellendi');

      // Refresh data after update
      fetchData();
    } catch (error) {
      console.error('Error updating inventory item:', error);
      toast.error('Parça güncellenirken bir hata oluştu');
      setLoading(false);
    }
  };

  const groupedInventory = getGroupedInventory();

  // Format date helper function
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Bilinmiyor';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Geçersiz Tarih';
      return date.toLocaleString('tr-TR');
    } catch (e) {
      return 'Geçersiz Tarih';
    }
  };

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
                {item.ucak_tipi_adi || item.ucak_tipi_kodu || '-'} - {item.parca_tipi_adi || '-'}: {item.mevcut_adet} adet (Minimum: {item.minimum_esik})
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
            {Object.keys(groupedInventory).length > 0 ? (
              Object.entries(groupedInventory).map(([aircraftType, parts]) => {
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
              })
            ) : (
              <div className="col-12">
                <Alert variant="info">
                  Montaj durumu bilgisi bulunmamaktadır.
                </Alert>
              </div>
            )}
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
                    <th>Mevcut Adet</th>
                    <th>Minimum Eşik</th>
                    <th>Durum</th>
                    <th>Son Güncelleme</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.length > 0 ? (
                    inventory.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.parca_tipi_adi || '-'}</td>
                        <td>{item.ucak_tipi_adi || item.ucak_tipi_kodu || '-'}</td>
                        <td>{item.mevcut_adet}</td>
                        <td>{item.minimum_esik}</td>
                        <td>
                          <Badge bg={getStatusBadge(item.mevcut_adet, item.minimum_esik)}>
                            {item.mevcut_adet === 0 ? 'Stokta Yok' :
                             item.mevcut_adet < item.minimum_esik ? 'Az Stok' : 'Yeterli'}
                          </Badge>
                        </td>
                        <td>{formatDate(item.son_guncelleme)}</td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditClick(item)}
                          >
                            Düzenle
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteClick(item)}
                          >
                            Sil
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center">
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

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Parça Silme Onayı</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {itemToDelete && (
            <div>
              <p>Aşağıdaki parçayı silmek istediğinize emin misiniz?</p>
              <p>
                <strong>Parça Tipi:</strong> {itemToDelete.parca_tipi_adi || '-'}<br />
                <strong>Uçak Tipi:</strong> {itemToDelete.ucak_tipi_adi || itemToDelete.ucak_tipi_kodu || '-'}<br />
                <strong>Mevcut Adet:</strong> {itemToDelete.mevcut_adet}
              </p>
              <Alert variant="warning">
                Bu işlem geri alınamaz!
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            İptal
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Sil
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Parça Güncelleme</Modal.Title>
        </Modal.Header>
        <Form onSubmit={confirmEdit}>
          <Modal.Body>
            {itemToEdit && (
              <div>
                <p>
                  <strong>Parça Tipi:</strong> {itemToEdit.parca_tipi_adi || '-'}<br />
                  <strong>Uçak Tipi:</strong> {itemToEdit.ucak_tipi_adi || itemToEdit.ucak_tipi_kodu || '-'}
                </p>
                <Form.Group className="mb-3">
                  <Form.Label>Mevcut Adet</Form.Label>
                  <Form.Control
                    type="number"
                    name="mevcut_adet"
                    value={editFormData.mevcut_adet}
                    onChange={handleEditFormChange}
                    min="0"
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Minimum Eşik</Form.Label>
                  <Form.Control
                    type="number"
                    name="minimum_esik"
                    value={editFormData.minimum_esik}
                    onChange={handleEditFormChange}
                    min="0"
                    required
                  />
                </Form.Group>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              İptal
            </Button>
            <Button variant="primary" type="submit">
              Güncelle
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default InventoryList;