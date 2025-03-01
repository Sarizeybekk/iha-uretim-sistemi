import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Button, Table, Modal, Form, Badge } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';

const PartsManagement = ({ user }) => {
  // State variables
  const [parts, setParts] = useState([]);
  const [partTypes, setPartTypes] = useState([]);
  const [aircraftTypes, setAircraftTypes] = useState([]);
  const [durumlar, setDurumlar] = useState([]);
  const [userTeam, setUserTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardStats, setDashboardStats] = useState({
    totalParts: 0,
    partsByType: {},
    partsByAircraft: {}
  });

  const [selectedPart, setSelectedPart] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    parca_tipi: '',
    ucak_tipi: '',
    seri_no: '',
    durum: '',
    notlar: ''
  });

  // API URLs
  const API_URL = 'http://localhost:8001/api';
  const PARTS_URL = `${API_URL}/parts/parcalar/`;
  const PART_TYPES_URL = `${API_URL}/parts/parca-tipleri/`;
  const AIRCRAFT_TYPES_URL = `${API_URL}/parts/ucak-tipleri/`;
  const DURUMLAR_URL = `${API_URL}/parts/durumlar/`;

  // Fetch initial data
  useEffect(() => {
    fetchAllData();
  }, []);

  // Function to fetch all the necessary data
  const fetchAllData = async () => {
    try {
      setLoading(true);

      const [partsResponse, partTypesResponse, aircraftTypesResponse, durumlarResponse] = await Promise.all([
        axios.get(PARTS_URL),
        axios.get(PART_TYPES_URL),
        axios.get(AIRCRAFT_TYPES_URL),
        axios.get(DURUMLAR_URL)
      ]);

      const partsData = partsResponse.data;
      const partTypesData = partTypesResponse.data;
      const aircraftTypesData = aircraftTypesResponse.data;
      const durumlarData = durumlarResponse.data;

      setParts(partsData);
      setPartTypes(partTypesData);
      setAircraftTypes(aircraftTypesData);
      setDurumlar(durumlarData);

      calculateDashboardStats(partsData, partTypesData, aircraftTypesData);

      setDashboardStats(prevStats => ({
        ...prevStats,
        totalParts: partsData.length || 0
      }));

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Veriler yüklenirken bir hata oluştu.');
      toast.error('Veriler yüklenirken bir hata oluştu.');
      setLoading(false);
    }
  };

  // Calculate dashboard statistics
  const calculateDashboardStats = (partsData, partTypesData, aircraftTypesData) => {
    if (!partsData || !partTypesData || !aircraftTypesData) return;

    const totalParts = partsData.length;

    const partsByType = {};
    partTypesData.forEach(type => {
      partsByType[type.ad] = 0;
    });

    partsData.forEach(part => {
      if (part.parca_tipi && part.parca_tipi.ad) {
        partsByType[part.parca_tipi.ad] = (partsByType[part.parca_tipi.ad] || 0) + 1;
      }
    });

    const partsByAircraft = {};
    aircraftTypesData.forEach(type => {
      partsByAircraft[type.ad] = 0;
    });

    partsData.forEach(part => {
      const aircraftType = aircraftTypesData.find(type => type.id === part.ucak_tipi);
      if (aircraftType) {
        partsByAircraft[aircraftType.ad] = (partsByAircraft[aircraftType.ad] || 0) + 1;
      }
    });

    setDashboardStats({
      totalParts,
      partsByType,
      partsByAircraft
    });
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submit for adding a new part
  const handleAddPart = async () => {
    try {
      setLoading(true);
      const response = await axios.post(PARTS_URL, formData);

      if (response.status === 201) {
        toast.success('Parça başarıyla eklendi');
        setShowAddModal(false);
        fetchAllData();
      }
    } catch (error) {
      console.error('Error adding part:', error);
      toast.error('Parça eklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submit for editing a part
  const handleEditPart = async () => {
    try {
      setLoading(true);
      const response = await axios.put(`${PARTS_URL}${selectedPart.id}/`, formData);

      if (response.status === 200) {
        toast.success('Parça başarıyla güncellendi');
        setShowEditModal(false);
        fetchAllData();
      }
    } catch (error) {
      console.error('Error updating part:', error);
      toast.error('Parça güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Handle part deletion
  const handleDeletePart = async (partId) => {
    if (window.confirm('Bu parçayı silmek istediğinizden emin misiniz?')) {
      try {
        setLoading(true);
        const response = await axios.delete(`${PARTS_URL}${partId}/`);

        if (response.status === 204) {
          toast.success('Parça başarıyla silindi');
          fetchAllData();
        }
      } catch (error) {
        console.error('Error deleting part:', error);
        toast.error('Parça silinirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    }
  };

  // Open edit modal and set selected part
  const openEditModal = (part) => {
    setSelectedPart(part);
    setFormData({
      parca_tipi: part.parca_tipi?.id || '',
      ucak_tipi: part.ucak_tipi || '',
      seri_no: part.seri_no || '',
      durum: part.durum?.id || '',
      notlar: part.notlar || ''
    });
    setShowEditModal(true);
  };

  // Get aircraft type name from id
  const getAircraftTypeName = (id) => {
    const aircraft = aircraftTypes.find(type => type.id === id);
    return aircraft ? aircraft.ad : '-';
  };

  // Get status badge color based on status
  const getStatusBadgeColor = (statusName) => {
    switch (statusName?.toUpperCase()) {
      case 'KULLANILIYOR': return 'success';
      case 'ARIZA': return 'danger';
      case 'BAKIM': return 'warning';
      case 'STOKTA': return 'info';
      default: return 'secondary';
    }
  };

  // Get part type badge color
  const getPartTypeBadgeColor = (typeName) => {
    switch (typeName?.toUpperCase()) {
      case 'KANAT': return 'primary';
      case 'GÖVDE': return 'info';
      case 'AVIYONIK': return 'success';
      case 'MOTOR': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <Container fluid className="parts-management-container py-4">
      {/* Header section */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="page-title">Parça Yönetimi</h2>
              <p className="text-muted">
                {userTeam ? (
                  <>Takım: <span className="fw-bold">{userTeam.takim?.name}</span> ({userTeam.takim?.takim_tipi})</>
                ) : (
                  'Henüz bir takıma atanmamışsınız.'
                )}
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                setFormData({
                  parca_tipi: '',
                  ucak_tipi: '',
                  seri_no: '',
                  durum: '',
                  notlar: ''
                });
                setShowAddModal(true);
              }}
            >
              <i className="bi bi-plus-circle me-2"></i> Yeni Parça Ekle
            </Button>
          </div>
        </Col>
      </Row>

      {/* Error message */}
      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger">{error}</Alert>
          </Col>
        </Row>
      )}

      {/* Dashboard Stats Cards */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Yükleniyor...</span>
          </Spinner>
          <p className="mt-3 text-muted">Veriler yükleniyor...</p>
        </div>
      ) : (
        <>
          <Row className="mb-4">
            <Col md={4} sm={6} className="mb-3">
              <Card className="stats-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="stats-title text-muted">Toplam Parça</h6>
                      <h3 className="stats-value">{dashboardStats.totalParts}</h3>
                    </div>
                    <div className="stats-icon">
                      <i className="bi bi-boxes"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4} sm={6} className="mb-3">
              <Card className="stats-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="stats-title text-muted">Parça Çeşidi</h6>
                      <h3 className="stats-value">{partTypes.length}</h3>
                    </div>
                    <div className="stats-icon">
                      <i className="bi bi-grid-3x3"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4} sm={6} className="mb-3">
              <Card className="stats-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="stats-title text-muted">Uçak Çeşidi</h6>
                      <h3 className="stats-value">{aircraftTypes.length}</h3>
                    </div>
                    <div className="stats-icon">
                      <i className="bi bi-airplane"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Parts Table */}
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Parça Listesi</h5>
              <Form.Group className="mb-0 search-container" style={{ width: '300px' }}>
                <Form.Control
                  type="text"
                  placeholder="Parça ara..."
                  className="search-input"
                />
              </Form.Group>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Seri No</th>
                      <th>Parça Tipi</th>
                      <th>Uçak Tipi</th>
                      <th>Durum</th>
                      <th>Üretim Tarihi</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parts.length > 0 ? (
                      parts.map((part) => (
                        <tr key={part.id}>
                          <td>{part.id}</td>
                          <td>{part.seri_no}</td>
                          <td>
                            <Badge bg={getPartTypeBadgeColor(part.parca_tipi?.ad)}>
                              {part.parca_tipi ? part.parca_tipi.ad : '-'}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg="info">
                              {getAircraftTypeName(part.ucak_tipi)}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={getStatusBadgeColor(part.durum?.ad)}>
                              {part.durum ? part.durum.ad : '-'}
                            </Badge>
                          </td>
                          <td>{new Date(part.uretim_tarihi).toLocaleDateString('tr-TR')}</td>
                          <td>
                            <Button
                              variant="outline-warning"
                              size="sm"
                              className="me-2"
                              onClick={() => openEditModal(part)}
                            >
                              <i className="bi bi-pencil"></i>
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeletePart(part.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-3">
                          Henüz parça eklenmemiş.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </>
      )}

      {/* Add Part Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Yeni Parça Ekle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Parça Tipi</Form.Label>
                  <Form.Select
                    name="parca_tipi"
                    value={formData.parca_tipi}
                    onChange={handleInputChange}
                  >
                    <option value="">Seçiniz</option>
                    {partTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.ad}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Uçak Tipi</Form.Label>
                  <Form.Select
                    name="ucak_tipi"
                    value={formData.ucak_tipi}
                    onChange={handleInputChange}
                  >
                    <option value="">Seçiniz</option>
                    {aircraftTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.ad}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Seri No</Form.Label>
                  <Form.Control
                    type="text"
                    name="seri_no"
                    value={formData.seri_no}
                    onChange={handleInputChange}
                    placeholder="Seri No giriniz"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Durum</Form.Label>
                  <Form.Select
                    name="durum"
                    value={formData.durum}
                    onChange={handleInputChange}
                  >
                    <option value="">Seçiniz</option>
                    {durumlar.map(durum => (
                      <option key={durum.id} value={durum.id}>
                        {durum.ad}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Notlar</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notlar"
                value={formData.notlar}
                onChange={handleInputChange}
                placeholder="Parça hakkında notlar"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            İptal
          </Button>
          <Button variant="primary" onClick={handleAddPart}>
            Ekle
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Part Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Parça Düzenle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Parça Tipi</Form.Label>
                  <Form.Select
                    name="parca_tipi"
                    value={formData.parca_tipi}
                    onChange={handleInputChange}
                  >
                    <option value="">Seçiniz</option>
                    {partTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.ad}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Uçak Tipi</Form.Label>
                  <Form.Select
                    name="ucak_tipi"
                    value={formData.ucak_tipi}
                    onChange={handleInputChange}
                  >
                    <option value="">Seçiniz</option>
                    {aircraftTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.ad}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Seri No</Form.Label>
                  <Form.Control
                    type="text"
                    name="seri_no"
                    value={formData.seri_no}
                    onChange={handleInputChange}
                    placeholder="Seri No giriniz"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Durum</Form.Label>
                  <Form.Select
                    name="durum"
                    value={formData.durum}
                    onChange={handleInputChange}
                  >
                    <option value="">Seçiniz</option>
                    {durumlar.map(durum => (
                      <option key={durum.id} value={durum.id}>
                        {durum.ad}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Notlar</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notlar"
                value={formData.notlar}
                onChange={handleInputChange}
                placeholder="Parça hakkında notlar"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            İptal
          </Button>
          <Button variant="primary" onClick={handleEditPart}>
            Güncelle
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PartsManagement;