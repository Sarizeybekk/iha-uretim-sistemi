// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Spinner, Badge, ProgressBar, Nav, Button, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import { getInventory, getAircraft, getUserTeams ,getPartsCount,getLowStockCount,getUserTeamsInfo,getMissingParts} from '../services/dashService';
import { toast } from 'react-toastify';

import '../styles/Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [userTeamsInfo, setUserTeamsInfo] = useState([]);
  const [teamName, setTeamName] = useState('');
  const [teamType, setTeamType] = useState('');
  const [inventory, setInventory] = useState([]);
  const [aircraft, setAircraft] = useState([]);
  const [userTeam, setUserTeam] = useState(null);
  const [missingParts, setMissingParts] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [partsCount, setPartsCount] = useState(0);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalParts: 0,
    totalAircraft: 0,
    lowStockItems: 0,
    completionRate: 0
  });
  const [activeTab, setActiveTab] = useState('overview');
// 🟢 Yeni state: Tüm takımların bilgisi
const [teams, setTeams] = useState([]);  // Tüm takımlar

useEffect(() => {
  const fetchData = async () => {
    try {
      console.log('📡 Veri çekme işlemi başladı...');

      // 🟢 600ms bekleme (simülasyon için)
      await new Promise(resolve => setTimeout(resolve, 600));

      // 🟢 API isteklerini aynı anda yap
      const [
        inventoryData,
        aircraftData,
        userTeamsData,
        partsData,
        lowStockData,
        teamsInfo,
        missingPartsData  // 🆕 Eksik parçalar verisi
      ] = await Promise.all([
        getInventory(),
        getAircraft(),
        getUserTeams(),
        getPartsCount(),
        getLowStockCount(),
        getUserTeamsInfo(),
        getMissingParts()  // 🆕 Yeni API çağrısı
      ]);

      // 🟢 Verileri state'e ata
      setInventory(inventoryData);
      setAircraft(aircraftData);
      setPartsCount(partsData);
      setLowStockCount(lowStockData);
      setUserTeamsInfo(teamsInfo);
      setMissingParts(missingPartsData);  // 🆕 Eksik parçaları state'e ata

      console.log('🟢 Eksik parçalar başarıyla alındı:', missingPartsData);
      console.log('🟢 Takım bilgileri başarıyla alındı:', teamsInfo);

      // 🟢 Tüm takımları sakla
      const allTeams = teamsInfo.map(team => ({
        name: team.takim_detay?.ad || 'Bilinmeyen Takım',
        type: team.takim_detay?.takim_tipi_adi || 'Bilinmeyen Tip',
        members: team.takim_detay?.personel_sayisi || 0,
        description: team.takim_detay?.aciklama || 'Açıklama yok'
      }));
      setTeams(allTeams);

      // 🟢 Dashboard istatistiklerini hesapla
      const totalParts = inventoryData.reduce((sum, item) => sum + item.miktar, 0);
      const maxAircraftCapacity = 20;
      const totalProducedAircraft = aircraftData.length;
      const completionRate = Math.min(100, Math.round((totalProducedAircraft / maxAircraftCapacity) * 100));

      setDashboardStats({
        totalParts,
        totalAircraft: totalProducedAircraft,
        lowStockItems: lowStockData,
        completionRate
      });

      // 🟢 Kullanıcının takımını belirle
      if (userTeamsData && userTeamsData.length > 0) {
        setUserTeam(userTeamsData[0]);
      }

    } catch (error) {
      console.error('🔴 Hata: Veriler alınırken bir sorun oluştu:', error);
      setError('Veriler yüklenirken bir hata oluştu.');
      toast.error('Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
      console.log('✅ Veri çekme işlemi tamamlandı!');
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
                  <h3 className="stat-value">{partsCount}</h3>
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
                  <h3 className="stat-value">{lowStockCount}</h3>
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
                  <h6 className="stat-label">Üretim Durumu</h6>
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
  <Card className="dashboard-card h-100 shadow-sm border-0 rounded-4 bg-white">
    <Card.Header className="d-flex align-items-center justify-content-between bg-light border-bottom-0 rounded-top-4">
      <div className="d-flex align-items-center">
        <span className="me-2 text-primary fs-4">👥</span>
        <h5 className="mb-0 text-dark fw-bold">Takım Bilgileri</h5>
      </div>
      {teams.length > 0 && (
        <Badge bg="success" pill className="text-white shadow-sm">Aktif</Badge>
      )}
    </Card.Header>
    <Card.Body className="p-4 bg-white">
      {teams.length > 0 ? (
        teams.map((team, index) => (
          <div key={index} className="team-info mb-4 p-3 bg-light shadow-sm rounded-3">
            <div className="team-header d-flex align-items-center mb-3">
              <div className="team-avatar me-3">
                <div className="team-avatar-circle bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '50px', height: '50px', fontSize: '20px' }}>
                  {team.type.charAt(0).toUpperCase() || "?"}
                </div>
              </div>
              <div>
                <h4 className="team-name mb-1 text-dark fw-bold">{team.name}</h4>
                <Badge bg="info" className="text-white shadow-sm">{team.type}</Badge>
              </div>
            </div>

            <p className="text-muted mb-2" style={{ fontStyle: 'italic', fontSize: '14px' }}>
              {team.description || 'Açıklama yok.'}
            </p>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="section-title mb-0 text-dark fw-semibold">Üye Sayısı:</h6>
              <Badge bg="secondary" className="text-white shadow-sm">{team.members} Kişi</Badge>
            </div>

            <div className="progress mb-3 shadow-sm" style={{ height: '8px', borderRadius: '5px' }}>
              <div
                className="progress-bar bg-success"
                role="progressbar"
                style={{ width: `${Math.min(100, team.members * 10)}%` }}
                aria-valuenow={team.members}
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>

            <div className="d-grid gap-2">
              <Link to="/parts" className="btn btn-outline-primary btn-sm rounded-pill shadow-sm">
                🛠️ Parça Yönetimi
              </Link>
            </div>

            {index < teams.length - 1 && <hr className="my-4 text-secondary" />} {/* Takımlar arasında çizgi */}
          </div>
        ))
      ) : (
        <Alert variant="warning" className="mb-0 d-flex align-items-start shadow-sm rounded-3">
          <span className="me-2">ℹ️</span>
          <div>
            <p className="mb-2 fw-bold text-dark">Herhangi bir takıma atanmamışsınız.</p>
            <p className="mb-3 text-muted">Takım ataması için lütfen yöneticinizle iletişime geçin.</p>
            <Button variant="outline-primary" size="sm" className="rounded-pill shadow-sm">
              Takım Talep Et
            </Button>
          </div>
        </Alert>
      )}
    </Card.Body>
    {teams.length > 0 && (
      <Card.Footer className="text-center bg-light rounded-bottom-4 border-top-0">
        <small className="text-muted">
          Son güncelleme: {new Date().toLocaleDateString()}
        </small>
      </Card.Footer>
    )}
  </Card>
</Col>

          {/* Inventory Summary Card */}
         <Col md={6} lg={4} className="mb-4">
  <Card className="dashboard-card h-100 shadow-sm border-0 rounded-4 bg-white">
    <Card.Header className="d-flex align-items-center justify-content-between bg-light border-bottom-0 rounded-top-4">
      <div className="d-flex align-items-center">
        <span className="me-2 text-primary fs-4">📦</span>
        <h5 className="mb-0 text-dark fw-bold">Eksik Parçalar</h5>
      </div>
    </Card.Header>

    <Card.Body className="p-4 bg-white">
      {missingParts.length > 0 ? (
        <ul className="list-group mb-4">
          {missingParts.map((item, index) => (
            <li
              key={index}
              className="list-group-item d-flex justify-content-between align-items-center bg-light shadow-sm rounded-3 mb-2"
            >
              <span className="fw-bold text-danger">
                {item.parca_tipi_adi} ({item.ucak_tipi_kodu})
              </span>
              <Badge bg="danger" className="shadow-sm">
                {item.mevcut_adet} / {item.minimum_esik} Adet
              </Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted text-center mb-4">Eksik parça yok.</p>
      )}

      {/* 🟢 Profesyonel Görünümlü Envanteri Görüntüle Butonu */}
      <Link
        to="/inventory"
        className="btn btn-info text-white w-100 rounded-3 shadow-sm"
        style={{ fontWeight: 'bold' }}
      >
        📋 Envanteri Görüntüle
      </Link>
    </Card.Body>

    <Card.Footer className="text-center bg-light rounded-bottom-4 border-top-0">
      <small className="text-muted">
        Son güncelleme: {new Date().toLocaleDateString()}
      </small>
    </Card.Footer>
  </Card>
</Col>






          {/* Aircraft Summary Card */}
          <Col md={6} lg={4} className="mb-4">
  <Card className="dashboard-card h-100 shadow-sm border-0 rounded-4 bg-white">
    <Card.Header className="d-flex align-items-center justify-content-between bg-light border-bottom-0 rounded-top-4">
      <div className="d-flex align-items-center">
        <span className="me-2 text-primary fs-4">✈️</span>
        <h5 className="mb-0 text-dark fw-bold">Üretilen Uçaklar</h5>
      </div>
      <Badge bg="success" pill>Toplam: {aircraft.length} Adet</Badge>
    </Card.Header>
    <Card.Body className="p-4 bg-white">

      {/* 🟢 Toplam Üretilen Uçak */}
      <div className="total-aircraft text-center p-3 mb-4 rounded bg-light shadow-sm">
        <h6 className="text-dark fw-bold mb-2">Toplam Üretilen Uçak</h6>
        <h4 className="text-success fw-bold">{aircraft.length} Adet</h4>
        <ProgressBar
          variant="success"
          now={Math.min(100, aircraft.length * 10)}
          className="mt-2"
        />
      </div>

      {/* 🟢 Uçak Tipleri (2 Kart Yukarıda) */}
      <Row className="gy-3 mb-3">
        <Col xs={6}>
          <Card className="h-100 shadow-sm border-0 rounded-3">
            <Card.Body className="text-center">
              <span className="fs-3 text-primary">🛩️</span>
              <h6 className="mt-2 text-dark fw-bold">TB2</h6>
              <p className="text-muted mb-1">
                {aircraft.filter(a => a?.ucak_tipi?.name?.toUpperCase() === 'TB2').length} Adet Üretildi
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6}>
          <Card className="h-100 shadow-sm border-0 rounded-3">
            <Card.Body className="text-center">
              <span className="fs-3 text-warning">✈️</span>
              <h6 className="mt-2 text-dark fw-bold">TB3</h6>
              <p className="text-muted mb-1">
                {aircraft.filter(a => a.ucak_tipi_adi?.toUpperCase() === 'TB3').length} Adet Üretildi
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* 🟢 Uçak Tipleri (2 Kart Aşağıda) */}
      <Row className="gy-3">
        <Col xs={6}>
          <Card className="h-100 shadow-sm border-0 rounded-3">
            <Card.Body className="text-center">
              <span className="fs-3 text-info">🛫</span>
              <h6 className="mt-2 text-dark fw-bold">AKINCI</h6>
              <p className="text-muted mb-1">
                {aircraft.filter(a => a.ucak_tipi_adi?.toUpperCase() === 'AKINCI').length} Adet Üretildi
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6}>
          <Card className="h-100 shadow-sm border-0 rounded-3">
            <Card.Body className="text-center">
              <span className="fs-3 text-danger">🚀</span>
              <h6 className="mt-2 text-dark fw-bold">KIZILELMA</h6>
              <p className="text-muted mb-1">
                {aircraft.filter(a => a.ucak_tipi_adi?.toUpperCase() === 'KIZILELMA').length
} Adet Üretildi
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* 🟢 Uçak Montaj Butonu */}
      <Link
        to="/assembly"
        className="btn btn-success text-white w-100 mt-4 rounded-3 shadow-sm"
        style={{ fontWeight: 'bold' }}
      >
        🛠️ Uçak Montaj
      </Link>
    </Card.Body>

    <Card.Footer className="text-center bg-light rounded-bottom-4 border-top-0">
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