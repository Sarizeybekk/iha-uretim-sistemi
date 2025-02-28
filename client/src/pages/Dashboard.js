// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Spinner, Badge, ProgressBar, Nav, Button, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import { getInventory, getAircraft, getUserTeams } from '../services/apiService';
import { toast } from 'react-toastify';

import '../styles/Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [aircraft, setAircraft] = useState([]);
  const [userTeam, setUserTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lowStockItems, setLowStockItems] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalParts: 0,
    totalAircraft: 0,
    lowStockItems: 0,
    completionRate: 0
  });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate loading for better UX
        await new Promise(resolve => setTimeout(resolve, 600));

        // Get current user data including team
        const userData = await getCurrentUser();
        setUser(userData);

        // Get inventory and aircraft data
        const [inventoryData, aircraftData, userTeamsData] = await Promise.all([
          getInventory(),
          getAircraft(),
          getUserTeams()
        ]);

        setInventory(inventoryData);
        setAircraft(aircraftData);
        setLowStockItems(inventoryData.filter(item => item.miktar < 5) || []);

        // Calculate dashboard stats
        const totalParts = inventoryData.reduce((sum, item) => sum + item.miktar, 0);
        const lowStockCount = inventoryData.filter(item => item.miktar < 5).length;

        // Calculate theoretical completion rate (how many complete aircraft can be built)
        let completionRate = 0;

        if (inventoryData.length > 0) {
          // Simplified calculation for completion rate
          const partTypeCounts = {
            'kanat': inventoryData.filter(i => i.parca_tipi?.name?.toLowerCase() === 'kanat').reduce((sum, i) => sum + i.miktar, 0),
            'gövde': inventoryData.filter(i => i.parca_tipi?.name?.toLowerCase() === 'gövde').reduce((sum, i) => sum + i.miktar, 0),
            'kuyruk': inventoryData.filter(i => i.parca_tipi?.name?.toLowerCase() === 'kuyruk').reduce((sum, i) => sum + i.miktar, 0),
            'aviyonik': inventoryData.filter(i => i.parca_tipi?.name?.toLowerCase() === 'aviyonik').reduce((sum, i) => sum + i.miktar, 0)
          };

          const minPartCount = Math.min(...Object.values(partTypeCounts));
          const potentialAircraft = minPartCount;
          const builtAircraft = aircraftData.length;

          completionRate = potentialAircraft > 0
            ? Math.min(100, Math.round((builtAircraft / potentialAircraft) * 100))
            : 100;
        }

        setDashboardStats({
          totalParts,
          totalAircraft: aircraftData.length,
          lowStockItems: lowStockCount,
          completionRate
        });

        // Set user's team if available
        if (userTeamsData && userTeamsData.length > 0) {
          setUserTeam(userTeamsData[0]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Veriler yüklenirken bir hata oluştu.');
        toast.error('Veriler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter inventory by user's team type (if applicable)
  const getTeamStats = () => {
    if (!userTeam) return { total: 0, count: 0 };

    // Find parts relevant to user's team
    const teamParts = inventory.filter(item =>
      item.parca_tipi && item.parca_tipi.name &&
      item.parca_tipi.name.toLowerCase() === userTeam.takim.takim_tipi.toLowerCase()
    );

    return {
      total: teamParts.length,
      count: teamParts.reduce((sum, item) => sum + item.miktar, 0)
    };
  };

  // Get status color based on completion percentage
  const getStatusColor = (percentage) => {
    if (percentage < 30) return 'danger';
    if (percentage < 70) return 'warning';
    return 'success';
  };

  const teamStats = getTeamStats();

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-content">
          <div className="loading-logo">
            <h2>Hava Aracı Üretim Sistemi</h2>
          </div>
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Veriler Yükleniyor</p>
          <div className="loading-progress">
            <ProgressBar animated now={100} className="loading-bar" />
          </div>
        </div>
      </div>
    );
  }

  // Dashboard header with welcome message and actions
  const DashboardHeader = () => (
    <div className="dashboard-header mb-4 d-flex justify-content-between align-items-center">
      <div>
        <h2 className="mb-1">
          Hava Aracı Üretim Sistemi
        </h2>
        <p className="text-muted mb-0">
          Hoş geldiniz, <span className="fw-bold">{user?.username || 'Kullanıcı'}</span>
          {userTeam && <span> | {userTeam.takim.name}</span>}
        </p>
      </div>

      <div className="dashboard-actions d-flex">
        <div className="search-bar me-2">
          <div className="input-group">
            <input type="text" className="form-control form-control-sm" placeholder="Arama..." />
            <button className="btn btn-outline-secondary btn-sm" type="button">
              Ara
            </button>
          </div>
        </div>

        <Dropdown className="me-2">
          <Dropdown.Toggle variant="light" size="sm" id="notification-dropdown" className="notification-btn">
            Bildirimler
            {lowStockItems.length > 0 && (
              <span className="notification-badge">{lowStockItems.length}</span>
            )}
          </Dropdown.Toggle>
          <Dropdown.Menu align="end" className="notification-menu">
            <Dropdown.Header>Bildirimler</Dropdown.Header>
            {lowStockItems.length > 0 ? (
              <>
                {lowStockItems.slice(0, 3).map((item, index) => (
                  <Dropdown.Item key={index} className="notification-item">
                    <span>{item.parca_tipi?.name || 'Parça'} stok seviyesi düşük: {item.miktar} adet</span>
                  </Dropdown.Item>
                ))}
                {lowStockItems.length > 3 && (
                  <Dropdown.Item as={Link} to="/inventory" className="text-center">
                    <small>+ {lowStockItems.length - 3} bildirim daha</small>
                  </Dropdown.Item>
                )}
              </>
            ) : (
              <Dropdown.Item className="text-center">Yeni bildirim yok</Dropdown.Item>
            )}
          </Dropdown.Menu>
        </Dropdown>

        <Dropdown>
          <Dropdown.Toggle variant="light" size="sm" id="settings-dropdown">
            Ayarlar
          </Dropdown.Toggle>
          <Dropdown.Menu align="end">
            <Dropdown.Item as={Link} to="/profile">Profil</Dropdown.Item>
            <Dropdown.Item as={Link} to="/settings">Ayarlar</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item as={Link} to="/logout">Çıkış</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </div>
  );

  // Navigation tabs for the dashboard
  const DashboardNav = () => (
    <Nav variant="tabs" className="dashboard-nav mb-4">
      <Nav.Item>
        <Nav.Link
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Genel Bakış
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link
          className={activeTab === 'team' ? 'active' : ''}
          onClick={() => setActiveTab('team')}
        >
          Takım
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link
          className={activeTab === 'inventory' ? 'active' : ''}
          onClick={() => setActiveTab('inventory')}
        >
          Envanter
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link
          className={activeTab === 'production' ? 'active' : ''}
          onClick={() => setActiveTab('production')}
        >
          Üretim
        </Nav.Link>
      </Nav.Item>
    </Nav>
  );

  return (
    <div className="dashboard-container">
      <Container fluid className="px-4 py-4">
        <DashboardHeader />

        {error && (
          <Alert variant="danger" className="d-flex align-items-center">
            {error}
          </Alert>
        )}

        <DashboardNav />

        {/* Stats Summary Cards */}
        <Row className="stats-overview mb-4">
          <Col md={3} sm={6} className="mb-3">
            <Card className="dashboard-stat-card h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="stat-icon text-primary">
                  <span className="stat-icon-text">📦</span>
                </div>
                <div className="ms-3">
                  <h6 className="stat-label">Toplam Parça</h6>
                  <h3 className="stat-value">{dashboardStats.totalParts}</h3>
                </div>
              </Card.Body>
              <div className="card-footer-indicator bg-primary"></div>
            </Card>
          </Col>

          <Col md={3} sm={6} className="mb-3">
            <Card className="dashboard-stat-card h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="stat-icon text-success">
                  <span className="stat-icon-text">✈️</span>
                </div>
                <div className="ms-3">
                  <h6 className="stat-label">Üretilen Uçak</h6>
                  <h3 className="stat-value">{dashboardStats.totalAircraft}</h3>
                </div>
              </Card.Body>
              <div className="card-footer-indicator bg-success"></div>
            </Card>
          </Col>

          <Col md={3} sm={6} className="mb-3">
            <Card className="dashboard-stat-card h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="stat-icon text-warning">
                  <span className="stat-icon-text">⚠️</span>
                </div>
                <div className="ms-3">
                  <h6 className="stat-label">Düşük Stok</h6>
                  <h3 className="stat-value">{dashboardStats.lowStockItems}</h3>
                </div>
              </Card.Body>
              <div className="card-footer-indicator bg-warning"></div>
            </Card>
          </Col>

          <Col md={3} sm={6} className="mb-3">
            <Card className="dashboard-stat-card h-100">
              <Card.Body className="d-flex align-items-center">
                <div className="stat-icon text-info">
                  <span className="stat-icon-text">📊</span>
                </div>
                <div className="ms-3">
                  <h6 className="stat-label">Tamamlanma Oranı</h6>
                  <h3 className="stat-value">{dashboardStats.completionRate}%</h3>
                </div>
              </Card.Body>
              <div className="card-footer-indicator bg-info"></div>
            </Card>
          </Col>
        </Row>

        {/* Main Content Area */}
        <Row className="main-content">
          {/* User Team Info Card */}
          <Col md={6} lg={4} className="mb-4">
            <Card className="dashboard-card h-100 shadow-sm">
              <Card.Header className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <span className="me-2">👥</span>
                  <h5 className="mb-0">Takım Bilgileri</h5>
                </div>
                {userTeam && (
                  <Badge bg="primary" pill>Aktif</Badge>
                )}
              </Card.Header>
              <Card.Body>
                {userTeam ? (
                  <>
                    <div className="team-info mb-4">
                      <div className="team-header d-flex align-items-center mb-3">
                        <div className="team-avatar me-3">
                          <div className="team-avatar-circle">
                            {userTeam?.takim?.takim_tipi?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                        </div>
                        <div>
                          <h4 className="team-name mb-1">{userTeam.takim.name}</h4>
                          <Badge bg="info">{userTeam.takim.takim_tipi}</Badge>
                        </div>
                      </div>

                      <div className="team-stats mt-4">
                        <div className="team-stat-item">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <div className="stat-label">Üretilen Parça Sayısı</div>
                            <div className="stat-value-sm">{teamStats.count}</div>
                          </div>
                          <ProgressBar
                            now={Math.min(100, teamStats.count / 5)}
                            variant="success"
                            className="team-progress"
                          />
                        </div>

                        <div className="team-stat-item mt-3">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <div className="stat-label">Parça Çeşidi</div>
                            <div className="stat-value-sm">{teamStats.total}</div>
                          </div>
                          <ProgressBar
                            now={Math.min(100, teamStats.total * 25)}
                            variant="info"
                            className="team-progress"
                          />
                        </div>

                        <div className="team-activity mt-4">
                          <h6 className="section-title">Son Aktiviteler</h6>
                          <div className="activity-timeline">
                            <div className="activity-item">
                              <div className="activity-icon">
                                <span>✅</span>
                              </div>
                              <div className="activity-content">
                                <div className="activity-text">Kanat parçası üretildi</div>
                                <div className="activity-time">Bugün, 10:23</div>
                              </div>
                            </div>
                            <div className="activity-item">
                              <div className="activity-icon">
                                <span>🕒</span>
                              </div>
                              <div className="activity-content">
                                <div className="activity-text">Toplantı planlandı</div>
                                <div className="activity-time">Dün, 15:30</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="d-grid gap-2">
                      <Link to="/parts" className="btn btn-primary">
                        Parça Yönetimi
                      </Link>
                    </div>
                  </>
                ) : (
                  <Alert variant="warning" className="mb-0 d-flex align-items-start">
                    <span className="me-2">ℹ️</span>
                    <div>
                      <p className="mb-2 fw-bold">Herhangi bir takıma atanmamışsınız.</p>
                      <p className="mb-3">Takım ataması için lütfen yöneticinizle iletişime geçin.</p>
                      <Button variant="outline-primary" size="sm">
                        Takım Talep Et
                      </Button>
                    </div>
                  </Alert>
                )}
              </Card.Body>
              {userTeam && (
                <Card.Footer className="text-center">
                  <small className="text-muted">
                    Son güncelleme: {new Date().toLocaleDateString()}
                  </small>
                </Card.Footer>
              )}
            </Card>
          </Col>

          {/* Inventory Summary Card */}
          <Col md={6} lg={4} className="mb-4">
            <Card className="dashboard-card h-100 shadow-sm">
              <Card.Header className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <span className="me-2">🏭</span>
                  <h5 className="mb-0">Envanter Özeti</h5>
                </div>
                <Badge bg={dashboardStats.lowStockItems > 0 ? "warning" : "success"} pill>
                  {dashboardStats.lowStockItems > 0 ? `${dashboardStats.lowStockItems} Düşük Stok` : "Stok Normal"}
                </Badge>
              </Card.Header>
              <Card.Body>
                <div className="inventory-summary mb-4">
                  <Row className="mb-4 inventory-overview">
                    <Col>
                      <div className="text-center p-3 rounded bg-light inventory-stat">
                        <div className="inventory-icon">
                          <span>🔧</span>
                        </div>
                        <div className="stat-label">Toplam Parça</div>
                        <div className="stat-value text-primary">
                          {inventory.reduce((sum, item) => sum + item.miktar, 0)}
                        </div>
                      </div>
                    </Col>
                    <Col>
                      <div className="text-center p-3 rounded bg-light inventory-stat">
                        <div className="inventory-icon">
                          <span>🚀</span>
                        </div>
                        <div className="stat-label">Parça Çeşidi</div>
                        <div className="stat-value text-primary">{inventory.length}</div>
                      </div>
                    </Col>
                  </Row>

                  <div className="part-types mt-4">
                    <h6 className="section-title d-flex justify-content-between align-items-center">
                      <span>Parça Türleri</span>
                      <Badge bg="light" text="dark" className="stock-status-badge">Stok Durumu</Badge>
                    </h6>

                    <div className="part-types-container">
                      {['Kanat', 'Gövde', 'Kuyruk', 'Aviyonik'].map(type => {
                        const typeItems = inventory.filter(item =>
                          item.parca_tipi && item.parca_tipi.name &&
                          item.parca_tipi.name.toLowerCase() === type.toLowerCase()
                        );
                        const count = typeItems.reduce((sum, item) => sum + item.miktar, 0);
                        const maxParts = 50; // Theoretical maximum for visualization
                        const percentage = Math.min(100, (count / maxParts) * 100);
                        const statusVariant = count < 5 ? 'danger' : count < 15 ? 'warning' : 'success';

                        return (
                          <div key={type} className="part-type-item mb-3">
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="d-flex align-items-center">
                                <span className={`part-type-indicator bg-${statusVariant}`}></span>
                                <span className="type-name">{type}</span>
                              </div>
                              <Badge bg={statusVariant} className="part-count-badge">
                                {count} adet
                              </Badge>
                            </div>
                            <ProgressBar
                              now={percentage}
                              variant={statusVariant}
                              className="mt-2 inventory-progress"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <Link to="/inventory" className="btn btn-info">
                    Envanteri Görüntüle
                  </Link>
                </div>
              </Card.Body>
              <Card.Footer className="text-center">
                <small className="text-muted">
                  Son güncelleme: {new Date().toLocaleDateString()}
                </small>
              </Card.Footer>
            </Card>
          </Col>

          {/* Aircraft Summary Card */}
          <Col md={6} lg={4} className="mb-4">
            <Card className="dashboard-card h-100 shadow-sm">
              <Card.Header className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <span className="me-2">✈️</span>
                  <h5 className="mb-0">Üretilen Uçaklar</h5>
                </div>
                <Badge bg="success" pill>Toplam: {aircraft.length}</Badge>
              </Card.Header>
              <Card.Body>
                <div className="aircraft-summary mb-4">
                  <div className="total-aircraft text-center p-3 rounded bg-light mb-4">
                    <div className="aircraft-icon mb-2">
                      <span>✈️</span>
                    </div>
                    <div className="stat-label">Toplam Üretilen Uçak</div>
                    <div className="stat-value text-success">{aircraft.length}</div>
                    <ProgressBar
                      variant="success"
                      now={Math.min(100, aircraft.length * 10)}
                      className="mt-2 aircraft-progress"
                    />
                  </div>

                  <div className="aircraft-types mt-4">
                    <h6 className="section-title">Uçak Tipleri</h6>

                    <Row className="aircraft-grid">
                      {['TB2', 'TB3', 'AKINCI', 'KIZILELMA'].map(type => {
                        const count = aircraft.filter(a =>
                          a.ucak_tipi && a.ucak_tipi.name &&
                          a.ucak_tipi.name.toUpperCase() === type.toUpperCase()
                        ).length;

                        const maxCount = 10; // For visualization
                        const percentage = Math.min(100, (count / maxCount) * 100);

                        return (
                          <Col sm={6} key={type} className="mb-3">
                            <div className="aircraft-type-card">
                              <div className="aircraft-type-inner p-2 text-center border rounded">
                                <div className="aircraft-type-icon">
                                  {type === 'TB2' && <span>🛩️</span>}
                                  {type === 'TB3' && <span>✈️</span>}
                                  {type === 'AKINCI' && <span>🛫</span>}
                                  {type === 'KIZILELMA' && <span>🚀</span>}
                                </div>
                                <div className="type-name fw-bold">{type}</div>
                                <Badge bg="primary" className="my-1 aircraft-count">
                                  {count} adet
                                </Badge>
                                <ProgressBar
                                  now={percentage}
                                  variant="primary"
                                  className="mt-2 aircraft-type-progress"
                                />
                              </div>
                            </div>
                          </Col>
                        );
                      })}
                    </Row>
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <Link to="/assembly" className="btn btn-success">
                    Uçak Montaj
                  </Link>
                </div>
              </Card.Body>
              <Card.Footer className="text-center">
                <small className="text-muted">
                  Son güncelleme: {new Date().toLocaleDateString()}
                </small>
              </Card.Footer>
            </Card>
          </Col>
        </Row>

        {/* Quick Links Row */}
        <Row className="mt-2">
          <Col>
            <Card className="dashboard-card shadow-sm quick-links-card">
              <Card.Body>
                <h5 className="mb-3 d-flex align-items-center">
                  <span className="me-2">✅</span>
                  Hızlı Erişim
                </h5>
                <div className="d-flex flex-wrap gap-2 quick-links">
                  <Link to="/parts" className="btn btn-outline-primary quick-link">
                    <span className="quick-link-icon">🔧</span>
                    <span>Parça Yönetimi</span>
                  </Link>
                  <Link to="/assembly" className="btn btn-outline-success quick-link">
                    <span className="quick-link-icon">✈️</span>
                    <span>Uçak Montaj</span>
                  </Link>
                  <Link to="/inventory" className="btn btn-outline-info quick-link">
                    <span className="quick-link-icon">🏭</span>
                    <span>Envanter</span>
                  </Link>
                  <Link to="/teams" className="btn btn-outline-secondary quick-link">
                    <span className="quick-link-icon">👥</span>
                    <span>Takımlar</span>
                  </Link>
                  <Link to="/reports" className="btn btn-outline-dark quick-link">
                    <span className="quick-link-icon">📊</span>
                    <span>Raporlar</span>
                  </Link>
                  <Link to="/security" className="btn btn-outline-danger quick-link">
                    <span className="quick-link-icon">🔒</span>
                    <span>Güvenlik</span>
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Dashboard;