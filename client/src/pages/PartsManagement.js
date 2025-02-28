import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal, Alert, Spinner, Badge, Tabs, Tab, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import $ from 'jquery';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';
import 'datatables.net-responsive-bs5';
import 'datatables.net-buttons-bs5';
import 'datatables.net-buttons/js/buttons.html5.js';
import 'datatables.net-buttons/js/buttons.print.js';
import { getParts, createPart, updatePart, recyclePartAPI, getPartTypes, getAircraftTypes, getUserTeams } from '../services/apiService';
import Swal from 'sweetalert2';
import '../styles/PartsManagement.css';

// Validation schema for part form
const partValidationSchema = Yup.object().shape({
  parca_tipi: Yup.number().required('Parça tipi seçilmelidir'),
  ucak_tipi: Yup.number().required('Uçak tipi seçilmelidir'),
  miktar: Yup.number()
    .required('Miktar gereklidir')
    .positive('Miktar pozitif olmalıdır')
    .integer('Miktar tam sayı olmalıdır')
});

const PartsManagement = ({ user }) => {
  const [parts, setParts] = useState([]);
  const [partTypes, setPartTypes] = useState([]);
  const [aircraftTypes, setAircraftTypes] = useState([]);
  const [userTeam, setUserTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentPart, setCurrentPart] = useState(null);
  const [viewMode, setViewMode] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dashboardStats, setDashboardStats] = useState({
    totalParts: 0,
    partsCreatedToday: 0,
    partsByType: {},
    partsByAircraft: {}
  });
  
  const tableRef = useRef(null);
  const dataTableRef = useRef(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [partsData, partTypesData, aircraftTypesData, userTeamsData] = await Promise.all([
          getParts(),
          getPartTypes(),
          getAircraftTypes(),
          getUserTeams()
        ]);

        setParts(partsData);
        setPartTypes(partTypesData);
        setAircraftTypes(aircraftTypesData);

        // Calculate dashboard stats
        calculateDashboardStats(partsData, partTypesData, aircraftTypesData);

        // Set user's team if available
        if (userTeamsData && userTeamsData.length > 0) {
          setUserTeam(userTeamsData[0]);
        }

        // Initialize DataTable with a small delay to ensure DOM is ready
        setTimeout(() => {
          initializeDataTable();
          setLoading(false);
        }, 100);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Veriler yüklenirken bir hata oluştu.');
        toast.error('Veriler yüklenirken bir hata oluştu.');
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

  // Calculate dashboard statistics
  const calculateDashboardStats = (partsData, partTypesData, aircraftTypesData) => {
    // Total parts count (sum of quantities)
    const totalParts = partsData.reduce((sum, part) => sum + part.miktar, 0);
    
    // Parts created today
    const today = new Date().toDateString();
    const partsCreatedToday = partsData.filter(part => 
      new Date(part.created_at).toDateString() === today
    ).length;
    
    // Parts by type
    const partsByType = {};
    partTypesData.forEach(type => {
      partsByType[type.name] = 0;
    });
    
    partsData.forEach(part => {
      if (part.parca_tipi && part.parca_tipi.name) {
        partsByType[part.parca_tipi.name] = (partsByType[part.parca_tipi.name] || 0) + part.miktar;
      }
    });
    
    // Parts by aircraft type
    const partsByAircraft = {};
    aircraftTypesData.forEach(type => {
      partsByAircraft[type.name] = 0;
    });
    
    partsData.forEach(part => {
      if (part.ucak_tipi && part.ucak_tipi.name) {
        partsByAircraft[part.ucak_tipi.name] = (partsByAircraft[part.ucak_tipi.name] || 0) + part.miktar;
      }
    });
    
    setDashboardStats({
      totalParts,
      partsCreatedToday,
      partsByType,
      partsByAircraft
    });
  };

  // Initialize DataTable
  const initializeDataTable = () => {
    if (tableRef.current) {
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
      }

      dataTableRef.current = $(tableRef.current).DataTable({
        responsive: true,
        language: {
          url: '//cdn.datatables.net/plug-ins/1.13.4/i18n/tr.json',
        },
        dom: 'Bfrtip',
        buttons: [
          {
            extend: 'excel',
            text: 'Excel\'e Aktar',
            className: 'btn btn-sm btn-success me-2',
            exportOptions: {
              columns: [0, 1, 2, 3, 4, 5]
            }
          },
          {
            extend: 'print',
            text: 'Yazdır',
            className: 'btn btn-sm btn-info',
            exportOptions: {
              columns: [0, 1, 2, 3, 4, 5]
            }
          }
        ],
        order: [[0, 'desc']]
      });
    }
  };

  // Filter parts based on view mode
  const getFilteredParts = () => {
    let filtered = [...parts];
    
    // Filter by view mode
    if (viewMode === 'team' && userTeam) {
      filtered = filtered.filter(part => 
        part.takim && part.takim.id === userTeam.takim.id
      );
    } else if (viewMode === 'my-type' && userTeam) {
      filtered = filtered.filter(part => 
        part.parca_tipi && part.parca_tipi.name === userTeam.takim.takim_tipi
      );
    }
    
    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(part => 
        (part.parca_tipi && part.parca_tipi.name.toLowerCase().includes(search)) ||
        (part.ucak_tipi && part.ucak_tipi.name.toLowerCase().includes(search)) ||
        (part.takim && part.takim.name.toLowerCase().includes(search)) ||
        String(part.id).includes(search)
      );
    }
    
    return filtered;
  };

  // Handle form submission for creating/updating parts
  const handleSubmitPart = async (values, { setSubmitting, resetForm }) => {
    try {
      // Add team information to the part data
      const partData = {
        ...values,
        takim: userTeam ? userTeam.takim.id : null
      };

      let result;
      if (currentPart) {
        // Update existing part
        result = await updatePart(currentPart.id, partData);
        toast.success('Parça başarıyla güncellendi!');
      } else {
        // Create new part
        result = await createPart(partData);
        toast.success('Parça başarıyla oluşturuldu!');
      }

      setShowModal(false);
      resetForm();

      // Refresh parts list
      const updatedParts = await getParts();
      setParts(updatedParts);
      
      // Update dashboard stats
      calculateDashboardStats(updatedParts, partTypes, aircraftTypes);

      // Refresh DataTable
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
      }

      setTimeout(() => {
        initializeDataTable();
      }, 100);
    } catch (error) {
      console.error('Error submitting part:', error);
      let errorMessage = 'Parça kaydedilirken bir hata oluştu.';

      if (error.response && error.response.data) {
        // Extract error message from API response
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (typeof error.response.data === 'object') {
          const firstError = Object.values(error.response.data)[0];
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0];
          } else if (typeof firstError === 'string') {
            errorMessage = firstError;
          }
        }
      }

      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle part recycling (deletion)
  const handleRecyclePart = async (partId) => {
    // Confirm recycling with SweetAlert2
    const result = await Swal.fire({
      title: 'Emin misiniz?',
      text: 'Bu parça geri dönüşüme gönderilecek.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Evet, geri dönüşüme gönder!',
      cancelButtonText: 'İptal'
    });

    if (result.isConfirmed) {
      try {
        await recyclePartAPI(partId);
        toast.success('Parça başarıyla geri dönüşüme gönderildi!');

        // Refresh parts list
        const updatedParts = await getParts();
        setParts(updatedParts);
        
        // Update dashboard stats
        calculateDashboardStats(updatedParts, partTypes, aircraftTypes);

        // Refresh DataTable
        if (dataTableRef.current) {
          dataTableRef.current.destroy();
        }

        setTimeout(() => {
          initializeDataTable();
        }, 100);
      } catch (error) {
        console.error('Error recycling part:', error);
        toast.error('Parça geri dönüşüme gönderilirken bir hata oluştu.');
      }
    }
  };

  // Open modal for creating/editing a part
  const openPartModal = (part = null) => {
    setCurrentPart(part);
    setShowModal(true);
  };

  // Check if user can create parts based on team type
  const canCreateParts = () => {
    return userTeam && userTeam.takim.takim_tipi !== 'Montaj';
  };

  // Get the allowed part type ID based on user's team
  const getAllowedPartTypeId = () => {
    if (!userTeam || !partTypes.length) return '';

    const userTeamType = userTeam.takim.takim_tipi;
    const matchingPartType = partTypes.find(type => type.name === userTeamType);

    return matchingPartType ? matchingPartType.id : '';
  };

  // Get badge variant based on part type
  const getPartTypeBadgeVariant = (partTypeName) => {
    switch (partTypeName?.toLowerCase()) {
      case 'kanat': return 'primary';
      case 'gövde': return 'success';
      case 'kuyruk': return 'info';
      case 'aviyonik': return 'warning';
      default: return 'secondary';
    }
  };

  // Get badge variant based on aircraft type
  const getAircraftTypeBadgeVariant = (aircraftTypeName) => {
    switch (aircraftTypeName?.toUpperCase()) {
      case 'TB2': return 'primary';
      case 'TB3': return 'success';
      case 'AKINCI': return 'danger';
      case 'KIZILELMA': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <Container fluid className="parts-management-container py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="page-title">Parça Yönetimi</h2>
              <p className="text-muted">
                {userTeam ? (
                  <>Takım: <span className="fw-bold">{userTeam.takim.name}</span> ({userTeam.takim.takim_tipi})</>
                ) : (
                  'Henüz bir takıma atanmamışsınız.'
                )}
              </p>
            </div>
            
            {canCreateParts() && (
              <Button 
                variant="primary" 
                className="create-part-btn"
                onClick={() => openPartModal()}
              >
                <i className="bi bi-plus-circle me-2"></i> Yeni Parça Oluştur
              </Button>
            )}
          </div>
        </Col>
      </Row>

      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger">{error}</Alert>
          </Col>
        </Row>
      )}

      {/* Dashboard Stats Cards */}
      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3">
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
        
        <Col md={3} sm={6} className="mb-3">
          <Card className="stats-card">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="stats-title text-muted">Bugün Oluşturulan</h6>
                  <h3 className="stats-value">{dashboardStats.partsCreatedToday}</h3>
                </div>
                <div className="stats-icon">
                  <i className="bi bi-calendar-check"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} sm={6} className="mb-3">
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
        
        <Col md={3} sm={6} className="mb-3">
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

      {/* Filters and Search */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6} className="mb-3 mb-md-0">
              <div className="btn-group view-filter-group" role="group">
                <Button 
                  variant={viewMode === 'all' ? 'primary' : 'outline-primary'} 
                  onClick={() => setViewMode('all')}
                >
                  Tüm Parçalar
                </Button>
                <Button 
                  variant={viewMode === 'team' ? 'primary' : 'outline-primary'} 
                  onClick={() => setViewMode('team')}
                >
                  Takım Parçaları
                </Button>
                <Button 
                  variant={viewMode === 'my-type' ? 'primary' : 'outline-primary'} 
                  onClick={() => setViewMode('my-type')}
                >
                  {userTeam?.takim.takim_tipi || 'Tip'} Parçaları
                </Button>
              </div>
            </Col>
            <Col md={6}>
              <div className="search-container">
                <input
                  type="text"
                  className="form-control search-input"
                  placeholder="Parça ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="search-icon">
                  <i className="bi bi-search"></i>
                </span>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Parts Table */}
      <Card className="mb-4 parts-table-card">
        <Card.Header>
          <span>Parça Listesi</span>
          <Badge bg="info" className="ms-2">{getFilteredParts().length} parça</Badge>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">Yükleniyor...</span>
              </Spinner>
              <p className="mt-3 text-muted">Parçalar yükleniyor...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table ref={tableRef} className="table table-striped table-hover parts-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Parça Tipi</th>
                    <th>Uçak Tipi</th>
                    <th>Miktar</th>
                    <th>Takım</th>
                    <th>Oluşturulma Tarihi</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredParts().length > 0 ? (
                    getFilteredParts().map((part) => (
                      <tr key={part.id} className="part-row">
                        <td>{part.id}</td>
                        <td>
                          <Badge 
                            bg={getPartTypeBadgeVariant(part.parca_tipi?.name)} 
                            className="part-type-badge"
                          >
                            {part.parca_tipi ? part.parca_tipi.name : '-'}
                          </Badge>
                        </td>
                        <td>
                          <Badge 
                            bg={getAircraftTypeBadgeVariant(part.ucak_tipi?.name)} 
                            className="aircraft-type-badge"
                          >
                            {part.ucak_tipi ? part.ucak_tipi.name : '-'}
                          </Badge>
                        </td>
                        <td>
                          <span className="fw-bold">{part.miktar}</span> adet
                        </td>
                        <td>
                          {part.takim ? (
                            <OverlayTrigger
                              placement="top"
                              overlay={
                                <Tooltip>
                                  {part.takim.takim_tipi} takımı
                                </Tooltip>
                              }
                            >
                              <span className="team-name">{part.takim.name}</span>
                            </OverlayTrigger>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <div className="date-cell">
                            <span className="date-value">
                              {new Date(part.created_at).toLocaleDateString('tr-TR')}
                            </span>
                            <small className="text-muted d-block">
                              {new Date(part.created_at).toLocaleTimeString('tr-TR')}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Düzenle</Tooltip>}
                            >
                              <Button
                                variant="outline-warning"
                                size="sm"
                                className="action-button me-2"
                                onClick={() => openPartModal(part)}
                              >
                                <i className="bi bi-pencil"></i>
                              </Button>
                            </OverlayTrigger>
                            
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Geri Dönüşüm</Tooltip>}
                            >
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="action-button"
                                onClick={() => handleRecyclePart(part.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </Button>
                            </OverlayTrigger>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        <div className="empty-state">
                          <i className="bi bi-inbox large-icon"></i>
                          <p>Görüntülenecek parça bulunamadı.</p>
                          {viewMode !== 'all' && (
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => setViewMode('all')}
                            >
                              Tüm parçaları göster
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Part Distribution Charts */}
      <Row className="mb-4">
        <Col md={6} className="mb-4 mb-md-0">
          <Card className="h-100">
            <Card.Header>Parça Tiplerine Göre Dağılım</Card.Header>
            <Card.Body>
              <div className="distribution-chart">
                {Object.entries(dashboardStats.partsByType).map(([type, count]) => (
                  <div key={type} className="distribution-item mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="distribution-label">{type}</span>
                      <span className="distribution-value">{count} adet</span>
                    </div>
                    <div className="progress">
                      <div 
                        className={`progress-bar bg-${getPartTypeBadgeVariant(type)}`} 
                        role="progressbar" 
                        style={{ 
                          width: `${Math.min(100, (count / dashboardStats.totalParts) * 100)}%` 
                        }}
                        aria-valuenow={count} 
                        aria-valuemin="0" 
                        aria-valuemax={dashboardStats.totalParts}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>Uçak Tiplerine Göre Dağılım</Card.Header>
            <Card.Body>
              <div className="distribution-chart">
                {Object.entries(dashboardStats.partsByAircraft).map(([type, count]) => (
                  <div key={type} className="distribution-item mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="distribution-label">{type}</span>
                      <span className="distribution-value">{count} adet</span>
                    </div>
                    <div className="progress">
                      <div 
                        className={`progress-bar bg-${getAircraftTypeBadgeVariant(type)}`} 
                        role="progressbar" 
                        style={{ 
                          width: `${Math.min(100, (count / dashboardStats.totalParts) * 100)}%` 
                        }}
                        aria-valuenow={count} 
                        aria-valuemin="0" 
                        aria-valuemax={dashboardStats.totalParts}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Part Create/Edit Modal */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)} 
        backdrop="static"
        size="lg"
        centered
        className="part-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {currentPart ? (
              <>
                <i className="bi bi-pencil-square me-2"></i>
                Parça Düzenle
              </>
            ) : (
              <>
                <i className="bi bi-plus-square me-2"></i>
                Yeni Parça Oluştur
              </>
            )}
          </Modal.Title>
        </Modal.Header>
        <Formik
          initialValues={{
            parca_tipi: currentPart ? currentPart.parca_tipi.id : getAllowedPartTypeId(),
            ucak_tipi: currentPart ? currentPart.ucak_tipi.id : '',
            miktar: currentPart ? currentPart.miktar : 1
          }}
          validationSchema={partValidationSchema}
          onSubmit={handleSubmitPart}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            handleSubmit,
            isSubmitting,
            setFieldValue
          }) => (
            <Form onSubmit={handleSubmit}>
              <Modal.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Parça Tipi</Form.Label>
                      <Form.Select
                        name="parca_tipi"
                        value={values.parca_tipi}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.parca_tipi && errors.parca_tipi}
                        disabled={getAllowedPartTypeId() !== ''}
                        className="form-select-lg"
                      >
                        <option value="">Seçiniz</option>
                        {partTypes.map(type => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.parca_tipi}
                      </Form.Control.Feedback>
                      {getAllowedPartTypeId() !== '' && (
                        <Form.Text className="text-info">
                          <i className="bi bi-info-circle me-1"></i>
                          {userTeam.takim.takim_tipi} takımı olduğunuz için sadece bu tür parça üretebilirsiniz.
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Uçak Tipi</Form.Label>
                      <Form.Select
                        name="ucak_tipi"
                        value={values.ucak_tipi}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.ucak_tipi && errors.ucak_tipi}
                        className="form-select-lg"
                      >
                        <option value="">Seçiniz</option>
                        {aircraftTypes.map(type => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.ucak_tipi}
                      </Form.Control.Feedback>
                    </Form.Group>
              </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Miktar</Form.Label>
                      <div className="quantity-input-group">
                        <Button
                          variant="outline-secondary"
                          onClick={() => {
                            if (values.miktar > 1) {
                              setFieldValue('miktar', Number(values.miktar) - 1);
                            }
                          }}
                          type="button"
                        >
                          -
                        </Button>
                        <Form.Control
                          type="number"
                          name="miktar"
                          value={values.miktar}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.miktar && errors.miktar}
                          min="1"
                          className="text-center"
                        />
                        <Button
                          variant="outline-secondary"
                          onClick={() => {
                            setFieldValue('miktar', Number(values.miktar) + 1);
                          }}
                          type="button"
                        >
                          +
                        </Button>
                      </div>
                      <Form.Control.Feedback type="invalid">
                        {errors.miktar}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Takım</Form.Label>
                      <div className="form-control-plaintext team-display">
                        {userTeam ? (
                          <Badge bg="primary" className="team-badge">
                            {userTeam.takim.name} ({userTeam.takim.takim_tipi})
                          </Badge>
                        ) : (
                          <span className="text-muted">Takım atanmamış</span>
                        )}
                      </div>
                      <Form.Text className="text-muted">
                        Parça, mevcut takımınıza atanacaktır.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                {currentPart && (
                  <div className="part-info-summary">
                    <h6>Parça Bilgileri</h6>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">ID:</span>
                        <span className="info-value">{currentPart.id}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Oluşturulma:</span>
                        <span className="info-value">
                          {new Date(currentPart.created_at).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Son Güncelleme:</span>
                        <span className="info-value">
                          {new Date(currentPart.updated_at || currentPart.created_at).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <Alert variant="info" className="mt-3 mb-0">
                  <i className="bi bi-info-circle-fill me-2"></i>
                  {currentPart ? (
                    'Dikkat: Parçayı güncellemek envanter durumunu etkileyebilir.'
                  ) : (
                    'Yeni parça oluşturmak, genel envantere eklenecektir.'
                  )}
                </Alert>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowModal(false)}
                >
                  İptal
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isSubmitting}
                  className={isSubmitting ? 'is-loading' : ''}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Kaydediliyor...
                    </>
                  ) : currentPart ? (
                    <>Güncelle</>
                  ) : (
                    <>Oluştur</>
                  )}
                </Button>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal>
    </Container>
  );
};

export default PartsManagement;